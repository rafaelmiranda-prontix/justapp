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
    const cidadao = await prisma.cidadaos.findUnique({
      where: { userId: session.user.id },
    })

    if (!cidadao) {
      return NextResponse.json({ error: 'Cidadão não encontrado' }, { status: 404 })
    }

    // Busca todos os casos do cidadão
    const casos = await prisma.casos.findMany({
      where: {
        cidadaoId: cidadao.id,
      },
      include: {
        especialidades: {
          select: {
            nome: true,
          },
        },
        matches: {
          include: {
            advogados: {
              select: {
                id: true,
                fotoUrl: true,
                users: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            enviadoEm: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
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
