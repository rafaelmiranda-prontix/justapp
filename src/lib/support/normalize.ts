/**
 * E-mail para comparação em minúsculas.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Telefone: apenas dígitos (comparar sempre normalizado).
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * CRM / OAB: maiúsculas, sem espaços extras.
 */
export function normalizeCrm(crm: string): string {
  return crm.trim().replace(/\s+/g, '').toUpperCase()
}

export function phonesMatch(stored: string | null | undefined, inputNormalized: string): boolean {
  if (!stored || !inputNormalized) return false
  const a = normalizePhone(stored)
  const b = inputNormalized
  if (a === b) return true
  // Últimos 11 dígitos (DDD + celular BR) se ambos tiverem tamanho suficiente
  if (a.length >= 11 && b.length >= 11 && a.slice(-11) === b.slice(-11)) return true
  return false
}
