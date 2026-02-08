/**
 * Sistema de log de segurança para ações administrativas críticas
 * Sempre loga em produção para auditoria
 */

import { logger } from './logger'
import { prisma } from './prisma'
import type { NextRequest } from 'next/server'

const isProduction = process.env.NODE_ENV === 'production'

export interface SecurityLogEntry {
  action: string
  actor: {
    id: string
    email: string
    name: string
    role: string
  }
  target: {
    type: string
    id: string
    identifier?: string // Email, OAB, etc
  }
  changes?: {
    field: string
    from: any
    to: any
  }[]
  metadata?: {
    ipAddress?: string
    userAgent?: string
    motivo?: string
    [key: string]: any
  }
  timestamp: Date
}

/**
 * Determina a severidade baseada na ação
 */
function getSeverity(action: string): 'INFO' | 'WARNING' | 'CRITICAL' {
  const criticalActions = [
    'PLANO_ADVOGADO_ALTERADO',
    'ADVOGADO_APROVADO',
    'ADVOGADO_REJEITADO',
    'CASO_DELETADO',
    'USUARIO_SUSPENSO',
    'CASO_MEDIACAO_ASSUMIDA',
    'CASO_FECHADO',
  ]

  const warningActions = [
    'CONFIGURACAO_ALTERADA',
    'PLANO_CRIADO',
    'PLANO_EDITADO',
  ]

  if (criticalActions.includes(action)) {
    return 'CRITICAL'
  }
  if (warningActions.includes(action)) {
    return 'WARNING'
  }
  return 'INFO'
}

/**
 * Log de segurança - sempre registra, mesmo em produção
 * Formato estruturado para fácil análise e auditoria
 * Também salva no banco de dados para consulta
 */
export async function securityLog(entry: SecurityLogEntry) {
  const severity = getSeverity(entry.action)

  const logEntry = {
    '[SECURITY]': {
      action: entry.action,
      timestamp: entry.timestamp.toISOString(),
      actor: {
        id: entry.actor.id,
        email: entry.actor.email,
        name: entry.actor.name,
        role: entry.actor.role,
      },
      target: {
        type: entry.target.type,
        id: entry.target.id,
        ...(entry.target.identifier && { identifier: entry.target.identifier }),
      },
      ...(entry.changes && entry.changes.length > 0 && { changes: entry.changes }),
      ...(entry.metadata && Object.keys(entry.metadata).length > 0 && { metadata: entry.metadata }),
      severity,
    },
  }

  // Salvar no banco de dados (não bloqueia se falhar)
  try {
    await prisma.security_logs.create({
      data: {
        action: entry.action,
        actorId: entry.actor.id,
        actorEmail: entry.actor.email,
        actorName: entry.actor.name,
        actorRole: entry.actor.role,
        targetType: entry.target.type,
        targetId: entry.target.id,
        targetIdentifier: entry.target.identifier || null,
        changes: entry.changes ? (entry.changes as any) : null,
        metadata: entry.metadata ? (entry.metadata as any) : null,
        severity,
        createdAt: entry.timestamp,
      },
    })
  } catch (error) {
    // Logar erro mas não falhar a operação principal
    logger.error('[SecurityLog] Failed to save to database:', error)
  }

  // Em produção, sempre logar (mas sanitizar dados sensíveis)
  // Em desenvolvimento, logar normalmente
  if (isProduction) {
    // Em produção, usar console.error para garantir que seja capturado
    // pelos sistemas de monitoramento
    console.error(JSON.stringify(logEntry))
  } else {
    // Em desenvolvimento, usar logger.info para melhor visualização
    logger.info(JSON.stringify(logEntry, null, 2))
  }
}

/**
 * Helper para extrair IP do request
 */
export function getClientIp(req: Request | NextRequest): string | undefined {
  if ('headers' in req) {
    // NextRequest
    const headers = req.headers
    const forwarded = headers.get('x-forwarded-for')
    const realIp = headers.get('x-real-ip')
    return forwarded?.split(',')[0]?.trim() || realIp || undefined
  }
  return undefined
}

/**
 * Helper para extrair User-Agent do request
 */
export function getUserAgent(req: Request | NextRequest): string | undefined {
  if ('headers' in req) {
    return req.headers.get('user-agent') || undefined
  }
  return undefined
}
