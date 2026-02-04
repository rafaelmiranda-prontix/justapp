/**
 * Sistema de alertas para ações suspeitas em logs de segurança
 */

import { prisma } from './prisma'
import { logger } from './logger'

export interface SecurityAlert {
  id: string
  type: 'SUSPICIOUS_ACTIVITY' | 'MULTIPLE_CHANGES' | 'UNUSUAL_TIME' | 'RAPID_CHANGES'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  details: {
    actorId: string
    actorEmail: string
    action: string
    count?: number
    timeWindow?: string
    [key: string]: any
  }
  createdAt: Date
}

/**
 * Detecta atividades suspeitas baseadas em padrões
 */
export async function detectSuspiciousActivity(): Promise<SecurityAlert[]> {
  const alerts: SecurityAlert[] = []
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  try {
    // 1. Múltiplas alterações de plano pelo mesmo admin em pouco tempo
    const rapidPlanChanges = await prisma.security_logs.groupBy({
      by: ['actorId', 'action'],
      where: {
        action: 'PLANO_ADVOGADO_ALTERADO',
        createdAt: {
          gte: oneHourAgo,
        },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 5, // Mais de 5 alterações em 1 hora
          },
        },
      },
    })

    for (const change of rapidPlanChanges) {
      const actor = await prisma.security_logs.findFirst({
        where: {
          actorId: change.actorId,
          action: change.action,
        },
        select: {
          actorEmail: true,
        },
      })

      alerts.push({
        id: `rapid-changes-${change.actorId}-${Date.now()}`,
        type: 'RAPID_CHANGES',
        severity: 'HIGH',
        message: `Múltiplas alterações de plano detectadas`,
        details: {
          actorId: change.actorId,
          actorEmail: actor?.actorEmail || 'Unknown',
          action: change.action,
          count: change._count.id,
          timeWindow: '1 hora',
        },
        createdAt: new Date(),
      })
    }

    // 2. Alterações em horários não usuais (fora de horário comercial)
    const unusualTimeChanges = await prisma.security_logs.findMany({
      where: {
        action: 'PLANO_ADVOGADO_ALTERADO',
        createdAt: {
          gte: oneDayAgo,
        },
      },
      select: {
        id: true,
        actorId: true,
        actorEmail: true,
        createdAt: true,
      },
    })

    for (const log of unusualTimeChanges) {
      const hour = new Date(log.createdAt).getHours()
      // Horário não comercial: antes das 8h ou depois das 20h
      if (hour < 8 || hour >= 20) {
        alerts.push({
          id: `unusual-time-${log.id}`,
          type: 'UNUSUAL_TIME',
          severity: 'MEDIUM',
          message: `Alteração de plano em horário não usual (${hour}h)`,
          details: {
            actorId: log.actorId,
            actorEmail: log.actorEmail,
            action: 'PLANO_ADVOGADO_ALTERADO',
            hour,
          },
          createdAt: new Date(log.createdAt),
        })
      }
    }

    // 3. Múltiplas ações críticas pelo mesmo admin
    const criticalActions = await prisma.security_logs.groupBy({
      by: ['actorId'],
      where: {
        severity: 'CRITICAL',
        createdAt: {
          gte: oneHourAgo,
        },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 10, // Mais de 10 ações críticas em 1 hora
          },
        },
      },
    })

    for (const action of criticalActions) {
      const actor = await prisma.security_logs.findFirst({
        where: {
          actorId: action.actorId,
        },
        select: {
          actorEmail: true,
        },
      })

      alerts.push({
        id: `multiple-critical-${action.actorId}-${Date.now()}`,
        type: 'MULTIPLE_CHANGES',
        severity: 'CRITICAL',
        message: `Múltiplas ações críticas detectadas`,
        details: {
          actorId: action.actorId,
          actorEmail: actor?.actorEmail || 'Unknown',
          action: 'MULTIPLE_CRITICAL',
          count: action._count.id,
          timeWindow: '1 hora',
        },
        createdAt: new Date(),
      })
    }

    // 4. Padrão de alterações suspeitas (mesmo advogado alterado múltiplas vezes)
    const suspiciousPatterns = await prisma.security_logs.groupBy({
      by: ['targetId', 'action'],
      where: {
        action: 'PLANO_ADVOGADO_ALTERADO',
        createdAt: {
          gte: oneDayAgo,
        },
      },
      _count: {
        id: true,
      },
      having: {
        id: {
          _count: {
            gt: 3, // Mesmo advogado alterado mais de 3 vezes em 1 dia
          },
        },
      },
    })

    for (const pattern of suspiciousPatterns) {
      const log = await prisma.security_logs.findFirst({
        where: {
          targetId: pattern.targetId,
          action: pattern.action,
        },
        select: {
          actorEmail: true,
          targetIdentifier: true,
        },
      })

      alerts.push({
        id: `suspicious-pattern-${pattern.targetId}-${Date.now()}`,
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        message: `Padrão suspeito: mesmo advogado alterado múltiplas vezes`,
        details: {
          actorId: 'multiple',
          actorEmail: log?.actorEmail || 'Unknown',
          action: pattern.action,
          targetId: pattern.targetId,
          targetIdentifier: log?.targetIdentifier || null,
          count: pattern._count.id,
          timeWindow: '1 dia',
        },
        createdAt: new Date(),
      })
    }
  } catch (error) {
    logger.error('[SecurityAlerts] Error detecting suspicious activity:', error)
  }

  return alerts
}

/**
 * Obtém alertas recentes (últimas 24 horas)
 */
export async function getRecentAlerts(): Promise<SecurityAlert[]> {
  return detectSuspiciousActivity()
}
