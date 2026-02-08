import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { securityLog, getClientIp, getUserAgent } from '@/lib/security-logger'
import { randomUUID } from 'crypto'

/**
 * POST /api/admin/casos/[casoId]/assume-mediation
 * Admin assume a mediação do caso (lock: só 1 admin por vez).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ casoId: string }> }
) {
  try {
    const { error, session } = await requireAdmin()
    if (error || !session?.user) {
      return error ?? NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { casoId } = await params
    const adminId = session.user.id

    const caso = await prisma.casos.findUnique({
      where: { id: casoId },
      include: {
        cidadaos: { include: { users: { select: { name: true, email: true } } } },
      },
    })

    if (!caso) {
      return NextResponse.json({ success: false, error: 'Caso não encontrado' }, { status: 404 })
    }

    if (caso.mediatedByAdminId && caso.mediatedByAdminId !== adminId) {
      const otherAdmin = await prisma.users.findUnique({
        where: { id: caso.mediatedByAdminId },
        select: { name: true },
      })
      return NextResponse.json(
        {
          success: false,
          error: `Caso já está em mediação por ${otherAdmin?.name ?? 'outro administrador'}.`,
        },
        { status: 409 }
      )
    }

    if (caso.mediatedByAdminId === adminId) {
      return NextResponse.json({
        success: true,
        message: 'Você já está com a mediação deste caso',
        data: { alreadyAssumed: true },
      })
    }

    const updated = await prisma.casos.update({
      where: { id: casoId },
      data: {
        mediatedByAdminId: adminId,
        mediatedAt: new Date(),
        status: 'EM_MEDIACAO',
      },
      include: {
        especialidades: true,
        cidadaos: {
          include: {
            users: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    await securityLog({
      action: 'CASO_MEDIACAO_ASSUMIDA',
      actor: {
        id: session.user.id,
        email: session.user.email ?? '',
        name: session.user.name ?? '',
        role: session.user.role ?? 'ADMIN',
      },
      target: { type: 'CASO', id: casoId, identifier: caso.descricao?.slice(0, 50) },
      changes: [
        { field: 'mediatedByAdminId', from: null, to: adminId },
        { field: 'status', from: caso.status, to: 'EM_MEDIACAO' },
      ],
      metadata: {
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
      },
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: 'Mediação assumida com sucesso',
      data: updated,
    })
  } catch (e) {
    console.error('assume-mediation error:', e)
    return NextResponse.json(
      { success: false, error: 'Erro ao assumir mediação' },
      { status: 500 }
    )
  }
}
