import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const actorId = searchParams.get('actorId')
    const targetType = searchParams.get('targetType')
    const severity = searchParams.get('severity')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'json' // json ou csv

    const where: any = {}

    if (action) {
      where.action = action
    }

    if (actorId) {
      where.actorId = actorId
    }

    if (targetType) {
      where.targetType = targetType
    }

    if (severity) {
      where.severity = severity
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const logs = await prisma.security_logs.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 10000, // Limite de exportação
    })

    if (format === 'csv') {
      // Gerar CSV
      const headers = [
        'ID',
        'Ação',
        'Data/Hora',
        'Ator ID',
        'Ator Email',
        'Ator Nome',
        'Ator Role',
        'Tipo Alvo',
        'ID Alvo',
        'Identificador Alvo',
        'Severidade',
        'Mudanças',
        'Metadados',
      ]

      const rows = logs.map((log) => [
        log.id,
        log.action,
        log.createdAt.toISOString(),
        log.actorId,
        log.actorEmail,
        log.actorName,
        log.actorRole,
        log.targetType,
        log.targetId,
        log.targetIdentifier || '',
        log.severity,
        JSON.stringify(log.changes),
        JSON.stringify(log.metadata),
      ])

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="security-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // JSON por padrão
    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
      exportedAt: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Error exporting security logs:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao exportar logs de segurança' },
      { status: 500 }
    )
  }
}
