import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ConfigService } from '@/lib/config-service'
import { CONFIGURACOES_DEFINIDAS, getDefinicaoConfiguracao } from '@/lib/configuracoes-definitions'
import { z } from 'zod'
import { nanoid } from 'nanoid'

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

    const configuracoesDb = await prisma.configuracoes.findMany({
      orderBy: [
        { categoria: 'asc' },
        { chave: 'asc' },
      ],
    })

    const chavesDb = new Set(configuracoesDb.map((c) => c.chave))
    const now = new Date()
    const extras: typeof configuracoesDb = []

    for (const [chave, def] of Object.entries(CONFIGURACOES_DEFINIDAS)) {
      if (chavesDb.has(chave)) continue
      extras.push({
        id: `__virtual__${chave}`,
        chave,
        valor: def.valorPadrao,
        tipo: def.tipo,
        descricao: def.descricao,
        categoria: def.categoria,
        createdAt: now,
        updatedAt: now,
      })
    }

    const configuracoes = [...configuracoesDb, ...extras].sort((a, b) => {
      const ca = a.categoria || 'outros'
      const cb = b.categoria || 'outros'
      if (ca !== cb) return ca.localeCompare(cb)
      return a.chave.localeCompare(b.chave)
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

    const definicao = !configExistente ? getDefinicaoConfiguracao(chave) : null
    if (!configExistente && !definicao) {
      return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 404 })
    }

    const tipo = configExistente?.tipo ?? definicao!.tipo

    let valorString: string
    if (tipo === 'NUMBER') {
      valorString = String(valor)
    } else if (tipo === 'BOOLEAN') {
      valorString = String(valor)
    } else {
      valorString = String(valor)
    }

    const configAtualizada = configExistente
      ? await prisma.configuracoes.update({
          where: { chave },
          data: {
            valor: valorString,
            updatedAt: new Date(),
          },
        })
      : await prisma.configuracoes.create({
          data: {
            id: nanoid(),
            chave,
            valor: valorString,
            tipo: definicao!.tipo,
            descricao: definicao!.descricao,
            categoria: definicao!.categoria,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })

    ConfigService.clearCache()

    return NextResponse.json({
      success: true,
      message: configExistente ? 'Configuração atualizada com sucesso' : 'Configuração criada com sucesso',
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
