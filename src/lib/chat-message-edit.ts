import { prisma } from '@/lib/prisma'
import { ConfigService } from '@/lib/config-service'
import type { CasoStatus, MatchStatus, mensagens } from '@prisma/client'

const MAX_CONTENT_LENGTH = 2000

export type ChatMessageForEdit = Pick<
  mensagens,
  | 'id'
  | 'matchId'
  | 'remetenteId'
  | 'conteudo'
  | 'createdAt'
  | 'deletedAt'
  | 'blockedForReview'
>

export type MatchContextForEdit = {
  status: MatchStatus
  caso: {
    status: CasoStatus
    closedAt: Date | null
  }
}

export type CanEditMessageResult =
  | { ok: true; windowMinutes: number }
  | { ok: false; reason: string; status: number }

export async function canEditMessage(params: {
  message: ChatMessageForEdit
  match: MatchContextForEdit
  userId: string
}): Promise<CanEditMessageResult> {
  const { message, match, userId } = params

  if (message.remetenteId !== userId) {
    return { ok: false, reason: 'Apenas o autor pode editar esta mensagem.', status: 403 }
  }

  if (message.deletedAt) {
    return { ok: false, reason: 'Mensagem removida não pode ser editada.', status: 400 }
  }

  if (message.blockedForReview) {
    return { ok: false, reason: 'Mensagem bloqueada para análise não pode ser editada.', status: 400 }
  }

  if (match.status === 'RECUSADO' || match.status === 'EXPIRADO') {
    return { ok: false, reason: 'Não é possível editar mensagens neste contato.', status: 400 }
  }

  const chatOnlyAfterAccept = await ConfigService.isChatOnlyAfterAccept()
  if (chatOnlyAfterAccept && match.status !== 'ACEITO' && match.status !== 'CONTRATADO') {
    return { ok: false, reason: 'Edição indisponível para o status atual do contato.', status: 403 }
  }

  if (match.caso.closedAt || match.caso.status === 'FECHADO' || match.caso.status === 'CANCELADO') {
    return { ok: false, reason: 'Caso encerrado: edição não permitida.', status: 400 }
  }

  const windowMinutes = await ConfigService.getChatMessageEditWindowMinutes()
  const deadline = new Date(message.createdAt.getTime() + windowMinutes * 60 * 1000)
  if (Date.now() > deadline.getTime()) {
    return {
      ok: false,
      reason: `Prazo de edição expirado (${windowMinutes} min após o envio).`,
      status: 400,
    }
  }

  return { ok: true, windowMinutes }
}

function normalizeContent(raw: string): string {
  return raw.trim()
}

export type EditMatchMessageResult =
  | {
      ok: true
      previousContent: string
      mensagem: mensagens & {
        remetente: { id: string; name: string; image: string | null }
      }
    }
  | { ok: false; error: string; status: number }

/**
 * Persiste edição com histórico e metadados (transação).
 */
export async function editMatchMessage(params: {
  messageId: string
  userId: string
  newContent: string
}): Promise<EditMatchMessageResult> {
  const content = normalizeContent(params.newContent)
  if (!content) {
    return { ok: false, error: 'O conteúdo não pode ficar vazio.', status: 400 }
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return { ok: false, error: `Mensagem muito longa (máximo ${MAX_CONTENT_LENGTH} caracteres).`, status: 400 }
  }

  const message = await prisma.mensagens.findUnique({
    where: { id: params.messageId },
    select: {
      id: true,
      matchId: true,
      remetenteId: true,
      conteudo: true,
      createdAt: true,
      deletedAt: true,
      blockedForReview: true,
    },
  })

  if (!message) {
    return { ok: false, error: 'Mensagem não encontrada.', status: 404 }
  }

  const match = await prisma.matches.findUnique({
    where: { id: message.matchId },
    select: {
      status: true,
      casos: { select: { status: true, closedAt: true } },
    },
  })

  if (!match) {
    return { ok: false, error: 'Contato não encontrado.', status: 404 }
  }

  const eligibility = await canEditMessage({
    message,
    match: { status: match.status, caso: match.casos },
    userId: params.userId,
  })

  if (!eligibility.ok) {
    return { ok: false, error: eligibility.reason, status: eligibility.status }
  }

  if (message.conteudo === content) {
    return { ok: false, error: 'Nenhuma alteração no texto.', status: 400 }
  }

  const previousContent = message.conteudo

  const updated = await prisma.$transaction(async (tx) => {
    await tx.messageEditHistory.create({
      data: {
        messageId: message.id,
        previousContent,
        newContent: content,
        editedByUserId: params.userId,
      },
    })

    return tx.mensagens.update({
      where: { id: message.id },
      data: {
        conteudo: content,
        isEdited: true,
        editedAt: new Date(),
        editCount: { increment: 1 },
        lastEditedByUserId: params.userId,
      },
      include: {
        remetente: { select: { id: true, name: true, image: true } },
      },
    })
  })

  return { ok: true, previousContent, mensagem: updated }
}
