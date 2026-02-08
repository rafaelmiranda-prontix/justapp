import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { CaseDistributionService } from '@/lib/case-distribution.service'
import { NotificationService } from '@/lib/notification.service'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const createCaseSchema = z.object({
  description: z.string().min(10),
  date: z.string().optional(),
  hasEvidence: z.boolean().optional(),
  attemptedResolution: z.boolean().optional(),
  especialidadeId: z.string().optional(),
  urgencia: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
  cidade: z.string().min(2),
  estado: z.string().length(2),
  audioUrls: z.array(z.string().url()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'CIDADAO') {
      return NextResponse.json(
        { success: false, error: 'Apenas cidadãos podem criar casos' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = createCaseSchema.parse(body)

    // Buscar cidadão
    const cidadao = await prisma.cidadaos.findUnique({
      where: { userId: session.user.id },
    })

    if (!cidadao) {
      return NextResponse.json(
        { success: false, error: 'Cidadão não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar localização do cidadão se necessário
    if (data.cidade && data.estado) {
      await prisma.cidadaos.update({
        where: { id: cidadao.id },
        data: {
          cidade: data.cidade,
          estado: data.estado,
        },
      })
    }

    // Criar histórico de conversa com URLs de áudio
    const historicoCompleto = JSON.stringify({
      messages: [
        {
          role: 'assistant',
          content: 'Olá! Sou seu assistente JustApp. Vou te ajudar a encontrar o advogado ideal para o seu caso.',
        },
        {
          role: 'user',
          content: data.description,
          audioUrl: data.audioUrls?.[0],
        },
        ...(data.date
          ? [
              {
                role: 'assistant',
                content: 'Quando isso aconteceu aproximadamente?',
              },
              {
                role: 'user',
                content: data.date,
                audioUrl: data.audioUrls?.[1],
              },
            ]
          : []),
        ...(data.hasEvidence !== undefined
          ? [
              {
                role: 'assistant',
                content: 'Você tem algum comprovante relacionado a isso?',
              },
              {
                role: 'user',
                content: data.hasEvidence ? 'Sim' : 'Não',
                audioUrl: data.audioUrls?.[2],
              },
            ]
          : []),
        ...(data.attemptedResolution !== undefined
          ? [
              {
                role: 'assistant',
                content: 'Você já tentou resolver isso diretamente?',
              },
              {
                role: 'user',
                content: data.attemptedResolution ? 'Sim' : 'Não',
                audioUrl: data.audioUrls?.[3],
              },
            ]
          : []),
      ],
    })

    // Só usa especialidadeId se for string não vazia (evita FK violation)
    const especialidadeId =
      data.especialidadeId && String(data.especialidadeId).trim()
        ? data.especialidadeId.trim()
        : null

    // Criar caso
    const caso = await prisma.casos.create({
      data: {
        id: nanoid(),
        cidadaoId: cidadao.id,
        descricao: data.description,
        especialidadeId,
        urgencia: data.urgencia || 'NORMAL',
        status: 'ABERTO',
        conversaHistorico: historicoCompleto,
        updatedAt: new Date(),
      },
    })

    logger.info(`[CreateCase] Case created: ${caso.id} for citizen ${cidadao.id}`)

    // Distribuir caso para advogados
    const distributionResult = await CaseDistributionService.distributeCase(caso.id)

    logger.info(
      `[CreateCase] Case ${caso.id} distributed: ${distributionResult.matchesCreated} matches created`
    )

    // Notificar advogados sobre os novos matches
    const matches = await prisma.matches.findMany({
      where: {
        casoId: caso.id,
        status: 'PENDENTE',
      },
    })

    for (const match of matches) {
      NotificationService.notifyLawyerNewMatch(match.id).catch((err) =>
        logger.error('[CreateCase] Notification failed:', err)
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        casoId: caso.id,
        matchesCreated: distributionResult.matchesCreated,
      },
    })
  } catch (error: any) {
    logger.error('[CreateCase] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao criar caso',
      },
      { status: 500 }
    )
  }
}
