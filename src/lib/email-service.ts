import { Resend } from 'resend'
import { logger } from './logger'

// Inicializa Resend (se não houver API key, não envia email)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM_EMAIL = process.env.EMAIL_FROM || 'LegalConnect <noreply@legalconnect.com>'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Envia email usando Resend
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  // Se não tiver API key configurada, apenas loga
  if (!resend) {
    logger.warn('[EMAIL] Resend não configurado. Email que seria enviado')
    logger.debug({ to: '[REDACTED]', subject, preview: html.substring(0, 100) })
    return { success: false, message: 'Resend não configurado' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text,
    })

    if (error) {
      logger.error('[EMAIL] Erro ao enviar:', error)
      return { success: false, error }
    }

    logger.info('[EMAIL] Email enviado com sucesso:', data?.id)
    return { success: true, data }
  } catch (error) {
    logger.error('[EMAIL] Erro ao enviar email:', error)
    return { success: false, error }
  }
}

/**
 * Templates de email
 */

export const emailTemplates = {
  // Notificação de novo match para advogado
  novoMatch: (advogadoNome: string, casoTitulo: string, matchUrl: string) => ({
    subject: 'Novo caso compatível com seu perfil',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Olá, ${advogadoNome}!</h2>
        <p>Você tem um novo caso compatível com sua especialidade:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <strong>${casoTitulo}</strong>
        </div>
        <p>
          <a href="${matchUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver Detalhes do Caso
          </a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          LegalConnect - Conectando cidadãos e advogados
        </p>
      </div>
    `,
    text: `Olá, ${advogadoNome}! Você tem um novo caso compatível: ${casoTitulo}. Acesse: ${matchUrl}`,
  }),

  // Notificação de match aceito para cidadão
  matchAceito: (cidadaoNome: string, advogadoNome: string, chatUrl: string) => ({
    subject: 'Seu caso foi aceito por um advogado',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Ótimas notícias, ${cidadaoNome}!</h2>
        <p>O advogado <strong>${advogadoNome}</strong> aceitou seu caso e está pronto para ajudá-lo.</p>
        <p>
          <a href="${chatUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Iniciar Conversa
          </a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          LegalConnect - Conectando cidadãos e advogados
        </p>
      </div>
    `,
    text: `Ótimas notícias, ${cidadaoNome}! O advogado ${advogadoNome} aceitou seu caso. Inicie a conversa: ${chatUrl}`,
  }),

  // Nova mensagem no chat
  novaMensagem: (nomeDestinatario: string, nomeRemetente: string, chatUrl: string) => ({
    subject: `Nova mensagem de ${nomeRemetente}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Olá, ${nomeDestinatario}!</h2>
        <p>Você recebeu uma nova mensagem de <strong>${nomeRemetente}</strong>.</p>
        <p>
          <a href="${chatUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver Mensagem
          </a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          LegalConnect - Conectando cidadãos e advogados
        </p>
      </div>
    `,
    text: `Olá, ${nomeDestinatario}! Você recebeu uma nova mensagem de ${nomeRemetente}. Acesse: ${chatUrl}`,
  }),

  // Aprovação de advogado (admin)
  advogadoAprovado: (advogadoNome: string, dashboardUrl: string) => ({
    subject: 'Seu cadastro foi aprovado!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Parabéns, ${advogadoNome}!</h2>
        <p>Seu cadastro na LegalConnect foi aprovado. Você já pode começar a receber casos.</p>
        <p>
          <a href="${dashboardUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Acessar Dashboard
          </a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          LegalConnect - Conectando cidadãos e advogados
        </p>
      </div>
    `,
    text: `Parabéns, ${advogadoNome}! Seu cadastro foi aprovado. Acesse o dashboard: ${dashboardUrl}`,
  }),

  // Convite beta
  conviteBeta: (nome: string, codigo: string, signupUrl: string) => ({
    subject: 'Você foi convidado para o beta da LegalConnect',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Olá, ${nome}!</h2>
        <p>Você recebeu um convite exclusivo para participar do beta da LegalConnect.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #666;">Seu código de convite:</p>
          <strong style="font-size: 24px; letter-spacing: 2px;">${codigo}</strong>
        </div>
        <p>
          <a href="${signupUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Criar Conta
          </a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          LegalConnect - Conectando cidadãos e advogados
        </p>
      </div>
    `,
    text: `Olá, ${nome}! Você foi convidado para o beta da LegalConnect. Código: ${codigo}. Cadastre-se: ${signupUrl}`,
  }),
}
