import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'

/**
 * GET /api/admin/chat-messages/[messageId]/edit-history
 * Histórico de edições (auditoria).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { messageId } = await params

    const msg = await prisma.mensagens.findUnique({
      where: { id: messageId },
      select: { id: true },
    })
    if (!msg) {
      return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
    }

    const rows = await prisma.messageEditHistory.findMany({
      where: { messageId },
      orderBy: { editedAt: 'asc' },
      include: {
        editedBy: { select: { id: true, name: true, email: true, role: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        previousContent: r.previousContent,
        newContent: r.newContent,
        editedAt: r.editedAt.toISOString(),
        editedBy: r.editedBy,
      })),
    })
  } catch (e) {
    console.error('[admin/chat-messages/edit-history]', e)
    return NextResponse.json({ error: 'Erro ao carregar histórico' }, { status: 500 })
  }
}
