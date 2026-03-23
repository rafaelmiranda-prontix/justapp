import { Resend } from 'resend'
import { logger } from './logger'

// Inicializa Resend apenas se a API key estiver configurada
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export class EmailService {
  /**
   * Envia email de ativação para novo usuário
   */
  static async sendActivationEmail(
    email: string,
    name: string,
    activationToken: string
  ): Promise<void> {
    const activationUrl = `${process.env.NEXTAUTH_URL}/auth/activate?token=${activationToken}`
    // Para advogados com prefixo (Dr./Dra.), pegar prefixo + primeiro nome
    // Caso contrário, pegar apenas o primeiro nome
    const nameParts = name.split(' ')
    const firstName = nameParts[0] === 'Dr.' || nameParts[0] === 'Dra.'
      ? `${nameParts[0]} ${nameParts[1] || ''}`.trim()
      : nameParts[0]

    // Verificar se Resend está configurado
    if (!resend) {
      logger.warn('[Email] Resend não configurado. Email de ativação não enviado.')
      logger.debug(`[Email] Link de ativação que seria enviado: [REDACTED]`)
      // Não lançar erro - apenas logar, pois o usuário foi criado com sucesso
      return
    }

    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'JustApp <noreply@justapp.com.br>',
        to: email,
        subject: 'Ative sua conta no JustApp',
        html: this.getActivationEmailTemplate(firstName, activationUrl),
      })

      if (result.error) {
        logger.error('[Email] Resend error:', result.error)
        throw new Error(result.error.message || 'Erro ao enviar email de ativação')
      }

      logger.info(`[Email] Activation email sent (ID: ${result.data?.id})`)
    } catch (error: any) {
      logger.error('[Email] Failed to send activation email:', error)
      // Não lançar erro - apenas logar, pois o usuário foi criado com sucesso
      logger.debug(`[Email] Link de ativação: [REDACTED]`)
    }
  }

  /**
   * Template HTML para email de ativação
   */
  private static getActivationEmailTemplate(name: string, activationUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ative sua conta - JustApp</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                JustApp
              </h1>
              <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">
                Sua conexão inteligente com advogados
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">
                Olá, ${name}! 👋
              </h2>

              <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                Obrigado por se cadastrar no <strong>JustApp</strong>!
              </p>

              <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                Para começar a usar a plataforma e encontrar os melhores advogados para seu caso, você precisa ativar sua conta clicando no botão abaixo:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${activationUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Ativar Minha Conta
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; margin: 24px 0 0 0; font-size: 14px; line-height: 1.6;">
                Ou copie e cole este link no seu navegador:
              </p>
              <p style="color: #3b82f6; margin: 8px 0 0 0; font-size: 14px; word-break: break-all;">
                ${activationUrl}
              </p>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #1e40af; margin: 0; font-size: 14px; line-height: 1.6;">
                      ⏰ <strong>Este link é válido por 48 horas.</strong><br>
                      Após esse período, você precisará solicitar um novo email de ativação.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; margin: 32px 0 0 0; font-size: 14px; line-height: 1.6;">
                Se você não se cadastrou no JustApp, ignore este email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 32px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">
                JustApp - Conexão Inteligente entre Pessoas e Advogados
              </p>
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} JustApp. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }

  /**
   * Envia email de boas-vindas após ativação
   */
  static async sendWelcomeEmail(email: string, name: string): Promise<void> {
    // Para advogados com prefixo (Dr./Dra.), pegar prefixo + primeiro nome
    // Caso contrário, pegar apenas o primeiro nome
    const nameParts = name.split(' ')
    const firstName = nameParts[0] === 'Dr.' || nameParts[0] === 'Dra.'
      ? `${nameParts[0]} ${nameParts[1] || ''}`.trim()
      : nameParts[0]
    const dashboardUrl = `${process.env.NEXTAUTH_URL}/cidadao/dashboard`

    // Verificar se Resend está configurado
    if (!resend) {
      logger.warn('[Email] Resend não configurado. Email de boas-vindas não enviado.')
      return
    }

    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'JustApp <noreply@justapp.com.br>',
        to: email,
        subject: 'Bem-vindo ao JustApp! 🎉',
        html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo - JustApp</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎉</h1>
              <h2 style="color: #ffffff; margin: 16px 0 0 0; font-size: 24px;">Conta Ativada!</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h3 style="color: #1f2937; margin: 0 0 16px 0;">Olá, ${firstName}!</h3>
              <p style="color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">
                Sua conta foi ativada com sucesso! Agora você pode acessar seu dashboard e acompanhar o progresso do seu caso.
              </p>
              <p style="color: #4b5563; margin: 0 0 32px 0; line-height: 1.6;">
                Seu caso já está sendo distribuído para advogados especializados na sua região. Em breve você receberá propostas!
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600;">
                      Acessar Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      })

      if (result.error) {
        logger.error('[Email] Resend error:', result.error)
        return
      }

      logger.info(`[Email] Welcome email sent (ID: ${result.data?.id})`)
    } catch (error: any) {
      logger.error('[Email] Failed to send welcome email:', error)
      // Não lançar erro pois email de boas-vindas não é crítico
    }
  }

  /**
   * Envia email de aprovação para advogado
   */
  static async sendApprovalEmail(email: string, name: string): Promise<void> {
    // Para advogados com prefixo (Dr./Dra.), pegar prefixo + primeiro nome
    // Caso contrário, pegar apenas o primeiro nome
    const nameParts = name.split(' ')
    const firstName = nameParts[0] === 'Dr.' || nameParts[0] === 'Dra.'
      ? `${nameParts[0]} ${nameParts[1] || ''}`.trim()
      : nameParts[0]
    const dashboardUrl = `${process.env.NEXTAUTH_URL}/advogado/dashboard`

    // Verificar se Resend está configurado
    if (!resend) {
      logger.warn('[Email] Resend não configurado. Email de aprovação não enviado.')
      return
    }

    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'JustApp <noreply@justapp.com.br>',
        to: email,
        subject: 'Sua conta foi aprovada! 🎉 - JustApp',
        html: this.getApprovalEmailTemplate(firstName, dashboardUrl),
      })

      if (result.error) {
        logger.error('[Email] Resend error:', result.error)
        return
      }

      logger.info(`[Email] Approval email sent (ID: ${result.data?.id})`)
    } catch (error: any) {
      logger.error('[Email] Failed to send approval email:', error)
      // Não lançar erro pois email de aprovação não deve impedir a aprovação
    }
  }

  /**
   * Template HTML para email de aprovação
   */
  private static getApprovalEmailTemplate(name: string, dashboardUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conta Aprovada - JustApp</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                ✅ Conta Aprovada!
              </h1>
              <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 16px;">
                Você já pode começar a receber leads
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">
                Olá, ${name}! 👋
              </h2>

              <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                Temos uma ótima notícia! Sua conta no <strong>JustApp</strong> foi aprovada pela nossa equipe.
              </p>

              <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                Agora você já pode começar a receber casos compatíveis com suas especialidades e localização. Os leads serão enviados automaticamente para seu dashboard.
              </p>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #065f46; margin: 0; font-size: 14px; line-height: 1.6;">
                      💡 <strong>Dica:</strong> Mantenha seu perfil atualizado e complete todas as informações para receber mais leads compatíveis com sua área de atuação.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Acessar Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; margin: 32px 0 0 0; font-size: 14px; line-height: 1.6;">
                Se você tiver alguma dúvida, nossa equipe está sempre pronta para ajudar.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 32px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">
                JustApp - Conexão Inteligente entre Pessoas e Advogados
              </p>
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} JustApp. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }

  private static escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  /**
   * Aviso manual (admin): nova mensagem no chat — prévia e remetente.
   */
  static async sendChatNewMessageNotification(params: {
    to: string
    recipientName: string
    senderName: string
    senderEmail: string
    messagePreview: string
    chatUrl: string
    testBanner?: boolean
  }): Promise<{ success: boolean; message?: string }> {
    const {
      to,
      recipientName,
      senderName,
      senderEmail,
      messagePreview,
      chatUrl,
      testBanner,
    } = params

    if (!resend) {
      logger.warn('[Email] Resend não configurado. Aviso de chat não enviado.')
      return { success: false, message: 'Resend não configurado (RESEND_API_KEY)' }
    }

    const safePreview = this.escapeHtml(messagePreview)
    const safeSender = this.escapeHtml(senderName)
    const safeEmail = this.escapeHtml(senderEmail)
    const safeRecipient = this.escapeHtml(recipientName)
    const banner = testBanner
      ? `<tr><td style="padding: 12px 16px; background: #fef3c7; border-left: 4px solid #f59e0b; font-size: 14px; color: #92400e;"><strong>Envio de teste</strong> — disparado pelo painel administrativo. O destinatário real não recebeu este e-mail.</td></tr>`
      : ''

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Nova mensagem no chat</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">Nova mensagem no chat</h1>
          <p style="color:#e0e7ff;margin:8px 0 0;font-size:14px;">JustApp</p>
        </td></tr>
        ${banner}
        <tr><td style="padding:28px;">
          <p style="color:#374151;margin:0 0 16px;font-size:16px;line-height:1.5;">Olá, <strong>${safeRecipient}</strong>,</p>
          <p style="color:#4b5563;margin:0 0 20px;font-size:15px;line-height:1.6;">Há uma nova mensagem na sua conversa.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb;">
            <tr><td style="padding:16px;">
              <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#6b7280;">Quem enviou</p>
              <p style="margin:0;font-size:15px;color:#111827;"><strong>${safeSender}</strong></p>
              <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${safeEmail}</p>
            </td></tr>
            <tr><td style="padding:0 16px 16px;">
              <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#6b7280;">Prévia</p>
              <p style="margin:0;font-size:14px;color:#374151;line-height:1.5;white-space:pre-wrap;">${safePreview}</p>
            </td></tr>
          </table>
          ${
            chatUrl
              ? `<p style="margin:24px 0 0;text-align:center;"><a href="${String(chatUrl).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px;font-weight:600;">Abrir conversa</a></p>`
              : ''
          }
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    const subject = testBanner
      ? '[TESTE] Nova mensagem no chat — JustApp'
      : 'Nova mensagem no chat — JustApp'

    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'JustApp <noreply@justapp.com.br>',
        to,
        subject,
        html,
      })

      if (result.error) {
        logger.error('[Email] Resend error (chat notify):', result.error)
        return { success: false, message: result.error.message || 'Erro ao enviar' }
      }

      logger.info(`[Email] Chat notify sent (ID: ${result.data?.id})`)
      return { success: true }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao enviar'
      logger.error('[Email] Failed to send chat notify:', error)
      return { success: false, message: msg }
    }
  }

  /**
   * E-mail de amostra (sem mensagem real) — validar Resend no admin.
   */
  static async sendChatNotifySampleTest(to: string): Promise<{ success: boolean; message?: string }> {
    if (!resend) {
      logger.warn('[Email] Resend não configurado.')
      return { success: false, message: 'Resend não configurado (RESEND_API_KEY)' }
    }

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Teste de e-mail</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:28px;">
        <tr><td>
          <p style="margin:0 0 12px;font-size:14px;color:#92400e;background:#fef3c7;padding:12px;border-radius:6px;"><strong>Amostra</strong> — Este e-mail foi enviado pelo painel <strong>Mensagens chat</strong> (teste geral, sem vínculo com uma mensagem específica).</p>
          <h1 style="color:#111827;font-size:20px;margin:0 0 12px;">Envio funcionando</h1>
          <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0;">Se você recebeu isto, a integração com o provedor de e-mail está ok.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'JustApp <noreply@justapp.com.br>',
        to,
        subject: '[TESTE] JustApp — amostra de aviso de chat',
        html,
      })

      if (result.error) {
        return { success: false, message: result.error.message || 'Erro ao enviar' }
      }
      return { success: true }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro ao enviar'
      return { success: false, message: msg }
    }
  }
}
