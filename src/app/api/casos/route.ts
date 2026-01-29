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

    // Busca todos os casos do cidadão
    const casos = await prisma.caso.findMany({
      where: {
        cidadaoId: cidadao.id,
      },
      include: {
        especialidade: {
          select: {
            nome: true,
          },
        },
        matches: {
          include: {
            advogado: {
              select: {
                nome: true,
                foto: true,
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            criadoEm: 'desc',
          },
        },
      },
      orderBy: {
        criadoEm: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: casos,
    })
  } catch (error) {
    console.error('Error fetching casos:', error)
    return NextResponse.json({ error: 'Erro ao buscar casos' }, { status: 500 })
  }
}
