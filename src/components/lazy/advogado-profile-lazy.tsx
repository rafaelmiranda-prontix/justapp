'use client'

import dynamic from 'next/dynamic'

export const AdvogadoProfileLazy = dynamic(
  () => import('@/components/advogado/advogado-profile').then((mod) => ({ default: mod.AdvogadoProfile })),
  {
    loading: () => <div className="animate-pulse h-[400px] bg-muted rounded-lg" />,
    ssr: true,
  }
)

export const AdvogadoAvaliacoesLazy = dynamic(
  () => import('@/components/advogado/advogado-avaliacoes').then((mod) => ({ default: mod.AdvogadoAvaliacoes })),
  {
    loading: () => <div className="animate-pulse h-[300px] bg-muted rounded-lg" />,
    ssr: true,
  }
)
