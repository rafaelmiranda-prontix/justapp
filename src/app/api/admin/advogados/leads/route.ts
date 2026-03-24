import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'

type CotaFilter = 'all' | 'esgotado' | 'proximo' | 'ok'
type StatusFilter = 'aprovados' | 'pendentes' | 'all'
type SortKey = 'uso_desc' | 'nome' | 'recebidos_desc'

function parseCota(v: string | null): CotaFilter {
  if (v === 'esgotado' || v === 'proximo' || v === 'ok') return v
  return 'all'
}

function parseStatus(v: string | null): StatusFilter {
  if (v === 'pendentes' || v === 'all') return v
  return 'aprovados'
}

function parseSort(v: string | null): SortKey {
  if (v === 'nome' || v === 'recebidos_desc') return v
  return 'uso_desc'
}

function statusSql(status: StatusFilter): Prisma.Sql {
  if (status === 'aprovados') return Prisma.sql`AND a.aprovado = true`
  if (status === 'pendentes') return Prisma.sql`AND a.aprovado = false`
  return Prisma.empty
}

function cotaSql(cota: CotaFilter): Prisma.Sql {
  if (cota === 'esgotado') {
    return Prisma.sql`
      AND a."leadsLimiteMes" > 0 AND a."leadsLimiteMes" < 999
      AND a."leadsRecebidosMes" >= a."leadsLimiteMes"`
  }
  if (cota === 'proximo') {
    return Prisma.sql`
      AND a."leadsLimiteMes" > 0 AND a."leadsLimiteMes" < 999
      AND a."leadsRecebidosMes" < a."leadsLimiteMes"
      AND (a."leadsRecebidosMes"::float / NULLIF(a."leadsLimiteMes", 0)) >= 0.8`
  }
  if (cota === 'ok') {
    return Prisma.sql`
      AND (
        a."leadsLimiteMes" = -1 OR a."leadsLimiteMes" >= 999
        OR (
          a."leadsLimiteMes" > 0 AND a."leadsLimiteMes" < 999
          AND (a."leadsRecebidosMes"::float / NULLIF(a."leadsLimiteMes", 0)) < 0.8
        )
      )`
  }
  return Prisma.empty
}

function orderSql(sort: SortKey): Prisma.Sql {
  if (sort === 'nome') {
    return Prisma.sql`ORDER BY u.name ASC NULLS LAST, a.id ASC`
  }
  if (sort === 'recebidos_desc') {
    return Prisma.sql`ORDER BY a."leadsRecebidosMes" DESC, a.id ASC`
  }
  return Prisma.sql`ORDER BY
    CASE
      WHEN a."leadsLimiteMes" > 0 AND a."leadsLimiteMes" < 999
      THEN a."leadsRecebidosMes"::float / NULLIF(a."leadsLimiteMes", 0)
      ELSE -1
    END DESC NULLS LAST,
    a."leadsRecebidosMes" DESC,
    a.id ASC`
}

