import type { Prisma } from '@prisma/client'

// User types with relations
export type UserWithCidadao = Prisma.usersGetPayload<{
  include: { cidadaos: true }
}>

export type UserWithAdvogado = Prisma.usersGetPayload<{
  include: { advogados: true }
}>

export type UserWithRole = Prisma.usersGetPayload<{
  include: {
    cidadaos: true
    advogados: true
  }
}>

// Advogado types
export type AdvogadoWithEspecialidades = Prisma.advogadosGetPayload<{
  include: {
    users: true
    advogado_especialidades: {
      include: {
        especialidades: true
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
export type CasoWithDetails = Prisma.casosGetPayload<{
  include: {
    cidadaos: {
      include: {
        users: true
      }
    }
    especialidades: true
    matches: {
      include: {
        advogados: {
          include: {
            users: true
          }
        }
      }
    }
  }
}>

// Match types
export type MatchWithDetails = Prisma.matchesGetPayload<{
  include: {
    casos: {
      include: {
        cidadaos: {
          include: {
            users: true
          }
        }
        especialidades: true
      }
    }
    advogados: {
      include: {
        users: true
        advogado_especialidades: {
          include: {
            especialidades: true
          }
        }
      }
    }
    mensagens: true
  }
}>

// Mensagem types
export type MensagemWithRemetente = Prisma.mensagensGetPayload<{
  include: {
    matches: true
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

// Avaliação types
export type AvaliacaoWithDetails = Prisma.avaliacoesGetPayload<{
  include: {
    cidadaos: {
      include: {
        users: {
          select: {
            name: true
          }
        }
      }
    }
    advogados: {
      include: {
        users: {
          select: {
            name: true
          }
        }
      }
    }
  }
}>

export type AvaliacaoStats = {
  media: number
  total: number
  distribuicao: Array<{
    nota: number
    quantidade: number
    percentual: number
  }>
}
