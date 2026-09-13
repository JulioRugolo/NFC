import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { sanitizeFilename, supervisorZipBasename, promoterFilename } from '../shared/sanitizeFilename.js'
import {
  normalizeBatches,
  parseSupervisorLabel,
  supervisorGroupKey,
  listSupervisorKeychainTargets,
} from '../shared/normalizeBatches.js'
import { RAW_SUPERVISOR_BATCHES } from '../shared/promotersData.js'
import { createBatchJobManager, previewBuiltinBatches } from '../shared/batchJobManager.js'
import { splitNameAndSurname } from '../shared/splitNameLines.js'

describe('splitNameAndSurname', () => {
  it('coloca sobrenome(s) na segunda linha', () => {
    assert.deepEqual(splitNameAndSurname('CLAUDIA CARDOSOS'), {
      name: 'CLAUDIA',
      line2: 'CARDOSOS',
      show2ndLine: true,
    })
    assert.deepEqual(splitNameAndSurname('HELOISA ALVES FERREIRA'), {
      name: 'HELOISA',
      line2: 'ALVES FERREIRA',
      show2ndLine: true,
    })
  })

  it('nome único fica só na linha 1', () => {
    assert.deepEqual(splitNameAndSurname('MADONNA'), {
      name: 'MADONNA',
      line2: '',
      show2ndLine: false,
    })
  })
})

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
    assert.equal(summary.finalLots, 7)
    assert.equal(summary.totalPromoters, 128)
    assert.equal(summary.rawSupervisorEntries, 7)

    const lindsay = lots.find((l) => l.code === '462905')
    assert.equal(lindsay, undefined)

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
        if (name === 'FAIL') throw new Error('boom')
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
    assert.equal(counts['ANA_CRISTINA_DOS_SANTOS_SIQUEIRA_799987.zip'], undefined)
    assert.equal(counts['KALEL_ANDREI_CAMARGO_507054.zip'], undefined)
    assert.equal(counts['LINDSAY_ZEFERINO_MAIA_462905.zip'], undefined)
    assert.equal(counts['MARIA_EDUARDA_LOPES_DA_SILVA_810142.zip'], 39)
    assert.equal(counts['MAURICIO_RODRIGUES.zip'], 19)
    assert.equal(counts['PAULA_RAMOS_CUSTODIO_DE_LIMA_714285.zip'], 23)
    assert.equal(counts['PAULA_RAMOS_CUSTODIO_DE_LIMA_714286.zip'], 1)
    assert.equal(counts['RB_WELDER_OLIVEIRA.zip'], 13)
    assert.equal(counts['VALTER_LUIZ_CERRI_374872.zip'], 12)
    assert.equal(counts['WAGNER_MARTINS_689385.zip'], 21)
  })
})

describe('chaveiros dos supervisores', () => {
  it('usa a lista atual com nome na linha 1 e sobrenome na linha 2', () => {
    const { supervisors, summary } = listSupervisorKeychainTargets()
    assert.equal(summary.totalSupervisors, 14)
    assert.deepEqual(
      supervisors.map((s) => s.name),
      [
        'EVANDRO HENRIQUE',
        'MALU VALÉRIO',
        'WELDER OLIVEIRA',
        'TAIS FARIAS',
        'ANA SIQUEIRA',
        'PAULA RAMOS',
        'KALEL CAMARGO',
        'LINDSAY MAIA',
        'DUDA LOPES',
        'MARISA ASSIS',
        'MAURICIO RODRIGUES',
        'WAGNER JUNIOR',
        'GEOVANE SILVA',
        'JESSICA STRADIOTTI',
      ]
    )
    assert.equal(supervisors[0].line1, 'EVANDRO')
    assert.equal(supervisors[0].line2, 'HENRIQUE')
    assert.equal(supervisors[1].line2, 'VALÉRIO')
  })

  it('gera ZIP único com arquivos só pelo nome', async () => {
    const mgr = createBatchJobManager({
      exportKeychain: async () => {
        throw new Error('não deve chamar OpenSCAD no mock')
      },
    })

    const { jobId, mode } = await mgr.startJob({ mode: 'supervisors', mockExport: true })
    assert.equal(mode, 'supervisors')

    let status
    for (let i = 0; i < 50; i++) {
      status = mgr.getPublicStatus(jobId)
      if (status.status === 'completed' || status.status === 'failed') break
      await new Promise((r) => setTimeout(r, 50))
    }

    assert.equal(status.status, 'completed')
    assert.equal(status.summary.generated, 14)
    assert.equal(status.downloadReady, true)

    const zipResult = await mgr.readLotZip(jobId, 'chaveiros_lote.zip')
    assert.ok(zipResult)
    const zip = await JSZip.loadAsync(zipResult.content)
    const names = Object.keys(zip.files).sort()
    assert.deepEqual(names, [
      'ANA_SIQUEIRA.stl',
      'DUDA_LOPES.stl',
      'EVANDRO_HENRIQUE.stl',
      'GEOVANE_SILVA.stl',
      'JESSICA_STRADIOTTI.stl',
      'KALEL_CAMARGO.stl',
      'LINDSAY_MAIA.stl',
      'MALU_VALERIO.stl',
      'MARISA_ASSIS.stl',
      'MAURICIO_RODRIGUES.stl',
      'PAULA_RAMOS.stl',
      'TAIS_FARIAS.stl',
      'WAGNER_JUNIOR.stl',
      'WELDER_OLIVEIRA.stl',
    ])

    await mgr.cleanupJob(jobId)
  })
})
