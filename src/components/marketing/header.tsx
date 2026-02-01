'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Scale } from 'lucide-react'

export function MarketingHeader() {
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Se for um link de âncora (começa com #)
    if (href.startsWith('#')) {
      e.preventDefault()
      const elementId = href.substring(1)
      const element = document.getElementById(elementId)
      
      if (element) {
        // Calcula a posição considerando o header sticky (64px de altura)
        const headerOffset = 80
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        })
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo-icon.svg" alt="JustApp" className="h-6 w-6" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#001F5C] via-[#0066CC] to-[#00BFBF] bg-clip-text text-transparent">JustApp</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="#solucao"
                onClick={(e) => handleSmoothScroll(e, '#solucao')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Funcionalidades
              </Link>
              <Link
                href="#como-funciona"
                onClick={(e) => handleSmoothScroll(e, '#como-funciona')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Como Funciona
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/signin">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup/cidadao">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