export async function GET(req: Request) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limitRaw = parseInt(searchParams.get('limit') || '25', 10) || 25
    const limit = Math.min(100, Math.max(5, limitRaw))
    const offset = (page - 1) * limit
    const search = (searchParams.get('search') || '').trim()
    const cota = parseCota(searchParams.get('cota'))
    const status = parseStatus(searchParams.get('status'))
    const sort = parseSort(searchParams.get('sort'))

    const searchSql =
      search.length > 0
        ? Prisma.sql`AND (
            a.oab ILIKE ${`%${search}%`}
            OR u.name ILIKE ${`%${search}%`}
            OR u.email ILIKE ${`%${search}%`}
          )`
        : Prisma.empty

    const st = statusSql(status)
    const ct = cotaSql(cota)
    const ord = orderSql(sort)

    const [countRow] = await prisma.$queryRaw<[{ c: bigint }]>`
      SELECT COUNT(*)::bigint AS c
      FROM advogados a
      INNER JOIN users u ON u.id = a."userId"
      WHERE 1 = 1
      ${st}
      ${ct}
      ${searchSql}
    `

    const total = countRow != null ? Number(countRow.c) : 0

    type Row = {
      id: string
      oab: string
      plano: string
      aprovado: boolean
      leadsRecebidosMes: number
      leadsLimiteMes: number
      ultimoResetLeads: Date
      casosRecebidosHora: number
      ultimoResetCasosHora: Date
      userName: string | null
      userEmail: string | null
    }

    const rows = await prisma.$queryRaw<Row[]>`
      SELECT
        a.id,
        a.oab,
        a.plano::text AS plano,
        a.aprovado,
        a."leadsRecebidosMes",
        a."leadsLimiteMes",
        a."ultimoResetLeads",
        a."casosRecebidosHora",
        a."ultimoResetCasosHora",
        u.name AS "userName",
        u.email AS "userEmail"
      FROM advogados a
      INNER JOIN users u ON u.id = a."userId"
      WHERE 1 = 1
      ${st}
      ${ct}
      ${searchSql}
      ${ord}
      LIMIT ${limit}
      OFFSET ${offset}
    `

    const [summaryRow] = await prisma.$queryRaw<
      [
        {
          aprovados_total: bigint
          ilimitados: bigint
          esgotado: bigint
          proximo: bigint
          ok_cota: bigint
        },
      ]
    >`
      SELECT
        COUNT(*) FILTER (WHERE a.aprovado)::bigint AS aprovados_total,
        COUNT(*) FILTER (
          WHERE a.aprovado
            AND (a."leadsLimiteMes" = -1 OR a."leadsLimiteMes" >= 999)
        )::bigint AS ilimitados,
        COUNT(*) FILTER (
          WHERE a.aprovado
            AND a."leadsLimiteMes" > 0
            AND a."leadsLimiteMes" < 999
            AND a."leadsRecebidosMes" >= a."leadsLimiteMes"
        )::bigint AS esgotado,
        COUNT(*) FILTER (
          WHERE a.aprovado
            AND a."leadsLimiteMes" > 0
            AND a."leadsLimiteMes" < 999
            AND a."leadsRecebidosMes" < a."leadsLimiteMes"
            AND (a."leadsRecebidosMes"::float / NULLIF(a."leadsLimiteMes", 0)) >= 0.8
        )::bigint AS proximo,
        COUNT(*) FILTER (
          WHERE a.aprovado
            AND a."leadsLimiteMes" > 0
            AND a."leadsLimiteMes" < 999
            AND (a."leadsRecebidosMes"::float / NULLIF(a."leadsLimiteMes", 0)) < 0.8
        )::bigint AS ok_cota
      FROM advogados a
    `

    const summary = summaryRow
      ? {
          aprovadosTotal: Number(summaryRow.aprovados_total),
          ilimitados: Number(summaryRow.ilimitados),
          esgotado: Number(summaryRow.esgotado),
          proximo: Number(summaryRow.proximo),
          okCota: Number(summaryRow.ok_cota),
        }
      : {
          aprovadosTotal: 0,
          ilimitados: 0,
          esgotado: 0,
          proximo: 0,
          okCota: 0,
        }

    const data = rows.map((r) => {
      const unlimited = r.leadsLimiteMes === -1 || r.leadsLimiteMes >= 999
      const limiteFinito = r.leadsLimiteMes > 0 && r.leadsLimiteMes < 999
      let usoPercent: number | null = null
      let situacao: 'ilimitado' | 'esgotado' | 'proximo' | 'ok' | 'sem_cota'

      if (unlimited) {
        situacao = 'ilimitado'
      } else if (!limiteFinito || r.leadsLimiteMes <= 0) {
        situacao = 'sem_cota'
      } else {
        usoPercent = Math.min(
          100,
          Math.round((r.leadsRecebidosMes / r.leadsLimiteMes) * 100)
        )
        if (r.leadsRecebidosMes >= r.leadsLimiteMes) situacao = 'esgotado'
        else if (r.leadsRecebidosMes / r.leadsLimiteMes >= 0.8) situacao = 'proximo'
        else situacao = 'ok'
      }

      return {
        id: r.id,
        oab: r.oab,
        plano: r.plano,
        aprovado: r.aprovado,
        nome: r.userName ?? '—',
        email: r.userEmail ?? '—',
        leadsRecebidosMes: r.leadsRecebidosMes,
        leadsLimiteMes: r.leadsLimiteMes,
        ultimoResetLeads: r.ultimoResetLeads.toISOString(),
        casosRecebidosHora: r.casosRecebidosHora,
        ultimoResetCasosHora: r.ultimoResetCasosHora.toISOString(),
        isUnlimited: unlimited,
        usoPercent,
        situacao,
      }
    })

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary,
    })
  } catch (e) {
    console.error('[admin/advogados/leads]', e)
    return NextResponse.json(
      { error: 'Erro ao listar uso de leads' },
      { status: 500 }
    )
  }
}
