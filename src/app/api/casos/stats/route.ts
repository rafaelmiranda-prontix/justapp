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

    // Busca todos os casos
    const casos = await prisma.casos.findMany({
      where: {
        cidadaoId: cidadao.id,
      },
      include: {
        matches: {
          include: {
            advogados: {
              select: {
                id: true,
              },
            },
          },
        },
        especialidades: {
          select: {
            nome: true,
          },
        },
      },
    })

    // Calcula estatísticas
    const casosAbertos = casos.filter((c) => c.status === 'ABERTO').length
    const casosEmAndamento = casos.filter((c) => c.status === 'EM_ANDAMENTO').length
    const casosFechados = casos.filter((c) => c.status === 'FECHADO').length
    const casosCancelados = casos.filter((c) => c.status === 'CANCELADO').length

    const totalMatches = casos.reduce((acc, c) => acc + c.matches.length, 0)
    const matchesAceitos = casos.reduce(
      (acc, c) => acc + c.matches.filter((m) => m.status === 'ACEITO').length,
      0
    )
    const matchesPendentes = casos.reduce(
      (acc, c) => acc + c.matches.filter((m) => m.status === 'PENDENTE').length,
      0
    )

    // Taxa de conversão (matches → aceitos)
    const taxaConversao =
      totalMatches > 0 ? Math.round((matchesAceitos / totalMatches) * 100) : 0

    // Tempo médio de resposta (simplificado - dias desde criação até primeiro match aceito)
    const casosComMatchAceito = casos.filter((c) =>
      c.matches.some((m) => m.status === 'ACEITO')
    )

    let tempoMedioResposta = 0
    if (casosComMatchAceito.length > 0) {
      const tempos = casosComMatchAceito.map((caso) => {
        const primeiroMatchAceito = caso.matches
          .filter((m) => m.status === 'ACEITO')
          .sort((a, b) => a.enviadoEm.getTime() - b.enviadoEm.getTime())[0]

        if (primeiroMatchAceito) {
          const diffMs = primeiroMatchAceito.enviadoEm.getTime() - caso.createdAt.getTime()
          return diffMs / (1000 * 60 * 60 * 24) // dias
        }
        return 0
      })

      tempoMedioResposta = Math.round(
        tempos.reduce((acc, t) => acc + t, 0) / tempos.length
      )
    }

    // Casos por especialidade
    const casosPorEspecialidade = casos.reduce((acc, caso) => {
      const especialidade = caso.especialidades?.nome || 'Sem especialidade'
      acc[especialidade] = (acc[especialidade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Casos criados nos últimos 30 dias
    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

    const casosUltimos30Dias = casos.filter(
      (c) => c.createdAt >= trintaDiasAtras
    ).length

    return NextResponse.json({
      success: true,
      data: {
        casos: {
          abertos: casosAbertos,
          emAndamento: casosEmAndamento,
          fechados: casosFechados,
          cancelados: casosCancelados,
          total: casos.length,
        },
        matches: {
          total: totalMatches,
          aceitos: matchesAceitos,
          pendentes: matchesPendentes,
          taxaConversao,
        },
        tempoMedioResposta, // em dias
        casosPorEspecialidade,
        casosUltimos30Dias,
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
