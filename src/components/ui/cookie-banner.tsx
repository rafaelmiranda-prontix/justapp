'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Cookie, Shield, Settings, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const COOKIE_CONSENT_KEY = 'justapp-cookie-consent'

interface CookiePreferences {
  essenciais: boolean
  analiticos: boolean
  marketing: boolean
}

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essenciais: true, // Sempre ativo (não pode ser desabilitado)
    analiticos: false,
    marketing: false,
  })

  useEffect(() => {
    // Verifica se o usuário já aceitou os cookies
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Pequeno delay para animação suave
      setTimeout(() => {
        setIsVisible(true)
        setIsAnimating(true)
      }, 1000)
    }
  }, [])

  const handleAccept = () => {
    const allAccepted: CookiePreferences = {
      essenciais: true,
      analiticos: true,
      marketing: true,
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(allAccepted))
    setIsAnimating(false)
    setTimeout(() => setIsVisible(false), 300)
  }

  const handleReject = () => {
    const onlyEssentials: CookiePreferences = {
      essenciais: true,
      analiticos: false,
      marketing: false,
    }
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(onlyEssentials))
    setIsAnimating(false)
    setTimeout(() => setIsVisible(false), 300)
  }

  const handleCustomize = () => {
    setIsCustomizeOpen(true)
  }

  const handleSavePreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences))
    setIsCustomizeOpen(false)
    setIsAnimating(false)
    setTimeout(() => setIsVisible(false), 300)
  }

  const handleTogglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essenciais') return // Não pode desabilitar essenciais
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (!isVisible) return null

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-300 ${
        isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <Card className="mx-auto max-w-4xl border-2 shadow-2xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Ícone e conteúdo */}
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-full bg-primary/10 shrink-0">
                <Cookie className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">Utilizamos cookies</h3>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Utilizamos cookies para melhorar sua experiência, analisar o tráfego do site e personalizar conteúdo.
                  Ao continuar navegando, você concorda com nossa{' '}
                  <Link
                    href="/privacidade"
                    className="text-primary hover:underline font-medium"
                  >
                    Política de Privacidade
                  </Link>
                  {' '}e{' '}
                  <Link
                    href="/termos"
                    className="text-primary hover:underline font-medium"
                  >
                    Termos de Uso
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomize}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Personalizar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReject}
                className="text-muted-foreground"
              >
                Recusar
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                className="gap-2 bg-gradient-to-r from-[#001F5C] via-[#0066CC] to-[#00BFBF] hover:opacity-90"
              >
                Aceitar todos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Personalização */}
      <Sheet open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Personalizar Cookies
            </SheetTitle>
            <SheetDescription>
              Escolha quais tipos de cookies você deseja aceitar. Cookies essenciais são necessários
              para o funcionamento do site e não podem ser desativados.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Cookies Essenciais */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor="essenciais" className="text-base font-semibold cursor-pointer">
                      Cookies Essenciais
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      Obrigatório
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Essenciais para o funcionamento do site. Incluem autenticação, segurança e
                    preferências básicas.
                  </p>
                </div>
                <Checkbox
                  id="essenciais"
                  checked={preferences.essenciais}
                  disabled
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Cookies Analíticos */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor="analiticos" className="text-base font-semibold cursor-pointer">
                      Cookies Analíticos
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nos ajudam a entender como os visitantes interagem com o site, coletando
                    informações de forma anônima.
                  </p>
                  <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>Usamos ferramentas como Google Analytics para melhorar nossos serviços.</span>
                  </div>
                </div>
                <Checkbox
                  id="analiticos"
                  checked={preferences.analiticos}
                  onCheckedChange={() => handleTogglePreference('analiticos')}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Cookies de Marketing */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor="marketing" className="text-base font-semibold cursor-pointer">
                      Cookies de Marketing
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Usados para personalizar anúncios e medir a eficácia de campanhas publicitárias.
                  </p>
                  <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>
                      Permitem que mostremos conteúdo relevante baseado em seus interesses.
                    </span>
                  </div>
                </div>
                <Checkbox
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={() => handleTogglePreference('marketing')}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Links */}
            <div className="text-sm text-muted-foreground">
              Para mais informações, consulte nossa{' '}
              <Link href="/privacidade" className="text-primary hover:underline font-medium">
                Política de Privacidade
              </Link>{' '}
              e nossos{' '}
              <Link href="/termos" className="text-primary hover:underline font-medium">
                Termos de Uso
              </Link>
              .
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsCustomizeOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePreferences}
              className="bg-gradient-to-r from-[#001F5C] via-[#0066CC] to-[#00BFBF] hover:opacity-90"
            >
              Salvar Preferências
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
