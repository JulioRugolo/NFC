/**
 * Separa nome completo em linha 1 (primeiro nome) e linha 2 (sobrenome(s)).
 * Ex.: "CLAUDIA CARDOSOS" → { name: "CLAUDIA", line2: "CARDOSOS", show2ndLine: true }
 * Nome único → só linha 1.
 */
export function splitNameAndSurname(fullName) {
  const cleaned = String(fullName ?? '').trim().replace(/\s+/g, ' ')
  if (!cleaned) {
    return { name: '', line2: '', show2ndLine: false }
  }

  const parts = cleaned.split(' ')
  if (parts.length === 1) {
    return { name: parts[0], line2: '', show2ndLine: false }
  }

  return {
    name: parts[0],
    line2: parts.slice(1).join(' '),
    show2ndLine: true,
  }
}
