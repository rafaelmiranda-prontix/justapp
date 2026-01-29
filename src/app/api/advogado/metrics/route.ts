import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Busca o advogado
    const advogado = await prisma.advogado.findUnique({
      where: { userId: session.user.id },
    })

    if (!advogado) {
      return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    }

    // Busca todos os matches do advogado
    const matches = await prisma.match.findMany({
      where: {
        advogadoId: advogado.id,
      },
      include: {
        caso: {
          include: {
            especialidade: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    })

    // Calcula estatísticas
    const leadsRecebidos = matches.length
    const leadsPendentes = matches.filter((m) => m.status === 'PENDENTE').length
    const leadsVisualizados = matches.filter((m) => m.status === 'VISUALIZADO').length
    const leadsAceitos = matches.filter((m) => m.status === 'ACEITO').length
    const leadsRecusados = matches.filter((m) => m.status === 'RECUSADO').length
    const leadsContratados = matches.filter((m) => m.status === 'CONTRATADO').length

    // Taxa de conversão (leads → aceitos)
    const taxaConversao =
      leadsRecebidos > 0 ? Math.round((leadsAceitos / leadsRecebidos) * 100) : 0

    // Tempo médio de resposta (em horas)
    const matchesComResposta = matches.filter(
      (m) => m.respondidoEm !== null && m.visualizadoEm !== null
    )

    let tempoMedioResposta = 0
    if (matchesComResposta.length > 0) {
      const tempos = matchesComResposta.map((match) => {
        const diffMs =
          match.respondidoEm!.getTime() - match.visualizadoEm!.getTime()
        return diffMs / (1000 * 60 * 60) // horas
      })

      tempoMedioResposta = Math.round(
        (tempos.reduce((acc, t) => acc + t, 0) / tempos.length) * 10
      ) / 10
    }

    // Leads recebidos nos últimos 30 dias
    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

    const leadsUltimos30Dias = matches.filter(
      (m) => m.enviadoEm >= trintaDiasAtras
    ).length

    // Leads por especialidade
    const leadsPorEspecialidade = matches.reduce((acc, match) => {
      const especialidade =
        match.caso.especialidade?.nome || 'Sem especialidade'
      acc[especialidade] = (acc[especialidade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Taxa de aceitação por especialidade
    const aceitacaoPorEspecialidade = matches.reduce((acc, match) => {
      const especialidade =
        match.caso.especialidade?.nome || 'Sem especialidade'
      if (!acc[especialidade]) {
        acc[especialidade] = { total: 0, aceitos: 0 }
      }
      acc[especialidade].total++
      if (match.status === 'ACEITO') {
        acc[especialidade].aceitos++
      }
      return acc
    }, {} as Record<string, { total: number; aceitos: number }>)

    // Busca avaliações
    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        advogadoId: advogado.id,
      },
      select: {
        nota: true,
      },
    })

    const totalAvaliacoes = avaliacoes.length
    const avaliacaoMedia =
      totalAvaliacoes > 0
        ? avaliacoes.reduce((acc, av) => acc + av.nota, 0) / totalAvaliacoes
        : 0

    return NextResponse.json({
      success: true,
      data: {
        leads: {
          recebidos: leadsRecebidos,
          pendentes: leadsPendentes,
          visualizados: leadsVisualizados,
          aceitos: leadsAceitos,
          recusados: leadsRecusados,
          contratados: leadsContratados,
        },
        conversao: {
          taxa: taxaConversao,
          leadsAceitos,
          leadsRecebidos,
        },
        tempoMedioResposta, // em horas
        leadsUltimos30Dias,
        leadsPorEspecialidade,
        aceitacaoPorEspecialidade,
        avaliacoes: {
          media: Math.round(avaliacaoMedia * 10) / 10,
          total: totalAvaliacoes,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar métricas' },
      { status: 500 }
    )
  }
}
