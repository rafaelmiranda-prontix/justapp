import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'CIDADAO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Busca o cidadao
    const cidadao = await prisma.cidadao.findUnique({
      where: { userId: session.user.id },
    })

    if (!cidadao) {
      return NextResponse.json({ error: 'Cidadão não encontrado' }, { status: 404 })
    }

    // Busca o caso mais recente que ainda não está concluído
    const caso = await prisma.caso.findFirst({
      where: {
        cidadaoId: cidadao.id,
        status: {
          in: ['ABERTO', 'EM_ANDAMENTO'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: caso,
    })
  } catch (error) {
    console.error('Error fetching active caso:', error)
    return NextResponse.json({ error: 'Erro ao buscar caso ativo' }, { status: 500 })
  }
}
