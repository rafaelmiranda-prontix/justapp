import type { Prisma } from '@prisma/client'

// User types with relations
export type UserWithCidadao = Prisma.UserGetPayload<{
  include: { cidadao: true }
}>

export type UserWithAdvogado = Prisma.UserGetPayload<{
  include: { advogado: true }
}>

export type UserWithRole = Prisma.UserGetPayload<{
  include: {
    cidadao: true
    advogado: true
  }
}>

// Advogado types
export type AdvogadoWithEspecialidades = Prisma.AdvogadoGetPayload<{
  include: {
    user: true
    especialidades: {
      include: {
        especialidade: true
      }
    }
    avaliacoes: true
  }
}>

export type AdvogadoPublic = {
  id: string
  nome: string
  foto: string | null
  bio: string | null
  cidade: string
  estado: string
  especialidades: string[]
  precoConsulta: number | null
  avaliacaoMedia: number
  totalAvaliacoes: number
  aceitaOnline: boolean
}

// Caso types
export type CasoWithDetails = Prisma.CasoGetPayload<{
  include: {
    cidadao: {
      include: {
        user: true
      }
    }
    especialidade: true
    matches: {
      include: {
        advogado: {
          include: {
            user: true
          }
        }
      }
    }
  }
}>

// Match types
export type MatchWithDetails = Prisma.MatchGetPayload<{
  include: {
    caso: {
      include: {
        cidadao: {
          include: {
            user: true
          }
        }
        especialidade: true
      }
    }
    advogado: {
      include: {
        user: true
        especialidades: {
          include: {
            especialidade: true
          }
        }
      }
    }
    mensagens: true
  }
}>

// Mensagem types
export type MensagemWithRemetente = Prisma.MensagemGetPayload<{
  include: {
    match: true
  }
}>

// API Response types
export type ApiResponse<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: string
    }

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export type CadastroAdvogadoForm = {
  nome: string
  email: string
  telefone?: string
  oab: string
  cidade: string
  estado: string
  especialidades: string[]
  bio?: string
  precoConsulta?: number
}

export type CadastroCidadaoForm = {
  nome: string
  email: string
  telefone?: string
}

export type CasoForm = {
  descricao: string
  urgencia?: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE'
}

// Dashboard types
export type DashboardAdvogado = {
  leadsRecebidos: number
  leadsAceitos: number
  leadsRecusados: number
  conversaoMes: number
  avaliacaoMedia: number
  totalAvaliacoes: number
}

export type DashboardCidadao = {
  casosAbertos: number
  casosEmAndamento: number
  casosFechados: number
  matchesPendentes: number
}
