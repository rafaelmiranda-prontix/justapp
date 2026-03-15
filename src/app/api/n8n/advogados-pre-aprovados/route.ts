import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireN8nApiKey } from '@/lib/n8n-auth'

/**
 * GET /api/n8n/advogados-pre-aprovados
 * Retorna advogados pré-aprovados (ainda não aprovados final) para o N8N enviar mensagem.
 * Segurança: header X-API-Key ou Authorization: Bearer com N8N_API_KEY.
 */
export async function GET(req: Request) {
  const authError = requireN8nApiKey(req)
  if (authError) return authError

  try {
    const advogados = await prisma.advogados.findMany({
      where: {
        preAprovado: true,
        aprovado: false,
      },
      select: {
        id: true,
        users: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const data = advogados.map((a) => ({
      id: a.id,
      name: a.users?.name ?? '',
      email: a.users?.email ?? '',
      phone: a.users?.phone ?? null,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[N8N] Erro ao listar pré-aprovados:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar advogados pré-aprovados' },
      { status: 500 }
    )
  }
}
