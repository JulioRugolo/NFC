import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { sanitizeFilename, supervisorZipBasename, promoterFilename } from '../shared/sanitizeFilename.js'
import { normalizeBatches, parseSupervisorLabel, supervisorGroupKey } from '../shared/normalizeBatches.js'
import { RAW_SUPERVISOR_BATCHES } from '../shared/promotersData.js'
import { createBatchJobManager, previewBuiltinBatches } from '../shared/batchJobManager.js'

describe('sanitizeFilename', () => {
  it('sanitiza espaços e acentos', () => {
    assert.equal(sanitizeFilename('Aniele Guimarães'), 'ANIELE_GUIMARAES')
    assert.equal(promoterFilename('BRYAN BRITO', 'stl'), 'BRYAN_BRITO.stl')
  })

  it('monta ZIP do supervisor com código', () => {
    assert.equal(
      supervisorZipBasename('ANA CRISTINA DOS SANTOS SIQUEIRA', '799987'),
      'ANA_CRISTINA_DOS_SANTOS_SIQUEIRA_799987'
    )
    assert.equal(supervisorZipBasename('MAURICIO RODRIGUES', ''), 'MAURICIO_RODRIGUES')
  })
})

describe('normalizeBatches', () => {
  it('funde Lindsay e preserva Paulas distintas', () => {
    const { lots, summary } = previewBuiltinBatches()
    assert.equal(summary.finalLots, 10)
    assert.equal(summary.totalPromoters, 194)
    assert.equal(summary.rawSupervisorEntries, 11)

    const lindsay = lots.find((l) => l.code === '462905')
    assert.ok(lindsay)
    assert.equal(lindsay.promoters.length, 27)
    assert.equal(lindsay.zipFilename, 'LINDSAY_ZEFERINO_MAIA_462905.zip')

    const paulas = lots.filter((l) => l.supervisorName.includes('PAULA RAMOS'))
    assert.equal(paulas.length, 2)
    assert.deepEqual(
      paulas.map((p) => p.code).sort(),
      ['714285', '714286']
    )
  })

  it('normaliza chave de grupo ignorando espaço antes do hífen', () => {
    assert.equal(
      supervisorGroupKey('LINDSAY ZEFERINO MAIA - 462905'),
      supervisorGroupKey('LINDSAY ZEFERINO MAIA- 462905')
    )
    assert.notEqual(
      supervisorGroupKey('PAULA RAMOS CUSTODIO DE LIMA - 714285'),
      supervisorGroupKey('PAULA RAMOS CUSTODIO DE LIMA - 714286')
    )
  })

  it('parseia label sem código', () => {
    const parsed = parseSupervisorLabel('RB WELDER OLIVEIRA')
    assert.equal(parsed.code, '')
    assert.equal(parsed.name, 'RB WELDER OLIVEIRA')
  })

  it('detecta duplicata no mesmo supervisor', () => {
    const { warnings } = normalizeBatches([
      {
        supervisor: 'TEST - 1',
        promoters: ['A', 'A', 'B'],
      },
    ])
    assert.ok(warnings.some((w) => w.type === 'duplicate_promoter'))
  })
})

