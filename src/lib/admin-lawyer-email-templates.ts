/**
 * Templates manuais disparados pelo admin para advogados.
 * Manter em sync com validação na API de envio.
 */
export const LAWYER_EMAIL_TEMPLATE_TYPES = [
  'validacao_dados',
  'convite_beta_pre_aprovado',
  'desculpas_demora',
] as const

export type LawyerEmailTemplateType = (typeof LAWYER_EMAIL_TEMPLATE_TYPES)[number]

export function isLawyerEmailTemplateType(v: string): v is LawyerEmailTemplateType {
  return (LAWYER_EMAIL_TEMPLATE_TYPES as readonly string[]).includes(v)
}

export const LAWYER_EMAIL_TEMPLATE_META: Record<
  LawyerEmailTemplateType,
  { label: string; description: string; subject: string; previewBody: string }
> = {
  validacao_dados: {
    label: 'Validar dados do cadastro',
    description:
      'Mensagem genérica pedindo que o advogado revise e confirme os dados informados no cadastro.',
    subject: 'JustApp — Confira os dados do seu cadastro',
    previewBody:
      'Saudação personalizada.\n\nPedimos que revise se os dados do perfil estão corretos (OAB, localização, especialidades etc.) e orientamos a acessar o perfil na plataforma para ajustes, se necessário.\n\nInclui botão/link para a página do perfil do advogado.',
  },
  convite_beta_pre_aprovado: {
    label: 'Convite para o teste Beta',
    description:
      'Para advogados pré-aprovados: convite para participar do Beta, com links de privacidade, termos e página em-teste; botões para aceitar ou recusar.',
    subject: 'JustApp — Você foi selecionado para o Beta',
    previewBody:
      'Comunica que o advogado foi selecionado para o programa Beta.\n\nLinks para: Política de Privacidade, Termos de Uso e página “Em teste”.\n\nDois botões: “Sim, quero participar” e “Não quero participar” (cada um com link seguro de uso único, válido por 7 dias).',
  },
  desculpas_demora: {
    label: 'Pedido de desculpas (demora)',
    description:
      'Mensagem de desculpas pela demora no retorno devido ao alto volume de cadastros.',
    subject: 'JustApp — Pedimos desculpas pela demora',
    previewBody:
      'Pedido de desculpas pela demora no retorno, explicando alto volume de cadastros e agradecendo a paciência.',
  },
}
