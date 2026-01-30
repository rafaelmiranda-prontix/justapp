import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LegalConnect - Plataforma Jurídica Inteligente | Encontre seu Advogado em Minutos',
  description:
    'Conectamos pessoas com problemas jurídicos a advogados especializados. Chat inteligente, conexão automática e 100% online. Comece agora!',
  openGraph: {
    title: 'LegalConnect - Plataforma Jurídica Inteligente',
    description:
      'Encontre o advogado ideal para seu caso em minutos. Plataforma inteligente que conecta você ao profissional certo.',
    type: 'website',
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
