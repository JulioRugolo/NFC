import { sanitizeFilename, supervisorZipBasename } from './sanitizeFilename.js'
import { SUPERVISOR_KEYCHAIN_NAMES } from './promotersData.js'

/**
 * Extrai nome e código de "NOME - 123456" / "NOME- 123456".
 * Códigos diferentes = lotes diferentes (ex.: Paula 714285 vs 714286).
 * Diferença só de espaços antes do hífen = mesmo lote (ex.: Lindsay).
 */
export function parseSupervisorLabel(rawLabel) {
  const cleaned = String(rawLabel ?? '').trim().replace(/\s+/g, ' ')
  const match = cleaned.match(/^(.*?)\s*-\s*(\d+)\s*$/)
  if (match) {
    return {
      name: match[1].trim().replace(/\s+/g, ' '),
      code: match[2],
      display: `${match[1].trim().replace(/\s+/g, ' ')} - ${match[2]}`,
    }
  }
  return {
    name: cleaned,
    code: '',
    display: cleaned,
  }
}

/** Chave estável para agrupar supervisores equivalentes. */
export function supervisorGroupKey(rawLabel) {
  const { name, code } = parseSupervisorLabel(rawLabel)
  const nameKey = sanitizeFilename(name)
  return code ? `${nameKey}__${code}` : nameKey
}

/**
 * Normaliza lotes brutos: funde Lindsay (espaços), preserva Paulas distintas,
 * remove nomes vazios, detecta duplicatas por supervisor.
 */
export function normalizeBatches(rawBatches) {
  const warnings = []
  const byKey = new Map()

  for (const batch of rawBatches || []) {
    const parsed = parseSupervisorLabel(batch.supervisor)
    const key = supervisorGroupKey(batch.supervisor)
    const zipBase = supervisorZipBasename(parsed.name, parsed.code)

    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        supervisor: parsed.display,
        supervisorName: parsed.name,
        code: parsed.code,
        zipBase,
        zipFilename: `${zipBase}.zip`,
        promoters: [],
        sourceLabels: [],
      })
    }

    const entry = byKey.get(key)
    entry.sourceLabels.push(String(batch.supervisor ?? ''))

    const seenInBatch = new Set(entry.promoters.map((p) => p.toUpperCase()))
    for (const rawName of batch.promoters || []) {
      const name = String(rawName ?? '').trim().replace(/\s+/g, ' ')
      if (!name) {
        warnings.push({
          type: 'empty_promoter',
          supervisor: entry.supervisor,
          message: 'Nome de promotor vazio ignorado',
        })
        continue
      }
      const dupKey = name.toUpperCase()
      if (seenInBatch.has(dupKey)) {
        warnings.push({
          type: 'duplicate_promoter',
          supervisor: entry.supervisor,
          promoter: name,
          message: `Promotor duplicado no mesmo supervisor: ${name}`,
        })
        continue
      }
      seenInBatch.add(dupKey)
      entry.promoters.push(name)
    }
  }

  const lots = [...byKey.values()].filter((lot) => {
    if (lot.promoters.length === 0) {
      warnings.push({
        type: 'empty_supervisor',
        supervisor: lot.supervisor,
        message: 'Supervisor sem promotores',
      })
      return false
    }
    return true
  })

  // Ordena por nome do ZIP para UI estável
  lots.sort((a, b) => a.zipBase.localeCompare(b.zipBase))

  const totalPromoters = lots.reduce((sum, lot) => sum + lot.promoters.length, 0)
  const rawPromoterCount = (rawBatches || []).reduce(
    (sum, b) => sum + (b.promoters || []).length,
    0
  )

  return {
    lots,
    warnings,
    summary: {
      rawSupervisorEntries: (rawBatches || []).length,
      finalLots: lots.length,
      rawPromoterCount,
      totalPromoters,
    },
  }
}

export function validateBatches(lots) {
  const errors = []
  for (const lot of lots) {
    if (!lot.supervisor?.trim()) {
      errors.push({ supervisor: lot.supervisor, message: 'Supervisor sem nome' })
    }
    if (!lot.promoters?.length) {
      errors.push({ supervisor: lot.supervisor, message: 'Supervisor sem promotores' })
    }
    for (const p of lot.promoters || []) {
      if (!String(p).trim()) {
        errors.push({ supervisor: lot.supervisor, message: 'Promotor vazio' })
      }
    }
  }
  return { ok: errors.length === 0, errors }
}

/**
 * Chaveiros dos supervisores: nomes curtos definidos em SUPERVISOR_KEYCHAIN_NAMES.
 * line1 = nome / nome composto; line2 = sobrenome(s).
 */
export function listSupervisorKeychainTargets(_rawBatches) {
  const supervisors = SUPERVISOR_KEYCHAIN_NAMES.map(({ line1, line2 }) => {
    const name = [line1, line2].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
    const key = sanitizeFilename(name)
    return {
      key,
      name,
      line1,
      line2: line2 || '',
      show2ndLine: Boolean(line2),
      filenameBase: key,
    }
  })

  return {
    supervisors,
    summary: {
      totalSupervisors: supervisors.length,
    },
  }
}
