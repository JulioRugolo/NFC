/**
 * Sanitiza nomes para arquivos/ZIPs seguros em Windows e Linux.
 * Não altera o texto gravado no modelo 3D — só o nome do arquivo.
 */
export function sanitizeFilename(raw, { fallback = 'SEM_NOME' } = {}) {
  const base = String(raw ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()

  if (!base) return fallback
  // Reserva nomes inválidos no Windows
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(base)) {
    return `${fallback}_${base}`
  }
  return base.slice(0, 180)
}

export function supervisorZipBasename(supervisorName, code) {
  const namePart = sanitizeFilename(supervisorName)
  const codePart = String(code ?? '').replace(/\D/g, '')
  return codePart ? `${namePart}_${codePart}` : namePart
}

export function promoterFilename(promoterName, extension = '3mf') {
  const ext = String(extension || '3mf').replace(/^\./, '')
  return `${sanitizeFilename(promoterName)}.${ext}`
}
