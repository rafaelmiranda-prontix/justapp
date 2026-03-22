import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { Prisma } from '@prisma/client'

const includeMensagem = {
  remetente: {
    select: { id: true, name: true, email: true, role: true },
  },
  matches: {
    select: {
      id: true,
      status: true,
      casoId: true,
      advogados: {
        select: {
          userId: true,
          users: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      casos: {
        select: {
          id: true,
          cidadaos: {
            select: {
              userId: true,
              users: { select: { id: true, name: true, email: true, role: true } },
            },
          },
        },
      },
    },
  },
} as const

type Row = {
  id: string
  remetenteId: string
  conteudo: string
  lida: boolean
  createdAt: Date
  remetente: { id: string; name: string; email: string; role: string }
  matches: {
    id: string
    status: string
    casoId: string
    advogados: {
      userId: string
      users: { id: string; name: string; email: string; role: string }
    }
    casos: {
      id: string
      cidadaos: {
        userId: string
        users: { id: string; name: string; email: string; role: string }
      }
    }
  }
}

function mapRow(m: Row) {
  const advUser = m.matches.advogados.users
  const cidUser = m.matches.casos.cidadaos.users
  const advUserId = m.matches.advogados.userId
  const cidUserId = m.matches.casos.cidadaos.userId

  let destinatario: {
    id: string
    name: string
    email: string
    role: string
  } | null = null
  let destinatarioResolvido = false
  let problema: string | null = null

  if (m.remetenteId === cidUserId) {
    destinatario = {
      id: advUser.id,
      name: advUser.name,
      email: advUser.email,
      role: advUser.role,
    }
    destinatarioResolvido = true
  } else if (m.remetenteId === advUserId) {
    destinatario = {
      id: cidUser.id,
      name: cidUser.name,
      email: cidUser.email,
      role: cidUser.role,
    }
    destinatarioResolvido = true
  } else {
    problema =
      'Remetente não corresponde ao cidadão nem ao advogado deste match (possível inconsistência de dados).'
  }

  const preview =
    m.conteudo.length > 120 ? `${m.conteudo.slice(0, 120)}…` : m.conteudo

  return {
    id: m.id,
    createdAt: m.createdAt.toISOString(),
    conteudoPreview: preview,
    conteudoLength: m.conteudo.length,
    lida: m.lida,
    remetente: {
      id: m.remetente.id,
      name: m.remetente.name,
      email: m.remetente.email,
      role: m.remetente.role,
    },
    destinatario,
    destinatarioResolvido,
    problema,
    match: {
      id: m.matches.id,
      status: m.matches.status,
      casoId: m.matches.casoId,
    },
  }
}

/**
 * GET /api/admin/chat-messages
 * Auditoria: mensagens de chat com remetente e destinatário (derivado do match).
 */
export async function GET(req: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)))
    const onlyProblems = url.searchParams.get('onlyProblems') === 'true'
    const skip = (page - 1) * limit

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [total7d, totalAll] = await Promise.all([
      prisma.mensagens.count({ where: { createdAt: { gte: since } } }),
      prisma.mensagens.count(),
    ])

    let problemCount7d = 0
    try {
      const pc = await prisma.$queryRaw<{ c: bigint }[]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS c
        FROM mensagens m
        INNER JOIN matches mt ON m."matchId" = mt.id
        INNER JOIN advogados a ON mt."advogadoId" = a.id
        INNER JOIN casos c ON mt."casoId" = c.id
        INNER JOIN cidadaos cd ON c."cidadaoId" = cd.id
        WHERE m."remetenteId" NOT IN (a."userId", cd."userId")
          AND m."createdAt" >= ${since}
      `)
      problemCount7d = Number(pc[0]?.c ?? 0)
    } catch {
      problemCount7d = 0
    }

    let items: Row[]
    let total: number

    if (onlyProblems) {
      const idRows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT m.id
        FROM mensagens m
        INNER JOIN matches mt ON m."matchId" = mt.id
        INNER JOIN advogados a ON mt."advogadoId" = a.id
        INNER JOIN casos c ON mt."casoId" = c.id
        INNER JOIN cidadaos cd ON c."cidadaoId" = cd.id
        WHERE m."remetenteId" NOT IN (a."userId", cd."userId")
        ORDER BY m."createdAt" DESC
        LIMIT ${limit} OFFSET ${skip}
      `)
      const ids = idRows.map((r) => r.id)
      const countRow = await prisma.$queryRaw<{ c: bigint }[]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS c
        FROM mensagens m
        INNER JOIN matches mt ON m."matchId" = mt.id
        INNER JOIN advogados a ON mt."advogadoId" = a.id
        INNER JOIN casos c ON mt."casoId" = c.id
        INNER JOIN cidadaos cd ON c."cidadaoId" = cd.id
        WHERE m."remetenteId" NOT IN (a."userId", cd."userId")
      `)
      total = Number(countRow[0]?.c ?? 0)

      if (ids.length === 0) {
        items = []
      } else {
        const fetched = await prisma.mensagens.findMany({
          where: { id: { in: ids } },
          include: includeMensagem,
        })
        const order = new Map(ids.map((id, i) => [id, i]))
        items = (fetched as Row[]).sort(
          (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
        )
      }
    } else {
      total = totalAll
      items = (await prisma.mensagens.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: includeMensagem,
      })) as Row[]
    }

    const data = items.map(mapRow)
    const comProblemaNaPagina = data.filter((d) => !d.destinatarioResolvido).length
    const comDestinatarioOk = data.length - comProblemaNaPagina

    return NextResponse.json({
      success: true,
      data,
      summary: {
        totalMensagens: totalAll,
        ultimos7Dias: total7d,
        inconsistenciasUltimos7Dias: problemCount7d,
        naPagina: {
          total: data.length,
          comDestinatarioOk,
          comProblema: comProblemaNaPagina,
        },
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      onlyProblems,
    })
  } catch (e) {
    console.error('[admin/chat-messages]', e)
    return NextResponse.json(
      { error: 'Erro ao listar mensagens de chat' },
      { status: 500 }
    )
  }
}
