import { randomBytes } from 'crypto'

/** Token opaco para links em e-mail (aceitar/recusar, etc.) */
export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url')
}

export const EMAIL_ACTION_BETA_INVITE_DAYS = 7
