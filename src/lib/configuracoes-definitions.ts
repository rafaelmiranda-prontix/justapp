import type { ConfiguracaoTipo } from '@prisma/client'

/** Chaves que podem aparecer no admin e serem criadas no primeiro salvamento. */
export const CONFIGURACOES_DEFINIDAS: Record<
  string,
  {
    tipo: ConfiguracaoTipo
    valorPadrao: string
    descricao: string
    categoria: string
  }
> = {
  audiencias_diligencias_enabled: {
    tipo: 'BOOLEAN',
    valorPadrao: 'false',
    descricao:
      'Ativar módulo Audiências e diligências para advogados (menu, páginas e APIs). O painel administrativo permanece disponível.',
    categoria: 'funcionalidades',
  },
}

export function getDefinicaoConfiguracao(chave: string) {
  return CONFIGURACOES_DEFINIDAS[chave]
}
