import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'
import { EmailService } from '@/lib/email.service'

const includeMensagem = {
  remetente: {
    select: { id: true, name: true, email: true, role: true },
  },
  matches: {
    select: {
      id: true,
      status: true,
      casoId: true,
      advogados: {
        select: {
          userId: true,
          users: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      casos: {
        select: {
          id: true,
          cidadaos: {
            select: {
              userId: true,
              users: { select: { id: true, name: true, email: true, role: true } },
            },
          },
        },
      },
    },
  },
} as const

type Row = {
  id: string
  remetenteId: string
  conteudo: string
  remetente: { id: string; name: string; email: string; role: string }
  matches: {
    id: string
    advogados: { userId: string; users: { id: string; name: string; email: string; role: string } }
    casos: {
      cidadaos: { userId: string; users: { id: string; name: string; email: string; role: string } }
    }
  }
}

function resolveDestinatario(m: Row) {
  const advUser = m.matches.advogados.users
  const cidUser = m.matches.casos.cidadaos.users
  const advUserId = m.matches.advogados.userId
  const cidUserId = m.matches.casos.cidadaos.userId

  if (m.remetenteId === cidUserId) {
    return { id: advUser.id, name: advUser.name, email: advUser.email, role: advUser.role }
  }
  if (m.remetenteId === advUserId) {
    return { id: cidUser.id, name: cidUser.name, email: cidUser.email, role: cidUser.role }
  }
  return null
}

function chatUrlForRecipient(base: string, matchId: string, role: string | undefined) {
  const root = base.replace(/\/$/, '')
  if (role === 'ADVOGADO') return `${root}/advogado/chat/${matchId}`
  if (role === 'CIDADAO') return `${root}/chat/${matchId}`
  return ''
}

/**
 * POST — envia e-mail de aviso (manual) sobre esta mensagem.
 * Body opcional: { testEmail?: string } — se informado, envia para esse endereço (modo teste).
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ messageId: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { messageId } = await context.params
  let body: { testEmail?: string } = {}
  try {
    body = (await req.json()) as { testEmail?: string }
  } catch {
    body = {}
  }

  const testEmail =
    typeof body.testEmail === 'string' ? body.testEmail.trim().toLowerCase() : ''

  if (testEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
    return NextResponse.json({ error: 'E-mail de teste inválido' }, { status: 400 })
  }

  const message = await prisma.mensagens.findUnique({
    where: { id: messageId },
    include: includeMensagem,
  })

  if (!message) {
    return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
  }

  const dest = resolveDestinatario(message as Row)
  const preview =
    message.conteudo.length > 200
      ? `${message.conteudo.slice(0, 200)}…`
      : message.conteudo

  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    ''

  const matchId = message.matches.id

  if (!testEmail && !dest) {
    return NextResponse.json(
      {
        error:
          'Destinatário não inferido para esta linha (inconsistência). Use “Testar envio” com um e-mail digitado.',
      },
      { status: 400 }
    )
  }

  const to = testEmail || dest!.email
  const recipientName = dest?.name ?? 'Destinatário da conversa'
  const chatUrl = dest ? chatUrlForRecipient(base, matchId, dest.role) : ''

  const result = await EmailService.sendChatNewMessageNotification({
    to,
    recipientName,
    senderName: message.remetente.name,
    senderEmail: message.remetente.email,
    messagePreview: preview,
    chatUrl,
    testBanner: Boolean(testEmail),
  })

  if (!result.success) {
    return NextResponse.json(
      { error: result.message || 'Falha ao enviar e-mail' },
      { status: 502 }
    )
  }

  return NextResponse.json({
    success: true,
    sentTo: to,
    test: Boolean(testEmail),
  })
}
