import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ConfigService } from '@/lib/config-service'
import { z } from 'zod'

const updateConfigSchema = z.object({
  chave: z.string(),
  valor: z.union([z.string(), z.number(), z.boolean()]),
})

// GET - Listar todas as configurações
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const configuracoes = await prisma.configuracoes.findMany({
      orderBy: [
        { categoria: 'asc' },
        { chave: 'asc' },
      ],
    })

    // Agrupar por categoria
    const configuracoesPorCategoria = configuracoes.reduce((acc, config) => {
      const categoria = config.categoria || 'outros'
      if (!acc[categoria]) {
        acc[categoria] = []
      }
      acc[categoria].push(config)
      return acc
    }, {} as Record<string, typeof configuracoes>)

    return NextResponse.json({
      success: true,
      data: {
        configuracoes,
        porCategoria: configuracoesPorCategoria,
      },
    })
  } catch (error) {
    console.error('Error fetching configuracoes:', error)
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
  }
}

// POST - Atualizar uma configuração
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { chave, valor } = updateConfigSchema.parse(body)

    // Buscar configuração existente
    const configExistente = await prisma.configuracoes.findUnique({
      where: { chave },
    })

    if (!configExistente) {
      return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 404 })
    }

    // Converter valor para string baseado no tipo
    let valorString: string
    if (configExistente.tipo === 'NUMBER') {
      valorString = String(valor)
    } else if (configExistente.tipo === 'BOOLEAN') {
      valorString = String(valor)
    } else {
      valorString = String(valor)
    }

    // Atualizar configuração
    const configAtualizada = await prisma.configuracoes.update({
      where: { chave },
      data: {
        valor: valorString,
        updatedAt: new Date(),
      },
    })

    // Limpar cache do ConfigService
    ConfigService.clearCache()

    return NextResponse.json({
      success: true,
      message: 'Configuração atualizada com sucesso',
      data: configAtualizada,
    })
  } catch (error) {
    console.error('Error updating configuracao:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 })
  }
}
