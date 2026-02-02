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
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex h-16 items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-1">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <img src="/logo-icon.svg" alt="JustApp" className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
              <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-[#001F5C] via-[#0066CC] to-[#00BFBF] bg-clip-text text-transparent whitespace-nowrap">JustApp</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 ml-4">
              <Link
                href="#por-que-escolher"
                onClick={(e) => handleSmoothScroll(e, '#por-que-escolher')}
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
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0">
            <Button variant="ghost" size="sm" asChild className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap">
              <Link href="/auth/signin">Entrar</Link>
            </Button>
            <Button size="sm" asChild className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm whitespace-nowrap hidden sm:inline-flex">
              <Link href="/signup/cidadao">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
