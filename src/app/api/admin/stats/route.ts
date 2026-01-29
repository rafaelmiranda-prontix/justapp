import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'

export async function GET() {
  try {
    const { error, session } = await requireAdmin()

    if (error) {
      return error
    }

    // Estatísticas de usuários
    const [totalUsuarios, cidadaos, advogados, admins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CIDADAO' } }),
      prisma.user.count({ where: { role: 'ADVOGADO' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
    ])

    // Estatísticas de advogados
    const [
      totalAdvogados,
      advogadosPendentes,
      advogadosAprovados,
      advogadosSuspensos,
    ] = await Promise.all([
      prisma.advogado.count(),
      prisma.advogado.count({ where: { oabVerificado: false } }),
      prisma.advogado.count({ where: { oabVerificado: true } }),
      // Por enquanto não temos campo de suspenso, usar 0
      0,
    ])

    // Estatísticas de casos
    const [totalCasos, casosAbertos, casosEmAndamento, casosFechados] =
      await Promise.all([
        prisma.caso.count(),
        prisma.caso.count({ where: { status: 'ABERTO' } }),
        prisma.caso.count({ where: { status: 'EM_ANDAMENTO' } }),
        prisma.caso.count({ where: { status: 'FECHADO' } }),
      ])

    // Estatísticas de matches
    const [totalMatches, matchesAceitos, matchesRecusados] = await Promise.all([
      prisma.match.count(),
      prisma.match.count({ where: { status: 'ACEITO' } }),
      prisma.match.count({ where: { status: 'RECUSADO' } }),
    ])

    // Estatísticas de avaliações
    const [totalAvaliacoes, avaliacoesReportadas] = await Promise.all([
      prisma.avaliacao.count(),
      // Por enquanto não temos campo de reportado, usar 0
      0,
    ])

    return NextResponse.json({
      success: true,
      data: {
        usuarios: {
          total: totalUsuarios,
          cidadaos,
          advogados,
          admins,
        },
        advogados: {
          total: totalAdvogados,
          pendentes: advogadosPendentes,
          aprovados: advogadosAprovados,
          suspensos: advogadosSuspensos,
        },
        casos: {
          total: totalCasos,
          abertos: casosAbertos,
          emAndamento: casosEmAndamento,
          fechados: casosFechados,
        },
        matches: {
          total: totalMatches,
          aceitos: matchesAceitos,
          recusados: matchesRecusados,
        },
        avaliacoes: {
          total: totalAvaliacoes,
          reportadas: avaliacoesReportadas,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}
