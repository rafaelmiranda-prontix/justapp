import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { ErrorBoundary } from '@/components/ui/error-boundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'JustApp - Conecte-se ao advogado ideal',
    template: '%s | JustApp',
  },
  description:
    'Plataforma que conecta pessoas com problemas jurídicos a advogados especializados. Encontre o advogado ideal para o seu caso.',
  keywords: [
    'advogado',
    'jurídico',
    'direito',
    'consulta jurídica',
    'advogado online',
    'advogado Brasil',
  ],
  authors: [{ name: 'JustApp' }],
  creator: 'JustApp',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://justapp.com.br',
    siteName: 'JustApp',
    title: 'JustApp - Conecte-se ao advogado ideal',
    description:
      'Plataforma que conecta pessoas com problemas jurídicos a advogados especializados',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JustApp - Conecte-se ao advogado ideal',
    description:
      'Plataforma que conecta pessoas com problemas jurídicos a advogados especializados',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo-icon.svg" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
