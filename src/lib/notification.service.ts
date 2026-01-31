import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { ConfigService } from '@/lib/config-service'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Serviço de Notificações
 * Gerencia envio de emails para diferentes eventos do sistema
 */
export class NotificationService {
  /**
   * Notifica advogado sobre novo match criado
   */
  static async notifyLawyerNewMatch(matchId: string): Promise<void> {
    const shouldNotify = await ConfigService.shouldNotifyMatchCreated()
    if (!shouldNotify) return

    const match = await prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        advogados: {
          include: {
            users: true,
          },
        },
        casos: {
          include: {
            cidadaos: {
              include: {
                users: true,
              },
            },
            especialidades: true,
          },
        },
      },
    })

    if (!match) return

    const advogado = match.advogados
    const caso = match.casos

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'LegalConnect <noreply@legalconnect.com>',
        to: advogado.users.email,
        subject: `Novo Caso: ${caso.especialidades?.nome || 'Consulta Jurídica'}`,
        html: this.getNewMatchEmailTemplate(match, advogado, caso),
      })

      logger.info(`[Notification] New match email sent`)
    } catch (error) {
      logger.error('[Notification] Failed to send new match email:', error)
      // Não lança erro - notificação não deve impedir o fluxo
    }
  }

  /**
   * Notifica cidadão que advogado aceitou o caso
   */
  static async notifyCitizenMatchAccepted(matchId: string): Promise<void> {
    const shouldNotify = await ConfigService.shouldNotifyMatchAccepted()
    if (!shouldNotify) return

    const match = await prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        advogados: {
          include: {
            users: true,
          },
        },
        casos: {
          include: {
            cidadaos: {
              include: {
                users: true,
              },
            },
          },
        },
      },
    })

    if (!match) return

    const cidadao = match.casos.cidadaos
    const advogado = match.advogados

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'LegalConnect <noreply@legalconnect.com>',
        to: cidadao.users.email,
        subject: 'Um advogado aceitou seu caso! 🎉',
        html: this.getMatchAcceptedEmailTemplate(match, cidadao, advogado),
      })

      logger.info(`[Notification] Match accepted email sent`)
    } catch (error) {
      logger.error('[Notification] Failed to send match accepted email:', error)
    }
  }

  /**
   * Lembra advogado que match está prestes a expirar
   */
  static async notifyLawyerMatchExpiring(matchId: string): Promise<void> {
    const match = await prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        advogado: {
          include: {
            user: true,
          },
        },
        caso: {
          include: {
            especialidade: true,
          },
        },
      },
    })

    if (!match || !match.expiresAt) return

    const hoursLeft = Math.round(
      (match.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    )

    if (hoursLeft <= 0) return

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'LegalConnect <noreply@legalconnect.com>',
        to: match.advogados.user.email,
        subject: `⏰ Caso expira em ${hoursLeft}h`,
        html: this.getMatchExpiringEmailTemplate(match, hoursLeft),
      })

      logger.info(`[Notification] Match expiring email sent`)
    } catch (error) {
      logger.error('[Notification] Failed to send match expiring email:', error)
    }
  }

  /**
   * Template de email para novo match
   */
  private static getNewMatchEmailTemplate(match: any, advogado: any, caso: any): string {
    const firstName = advogado.users.name.split(' ')[0]
    const matchUrl = `${process.env.NEXTAUTH_URL}/advogado/dashboard`
    const expiresDate = match.expiresAt
      ? new Date(match.expiresAt).toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        })
      : ''

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Caso Disponível</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                📋 Novo Caso Disponível
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">
                Olá, ${firstName}!
              </h2>

              <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                Um novo caso compatível com seu perfil está disponível:
              </p>

              <!-- Case Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%">
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">📂 Área:</strong>
                          <span style="color: #6b7280; margin-left: 8px;">${caso.especialidades?.nome || 'Não especificada'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">📍 Localização:</strong>
                          <span style="color: #6b7280; margin-left: 8px;">${caso.cidadaos.cidade || 'Não especificada'}, ${caso.cidadaos.estado || ''}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">⚡ Urgência:</strong>
                          <span style="color: #6b7280; margin-left: 8px;">${caso.urgencia}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">🎯 Compatibilidade:</strong>
                          <span style="color: #10b981; margin-left: 8px; font-weight: 600;">${match.score}%</span>
                        </td>
                      </tr>
                      ${match.distanciaKm ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #374151;">📏 Distância:</strong>
                          <span style="color: #6b7280; margin-left: 8px;">${match.distanciaKm} km</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Urgency Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                      ⏰ <strong>Você tem até ${expiresDate} para responder.</strong><br>
                      Após esse prazo, o caso pode ser oferecido a outros advogados.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${matchUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Ver Detalhes e Responder
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; text-align: center;">
                Acesse seu dashboard para ver todos os detalhes e decidir se deseja aceitar este caso.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                LegalConnect - Conexão Inteligente entre Pessoas e Advogados
              </p>
              <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 12px;">
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
   * Template de email quando advogado aceita
   */
  private static getMatchAcceptedEmailTemplate(
    match: any,
    cidadao: any,
    advogado: any
  ): string {
    const firstName = cidadao.users.name.split(' ')[0]
    const dashboardUrl = `${process.env.NEXTAUTH_URL}/cidadao/dashboard`

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Advogado Aceitou Seu Caso</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 36px;">🎉</h1>
              <h2 style="color: #ffffff; margin: 16px 0 0 0; font-size: 24px;">Ótimas Notícias!</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Olá, ${firstName}!</h3>
              <p style="color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">
                <strong>${advogado.users.name}</strong> aceitou seu caso e está pronto para ajudar!
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.6;">
                      💬 <strong>Próximo passo:</strong> Acesse seu dashboard para iniciar a conversa com o advogado.
                    </p>
                  </td>
                </tr>
              </table>

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
    `
  }

  /**
   * Template de email de expiração iminente
   */
  private static getMatchExpiringEmailTemplate(match: any, hoursLeft: number): string {
    const matchUrl = `${process.env.NEXTAUTH_URL}/advogado/dashboard`

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Caso Expirando</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h1 style="color: #f59e0b; font-size: 48px; margin: 0;">⏰</h1>
              <h2 style="color: #1f2937; margin: 16px 0; font-size: 24px;">Lembrete: Caso Expirando</h2>
              <p style="color: #4b5563; margin: 0 0 24px 0; line-height: 1.6;">
                Você tem apenas <strong style="color: #f59e0b;">${hoursLeft} hora${hoursLeft > 1 ? 's' : ''}</strong> para responder ao caso #${match.casoId.substring(0, 8)}.
              </p>
              <p style="color: #6b7280; margin: 0 0 32px 0; line-height: 1.6;">
                Após esse prazo, o caso poderá ser oferecido a outros advogados.
              </p>
              <a href="${matchUrl}" style="display: inline-block; background: #f59e0b; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600;">
                Responder Agora
              </a>
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
}
