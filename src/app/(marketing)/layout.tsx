import { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'JustApp - Plataforma Jurídica Inteligente | Encontre seu Advogado em Minutos',
  description:
    'Conectamos pessoas com problemas jurídicos a advogados especializados. Chat inteligente, conexão automática e 100% online. Comece agora!',
  openGraph: {
    title: 'JustApp - Plataforma Jurídica Inteligente',
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
  return (
    <>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1518135456295859"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      {children}
    </>
  )
}
