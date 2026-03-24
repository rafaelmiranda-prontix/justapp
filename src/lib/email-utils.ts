/** Validação simples para e-mail de teste no admin (RFC completa não é necessária). */
export function isReasonableEmail(value: string): boolean {
  const v = value.trim()
  if (v.length < 5 || v.length > 254) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}
