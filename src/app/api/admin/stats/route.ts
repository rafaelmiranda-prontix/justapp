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
      prisma.users.count(),
      prisma.users.count({ where: { role: 'CIDADAO' } }),
      prisma.users.count({ where: { role: 'ADVOGADO' } }),
      prisma.users.count({ where: { role: 'ADMIN' } }),
    ])

    // Estatísticas de advogados
    const [
      totalAdvogados,
      advogadosPendentes,
      advogadosAprovados,
      advogadosSuspensos,
    ] = await Promise.all([
      prisma.advogados.count(),
      prisma.advogados.count({ where: { oabVerificado: false } }),
      prisma.advogados.count({ where: { oabVerificado: true } }),
      // Por enquanto não temos campo de suspenso, usar 0
      0,
    ])

    // Estatísticas de casos
    const [totalCasos, casosAbertos, casosEmAndamento, casosFechados] =
      await Promise.all([
        prisma.casos.count(),
        prisma.casos.count({ where: { status: 'ABERTO' } }),
        prisma.casos.count({ where: { status: 'EM_ANDAMENTO' } }),
        prisma.casos.count({ where: { status: 'FECHADO' } }),
      ])

    // Estatísticas de matches
    const [totalMatches, matchesAceitos, matchesRecusados] = await Promise.all([
      prisma.matches.count(),
      prisma.matches.count({ where: { status: 'ACEITO' } }),
      prisma.matches.count({ where: { status: 'RECUSADO' } }),
    ])

    // Estatísticas de avaliações
    const [totalAvaliacoes, avaliacoesReportadas] = await Promise.all([
      prisma.avaliacoes.count(),
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