describe('batchJobManager mock export', () => {
  it('gera ZIPs por supervisor com arquivos corretos', async () => {
    const mgr = createBatchJobManager({
      exportKeychain: async () => {
        throw new Error('não deve chamar OpenSCAD no mock')
      },
    })

    const small = [
      {
        supervisor: 'LINDSAY ZEFERINO MAIA - 462905',
        promoters: ['ALBERT SOUZA', 'ALINE PEREIRA'],
      },
      {
        supervisor: 'LINDSAY ZEFERINO MAIA- 462905',
        promoters: ['YSMAEL SILVA'],
      },
      {
        supervisor: 'PAULA RAMOS CUSTODIO DE LIMA - 714285',
        promoters: ['BRUNA CAMPOS'],
      },
      {
        supervisor: 'PAULA RAMOS CUSTODIO DE LIMA - 714286',
        promoters: ['JOHN ALVES'],
      },
    ]

    const { jobId } = await mgr.startJob({ supervisors: small, mockExport: true })

    let status
    for (let i = 0; i < 50; i++) {
      status = mgr.getPublicStatus(jobId)
      if (status.status === 'completed' || status.status === 'failed') break
      await new Promise((r) => setTimeout(r, 50))
    }

    assert.equal(status.status, 'completed')
    assert.equal(status.summary.finalLots, 3)
    assert.equal(status.summary.generated, 5)
    assert.equal(status.summary.failed, 0)

    const lindsayZip = await mgr.readLotZip(jobId, 'LINDSAY_ZEFERINO_MAIA_462905.zip')
    assert.ok(lindsayZip)
    const zip = await JSZip.loadAsync(lindsayZip.content)
    const names = Object.keys(zip.files).sort()
    assert.deepEqual(names, [
      'ALBERT_SOUZA.stl',
      'ALINE_PEREIRA.stl',
      'YSMAEL_SILVA.stl',
    ])

    const paulaA = await mgr.readLotZip(jobId, 'PAULA_RAMOS_CUSTODIO_DE_LIMA_714285.zip')
    const paulaB = await mgr.readLotZip(jobId, 'PAULA_RAMOS_CUSTODIO_DE_LIMA_714286.zip')
    assert.ok(paulaA)
    assert.ok(paulaB)

    const all = await mgr.buildAllZipsBundle(jobId)
    const allZip = await JSZip.loadAsync(all.content)
    assert.equal(Object.keys(allZip.files).length, 3)

    await mgr.cleanupJob(jobId)
  })

  it('mantém lote parcial se um promotor falhar', async () => {
    let calls = 0
    const mgr = createBatchJobManager({
      exportKeychain: async ({ name }) => {
        calls += 1
        if (name === 'FAIL ME') throw new Error('boom')
        return { content: Buffer.from('ok'), extension: '3mf', contentType: 'application/3mf' }
      },
    })

    const { jobId } = await mgr.startJob({
      mockExport: false,
      supervisors: [
        {
          supervisor: 'TEST SUP - 99',
          promoters: ['OK ONE', 'FAIL ME', 'OK TWO'],
        },
      ],
    })

    let status
    for (let i = 0; i < 50; i++) {
      status = mgr.getPublicStatus(jobId)
      if (status.status === 'completed' || status.status === 'failed') break
      await new Promise((r) => setTimeout(r, 50))
    }

    assert.equal(status.status, 'completed')
    assert.equal(status.lots[0].status, 'partial')
    assert.equal(status.lots[0].success, 2)
    assert.equal(status.lots[0].failed, 1)
    assert.equal(calls, 3)

    const files = await mgr.listLotFiles(jobId, 'TEST_SUP_99.zip')
    assert.deepEqual(files.sort(), ['OK_ONE.3mf', 'OK_TWO.3mf'])
    await mgr.cleanupJob(jobId)
  })
})

describe('dados embutidos — totais por ZIP esperado', () => {
  it('bate as quantidades pedidas na tarefa', () => {
    const { lots } = normalizeBatches(RAW_SUPERVISOR_BATCHES)
    const counts = Object.fromEntries(lots.map((l) => [l.zipFilename, l.promoters.length]))
    assert.equal(counts['ANA_CRISTINA_DOS_SANTOS_SIQUEIRA_799987.zip'], 15)
    assert.equal(counts['KALEL_ANDREI_CAMARGO_507054.zip'], 24)
    assert.equal(counts['LINDSAY_ZEFERINO_MAIA_462905.zip'], 27)
    assert.equal(counts['MARIA_EDUARDA_LOPES_DA_SILVA_810142.zip'], 39)
    assert.equal(counts['MAURICIO_RODRIGUES.zip'], 19)
    assert.equal(counts['PAULA_RAMOS_CUSTODIO_DE_LIMA_714285.zip'], 23)
    assert.equal(counts['PAULA_RAMOS_CUSTODIO_DE_LIMA_714286.zip'], 1)
    assert.equal(counts['RB_WELDER_OLIVEIRA.zip'], 13)
    assert.equal(counts['VALTER_LUIZ_CERRI_374872.zip'], 12)
    assert.equal(counts['WAGNER_MARTINS_DA_SILVA_JUNIOR_689385.zip'], 21)
  })
})
