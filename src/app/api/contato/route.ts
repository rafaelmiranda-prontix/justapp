import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/email-service'

const contatoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200),
  email: z.string().email('E-mail inválido'),
  whatsapp: z.string().max(20).optional(),
  assunto: z.string().min(1, 'Assunto é obrigatório').max(200),
  mensagem: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres').max(2000),
  tipo: z.enum(['advogado', 'cidadao', 'outro']).optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = contatoSchema.parse(body)

    const supportEmail =
      process.env.SUPPORT_EMAIL ||
      process.env.CONTATO_EMAIL ||
      process.env.NEXT_PUBLIC_SUPPORT_EMAIL

    if (!supportEmail) {
      return NextResponse.json(
        {
          error:
            'Contato não configurado no servidor. Defina NEXT_PUBLIC_SUPPORT_EMAIL ou SUPPORT_EMAIL no .env (ex.: suporte@seusite.com.br).',
        },
        { status: 503 }
      )
    }

    const tipoLabel = data.tipo
      ? { advogado: 'Advogado', cidadao: 'Cidadão', outro: 'Outro' }[data.tipo]
      : 'Não informado'

    const whatsappLine = data.whatsapp
      ? `<p><strong>WhatsApp:</strong> ${escapeHtml(data.whatsapp)}</p>`
      : ''
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Nova mensagem de contato – JustApp</h2>
        <p><strong>Nome:</strong> ${escapeHtml(data.nome)}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(data.email)}</p>
        ${whatsappLine}
        <p><strong>Assunto:</strong> ${escapeHtml(data.assunto)}</p>
        <p><strong>Sou:</strong> ${escapeHtml(tipoLabel)}</p>
        <p><strong>Mensagem:</strong></p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${escapeHtml(data.mensagem)}</div>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">
          Enviado em ${new Date().toLocaleString('pt-BR')} pelo formulário de contato.
        </p>
      </div>
    `
    const textWhatsapp = data.whatsapp ? `WhatsApp: ${data.whatsapp}\n` : ''
    const text = `Contato JustApp\n\nNome: ${data.nome}\nE-mail: ${data.email}\n${textWhatsapp}Assunto: ${data.assunto}\nSou: ${tipoLabel}\n\nMensagem:\n${data.mensagem}`

    await sendEmail({
      to: supportEmail,
      subject: `[Contato JustApp] ${data.assunto} – ${data.nome}`,
      html,
      text,
    })

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.errors[0]
      return NextResponse.json(
        { error: first?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }
    console.error('[CONTATO] Erro ao processar:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem. Tente novamente.' },
      { status: 500 }
    )
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
