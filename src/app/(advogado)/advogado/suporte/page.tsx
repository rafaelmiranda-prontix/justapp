'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, MessageCircle, FileText, HelpCircle } from 'lucide-react'

export default function AdvogadoSuportePage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL
  const supportWhatsApp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP
  const whatsAppLink = supportWhatsApp
    ? `https://wa.me/${String(supportWhatsApp).replace(/\D/g, '')}`
    : null

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-muted-foreground">
          Reporte problemas com a plataforma ou envie dúvidas. Escolha o canal de sua preferência.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Canais de contato
          </CardTitle>
          <CardDescription>
            Dúvidas sobre cadastro, aprovação, planos ou problemas técnicos podem ser enviadas por e-mail, WhatsApp ou pelo formulário no site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {whatsAppLink && (
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={whatsAppLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar mensagem via WhatsApp
              </a>
            </Button>
          )}
          {supportEmail && (
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={`mailto:${supportEmail}`}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar por e-mail
              </a>
            </Button>
          )}
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/contato">
              <FileText className="h-4 w-4 mr-2" />
              Formulário de contato no site
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
