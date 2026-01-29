import 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role?: UserRole
      cidadaoId?: string
      advogadoId?: string
      image?: string | null
    }
  }

  interface User {
    role?: UserRole
    cidadaoId?: string
    advogadoId?: string
  }
}
