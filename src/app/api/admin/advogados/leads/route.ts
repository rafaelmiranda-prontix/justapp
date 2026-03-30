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
  const effectiveLimit = Prisma.sql`(
    CASE
      WHEN a.plano::text = 'FREE'
        AND a."freeLeadsBonusMes" > 0
        AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
      THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
      ELSE a."leadsLimiteMes"
    END
  )`

  if (cota === 'esgotado') {
    return Prisma.sql`
      AND ${effectiveLimit} > 0 AND ${effectiveLimit} < 999
      AND a."leadsRecebidosMes" >= ${effectiveLimit}`
  }
  if (cota === 'proximo') {
    return Prisma.sql`
      AND ${effectiveLimit} > 0 AND ${effectiveLimit} < 999
      AND a."leadsRecebidosMes" < ${effectiveLimit}
      AND (a."leadsRecebidosMes"::float / NULLIF(${effectiveLimit}, 0)) >= 0.8`
  }
  if (cota === 'ok') {
    return Prisma.sql`
      AND (
        ${effectiveLimit} = -1 OR ${effectiveLimit} >= 999
        OR (
          ${effectiveLimit} > 0 AND ${effectiveLimit} < 999
          AND (a."leadsRecebidosMes"::float / NULLIF(${effectiveLimit}, 0)) < 0.8
        )
      )`
  }
  return Prisma.empty
}

function orderSql(sort: SortKey): Prisma.Sql {
  const effectiveLimit = Prisma.sql`(
    CASE
      WHEN a.plano::text = 'FREE'
        AND a."freeLeadsBonusMes" > 0
        AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
      THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
      ELSE a."leadsLimiteMes"
    END
  )`

  if (sort === 'nome') {
    return Prisma.sql`ORDER BY u.name ASC NULLS LAST, a.id ASC`
  }
  if (sort === 'recebidos_desc') {
    return Prisma.sql`ORDER BY a."leadsRecebidosMes" DESC, a.id ASC`
  }
  return Prisma.sql`ORDER BY
    CASE
      WHEN ${effectiveLimit} > 0 AND ${effectiveLimit} < 999
      THEN a."leadsRecebidosMes"::float / NULLIF(${effectiveLimit}, 0)
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
      freeLeadsBonusMes: number
      freeLeadsBonusRef: string | null
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
        a."freeLeadsBonusMes",
        a."freeLeadsBonusRef",
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
            AND (
              (
                CASE
                  WHEN a.plano::text = 'FREE'
                    AND a."freeLeadsBonusMes" > 0
                    AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                  THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
                  ELSE a."leadsLimiteMes"
                END
              ) = -1
              OR (
                CASE
                  WHEN a.plano::text = 'FREE'
                    AND a."freeLeadsBonusMes" > 0
                    AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                  THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
                  ELSE a."leadsLimiteMes"
                END
              ) >= 999
            )
        )::bigint AS ilimitados,
        COUNT(*) FILTER (
          WHERE a.aprovado
            AND (
              CASE
                WHEN a.plano::text = 'FREE'
                  AND a."freeLeadsBonusMes" > 0
                  AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
                ELSE a."leadsLimiteMes"
              END
            ) > 0
            AND (
              CASE
                WHEN a.plano::text = 'FREE'
                  AND a."freeLeadsBonusMes" > 0
                  AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
                ELSE a."leadsLimiteMes"
              END
            ) < 999
            AND a."leadsRecebidosMes" >= (
              CASE
                WHEN a.plano::text = 'FREE'
                  AND a."freeLeadsBonusMes" > 0
                  AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
                ELSE a."leadsLimiteMes"
              END
            )
        )::bigint AS esgotado,
        COUNT(*) FILTER (
          WHERE a.aprovado
            AND (
              CASE
                WHEN a.plano::text = 'FREE'
                  AND a."freeLeadsBonusMes" > 0
                  AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
                ELSE a."leadsLimiteMes"
              END
            ) > 0
            AND (
              CASE
                WHEN a.plano::text = 'FREE'
                  AND a."freeLeadsBonusMes" > 0
                  AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
                ELSE a."leadsLimiteMes"
              END
            ) < 999
            AND a."leadsRecebidosMes" < (
              CASE
                WHEN a.plano::text = 'FREE'
                  AND a."freeLeadsBonusMes" > 0
                  AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
                ELSE a."leadsLimiteMes"
              END
            )
            AND (
              a."leadsRecebidosMes"::float / NULLIF(
                (
                  CASE
                    WHEN a.plano::text = 'FREE'
                      AND a."freeLeadsBonusMes" > 0
                      AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                    THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
                    ELSE a."leadsLimiteMes"
                  END
                ),
                0
              )
            ) >= 0.8
        )::bigint AS proximo,
        COUNT(*) FILTER (
          WHERE a.aprovado
            AND (
              CASE
                WHEN a.plano::text = 'FREE'
                  AND a."freeLeadsBonusMes" > 0
                  AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
                ELSE a."leadsLimiteMes"
              END
            ) > 0
            AND (
              CASE
                WHEN a.plano::text = 'FREE'
                  AND a."freeLeadsBonusMes" > 0
                  AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
                ELSE a."leadsLimiteMes"
              END
            ) < 999
            AND (
              a."leadsRecebidosMes"::float / NULLIF(
                (
                  CASE
                    WHEN a.plano::text = 'FREE'
                      AND a."freeLeadsBonusMes" > 0
                      AND a."freeLeadsBonusRef" = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
                    THEN a."leadsLimiteMes" + a."freeLeadsBonusMes"
                    ELSE a."leadsLimiteMes"
                  END
                ),
                0
              )
            ) < 0.8
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
      const now = new Date()
      const monthRef = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const bonusAtivo =
        r.plano === 'FREE' &&
        r.freeLeadsBonusMes > 0 &&
        r.freeLeadsBonusRef === monthRef
          ? r.freeLeadsBonusMes
          : 0
      const effectiveLimit = r.leadsLimiteMes + bonusAtivo
      const unlimited = effectiveLimit === -1 || effectiveLimit >= 999
      const limiteFinito = effectiveLimit > 0 && effectiveLimit < 999
      let usoPercent: number | null = null
      let situacao: 'ilimitado' | 'esgotado' | 'proximo' | 'ok' | 'sem_cota'

      if (unlimited) {
        situacao = 'ilimitado'
      } else if (!limiteFinito || r.leadsLimiteMes <= 0) {
        situacao = 'sem_cota'
      } else {
        usoPercent = Math.min(
          100,
          Math.round((r.leadsRecebidosMes / effectiveLimit) * 100)
        )
        if (r.leadsRecebidosMes >= effectiveLimit) situacao = 'esgotado'
        else if (r.leadsRecebidosMes / effectiveLimit >= 0.8) situacao = 'proximo'
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
        leadsLimiteMes: effectiveLimit,
        leadsLimiteMesBase: r.leadsLimiteMes,
        freeLeadsBonusMes: bonusAtivo,
        freeLeadsBonusRef: r.freeLeadsBonusRef,
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
