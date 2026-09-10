import { mkdir, writeFile, readFile, rm, readdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import JSZip from 'jszip'
import { DEFAULT_KEYCHAIN_CONFIG } from './defaultKeychainConfig.js'
import { normalizeBatches, validateBatches } from './normalizeBatches.js'
import { promoterFilename } from './sanitizeFilename.js'
import { RAW_SUPERVISOR_BATCHES } from './promotersData.js'

const jobs = new Map()

function minimalStlBuffer(label) {
  const text = `solid ${label}\nendsolid ${label}\n`
  return Buffer.from(text, 'utf8')
}

/**
 * @param {object} deps
 * @param {(config: object) => Promise<{content: Buffer, extension: string, contentType: string}>} deps.exportKeychain
 */
export function createBatchJobManager({ exportKeychain }) {
  async function startJob({
    supervisors = null,
    config = {},
    mockExport = process.env.BATCH_MOCK_EXPORT === '1',
  } = {}) {
    const raw = supervisors?.length ? supervisors : RAW_SUPERVISOR_BATCHES
    const { lots, warnings, summary } = normalizeBatches(raw)
    const { ok, errors } = validateBatches(lots)
    if (!ok) {
      const err = new Error('Validação falhou')
      err.details = errors
      throw err
    }

    const jobId = randomUUID()
    const workDir = join(tmpdir(), `nfc-batch-${jobId}`)
    await mkdir(workDir, { recursive: true })

    const job = {
      id: jobId,
      status: 'queued',
      createdAt: new Date().toISOString(),
      workDir,
      warnings,
      summary,
      config: { ...DEFAULT_KEYCHAIN_CONFIG, ...config, show2ndLine: false, line2: '' },
      mockExport,
      progress: {
        phase: 'queued',
        supervisorIndex: 0,
        supervisorTotal: lots.length,
        supervisorName: '',
        promoterIndex: 0,
        promoterTotal: 0,
        promoterName: '',
        generated: 0,
        failed: 0,
        percent: 0,
      },
      lots: lots.map((lot) => ({
        ...lot,
        status: 'pending',
        success: 0,
        failed: 0,
        failures: [],
        files: [],
        zipPath: null,
        zipFilename: lot.zipFilename,
      })),
      error: null,
    }

    jobs.set(jobId, job)
    setImmediate(() => runJob(job).catch((e) => {
      job.status = 'failed'
      job.error = e.message
      job.progress.phase = 'failed'
    }))

    return { jobId, summary, warnings, lots: lots.map((l) => ({
      supervisor: l.supervisor,
      code: l.code,
      promoterCount: l.promoters.length,
      zipFilename: l.zipFilename,
    })) }
  }

  async function runJob(job) {
    job.status = 'running'
    job.progress.phase = 'generating'
    const totalPromoters = job.summary.totalPromoters
    let doneCount = 0

    for (let si = 0; si < job.lots.length; si++) {
      const lot = job.lots[si]
      lot.status = 'generating'
      job.progress.supervisorIndex = si + 1
      job.progress.supervisorTotal = job.lots.length
      job.progress.supervisorName = lot.supervisor
      job.progress.promoterTotal = lot.promoters.length

      const lotDir = join(job.workDir, lot.zipBase)
      await mkdir(lotDir, { recursive: true })
      const usedFilenames = new Map()

      for (let pi = 0; pi < lot.promoters.length; pi++) {
        const promoterName = lot.promoters[pi]
        job.progress.promoterIndex = pi + 1
        job.progress.promoterName = promoterName
        job.progress.percent = Math.round((doneCount / totalPromoters) * 100)

        try {
          let content
          let extension

          if (job.mockExport) {
            content = minimalStlBuffer(promoterName)
            extension = 'stl'
          } else {
            const result = await exportKeychain({
              ...job.config,
              name: promoterName,
            })
            content = result.content
            extension = result.extension
          }

          let filename = promoterFilename(promoterName, extension)
          if (usedFilenames.has(filename)) {
            const n = usedFilenames.get(filename) + 1
            usedFilenames.set(filename, n)
            const base = filename.replace(/\.[^.]+$/, '')
            filename = `${base}_${n}.${extension}`
          } else {
            usedFilenames.set(filename, 1)
          }

          const filePath = join(lotDir, filename)
          await writeFile(filePath, content)
          lot.files.push({ name: filename, path: filePath, promoter: promoterName })
          lot.success += 1
          job.progress.generated += 1
        } catch (err) {
          lot.failed += 1
          job.progress.failed += 1
          lot.failures.push({
            promoter: promoterName,
            reason: err.message || String(err),
          })
        }

        doneCount += 1
        job.progress.percent = Math.round((doneCount / totalPromoters) * 100)
      }

      // ZIP do supervisor mesmo com falhas parciais (se houver algum sucesso)
      if (lot.files.length > 0) {
        const zip = new JSZip()
        for (const file of lot.files) {
          const buf = await readFile(file.path)
          zip.file(file.name, buf)
        }
        const zipBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
        const zipPath = join(job.workDir, lot.zipFilename)
        await writeFile(zipPath, zipBuf)
        lot.zipPath = zipPath
        lot.status = lot.failed > 0 ? 'partial' : 'ready'
      } else {
        lot.status = 'failed'
      }
    }

    job.progress.phase = 'done'
    job.progress.percent = 100
    job.status = 'completed'
    job.completedAt = new Date().toISOString()
  }

  function getJob(jobId) {
    return jobs.get(jobId) || null
  }

  function getPublicStatus(jobId) {
    const job = jobs.get(jobId)
    if (!job) return null
    return {
      id: job.id,
      status: job.status,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt || null,
      warnings: job.warnings,
      summary: {
        ...job.summary,
        generated: job.progress.generated,
        failed: job.progress.failed,
      },
      progress: job.progress,
      lots: job.lots.map((lot) => ({
        supervisor: lot.supervisor,
        code: lot.code,
        zipFilename: lot.zipFilename,
        promoterCount: lot.promoters.length,
        status: lot.status,
        success: lot.success,
        failed: lot.failed,
        failures: lot.failures,
        downloadReady: Boolean(lot.zipPath),
      })),
    }
  }

  async function readLotZip(jobId, zipFilename) {
    const job = jobs.get(jobId)
    if (!job) return null
    const lot = job.lots.find((l) => l.zipFilename === zipFilename || l.zipBase === zipFilename.replace(/\.zip$/i, ''))
    if (!lot?.zipPath) return null
    const content = await readFile(lot.zipPath)
    return { content, filename: lot.zipFilename }
  }

  async function buildAllZipsBundle(jobId) {
    const job = jobs.get(jobId)
    if (!job || job.status !== 'completed') return null
    const zip = new JSZip()
    let count = 0
    for (const lot of job.lots) {
      if (!lot.zipPath) continue
      zip.file(lot.zipFilename, await readFile(lot.zipPath))
      count += 1
    }
    if (count === 0) return null
    const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    return { content, filename: `chaveiros_por_supervisor_${jobId.slice(0, 8)}.zip` }
  }

  async function cleanupJob(jobId) {
    const job = jobs.get(jobId)
    if (!job) return
    await rm(job.workDir, { recursive: true, force: true }).catch(() => {})
    jobs.delete(jobId)
  }

  /** Lista arquivos de um ZIP já gerado (para testes). */
  async function listLotFiles(jobId, zipFilename) {
    const job = jobs.get(jobId)
    if (!job) return null
    const lot = job.lots.find((l) => l.zipFilename === zipFilename)
    if (!lot) return null
    return lot.files.map((f) => f.name)
  }

  async function listWorkDir(jobId) {
    const job = jobs.get(jobId)
    if (!job) return []
    return readdir(job.workDir)
  }

  return {
    startJob,
    getJob,
    getPublicStatus,
    readLotZip,
    buildAllZipsBundle,
    cleanupJob,
    listLotFiles,
    listWorkDir,
  }
}

export function previewBuiltinBatches() {
  return normalizeBatches(RAW_SUPERVISOR_BATCHES)
}
