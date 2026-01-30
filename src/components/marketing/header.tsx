'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Scale } from 'lucide-react'

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">LegalConnect</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="#funcionalidades"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Funcionalidades
              </Link>
              <Link
                href="#como-funciona"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Como Funciona
              </Link>
              <Link
                href="#precos"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Preços
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
