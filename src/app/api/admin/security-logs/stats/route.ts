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
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Estatísticas gerais
    const [
      totalLogs,
      criticalLogs,
      warningLogs,
      infoLogs,
      logsByAction,
      logsByActor,
      recentLogs,
    ] = await Promise.all([
      prisma.security_logs.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.security_logs.count({
        where: {
          severity: 'CRITICAL',
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.security_logs.count({
        where: {
          severity: 'WARNING',
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.security_logs.count({
        where: {
          severity: 'INFO',
          createdAt: {
            gte: startDate,
          },
        },
      }),
      prisma.security_logs.groupBy({
        by: ['action'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),
      prisma.security_logs.groupBy({
        by: ['actorId', 'actorEmail'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          actorId: true,
        },
        orderBy: {
          _count: {
            actorId: 'desc',
          },
        },
        take: 10,
      }),
      prisma.security_logs.findMany({
        where: {
          severity: 'CRITICAL',
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
        select: {
          id: true,
          action: true,
          actorEmail: true,
          actorName: true,
          targetType: true,
          targetId: true,
          createdAt: true,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        totals: {
          total: totalLogs,
          critical: criticalLogs,
          warning: warningLogs,
          info: infoLogs,
        },
        byAction: logsByAction.map((item) => ({
          action: item.action,
          count: item._count.action,
        })),
        byActor: logsByActor.map((item) => ({
          actorId: item.actorId,
          actorEmail: item.actorEmail,
          count: item._count.actorId,
        })),
        recentCritical: recentLogs,
      },
    })
  } catch (error) {
    logger.error('Error fetching security logs stats:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estatísticas de logs' },
      { status: 500 }
    )
  }
}
