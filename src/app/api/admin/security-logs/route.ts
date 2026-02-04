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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action')
    const actorId = searchParams.get('actorId')
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')
    const severity = searchParams.get('severity')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    if (targetId) {
      where.targetId = targetId
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

    const [logs, total] = await Promise.all([
      prisma.security_logs.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.security_logs.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error('Error fetching security logs:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar logs de segurança' },
      { status: 500 }
    )
  }
}
