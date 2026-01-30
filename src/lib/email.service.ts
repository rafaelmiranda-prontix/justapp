import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    const firstName = name.split(' ')[0]

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'LegalConnect <noreply@legalconnect.com>',
        to: email,
        subject: 'Ative sua conta no LegalConnect',
        html: this.getActivationEmailTemplate(firstName, activationUrl),
      })

      console.log(`[Email] Activation email sent to: ${email}`)
    } catch (error) {
      console.error('[Email] Failed to send activation email:', error)
      throw new Error('Erro ao enviar email de ativação')
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
  <title>Ative sua conta - LegalConnect</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                LegalConnect
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
                Obrigado por se cadastrar no <strong>LegalConnect</strong>!
              </p>

              <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                Para começar a usar a plataforma e encontrar os melhores advogados para seu caso, você precisa ativar sua conta clicando no botão abaixo:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${activationUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
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
                Se você não se cadastrou no LegalConnect, ignore este email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 32px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">
                LegalConnect - Conexão Inteligente entre Pessoas e Advogados
              </p>
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} LegalConnect. Todos os direitos reservados.
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
    const firstName = name.split(' ')[0]
    const dashboardUrl = `${process.env.NEXTAUTH_URL}/cidadao/dashboard`

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'LegalConnect <noreply@legalconnect.com>',
        to: email,
        subject: 'Bem-vindo ao LegalConnect! 🎉',
        html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo - LegalConnect</title>
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
                    <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600;">
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

      console.log(`[Email] Welcome email sent to: ${email}`)
    } catch (error) {
      console.error('[Email] Failed to send welcome email:', error)
      // Não lançar erro pois email de boas-vindas não é crítico
    }
  }
}
