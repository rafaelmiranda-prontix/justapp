'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Mail, Send, MessageSquare } from 'lucide-react'

const ASSUNTOS = [
  'Dúvida geral',
  'Problema técnico',
  'Cadastro ou aprovação',
  'Planos e assinatura',
  'Outro',
]

const TIPOS = [
  { value: 'advogado', label: 'Advogado' },
  { value: 'cidadao', label: 'Cidadão' },
  { value: 'outro', label: 'Outro' },
]

/** Máscara celular: (XX) XXXXX-XXXX (até 11 dígitos) */
function maskCelular(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/** Máscara e-mail: permite apenas caracteres válidos (letras, números, @ . _ + -) */
function maskEmail(value: string): string {
  return value.replace(/[^a-zA-Z0-9@._+-]/g, '')
}

export default function ContatoPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [assunto, setAssunto] = useState('')
  const [tipo, setTipo] = useState<string>('')
  const [mensagem, setMensagem] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL
  const supportWhatsApp = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP
  const whatsAppLink = supportWhatsApp
    ? `https://wa.me/${String(supportWhatsApp).replace(/\D/g, '')}`
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')
    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          whatsapp: whatsapp.trim() || undefined,
          assunto,
          mensagem,
          tipo: tipo || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error || 'Erro ao enviar. Tente novamente.')
        setStatus('error')
        return
      }
      setStatus('success')
      setNome('')
      setEmail('')
      setWhatsapp('')
      setAssunto('')
      setTipo('')
      setMensagem('')
    } catch {
      setErrorMessage('Erro de conexão. Tente novamente.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo-icon.svg" alt="JustApp" className="h-6 w-6" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#001F5C] via-[#0066CC] to-[#00BFBF] bg-clip-text text-transparent">
                JustApp
              </span>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <MessageSquare className="h-7 w-7" />
              Contato
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Envie sua dúvida, sugestão ou relato de problema. Responderemos o mais breve possível.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {(supportEmail || whatsAppLink) && (
              <div className="flex flex-wrap gap-2">
                {supportEmail && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${supportEmail}`}>
                      <Mail className="h-4 w-4 mr-1" />
                      E-mail
                    </a>
                  </Button>
                )}
                {whatsAppLink && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={whatsAppLink} target="_blank" rel="noopener noreferrer">
                      Fale no WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  required
                  maxLength={200}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(maskEmail(e.target.value))}
                  placeholder="seu@email.com"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(maskCelular(e.target.value))}
                  placeholder="(11) 99999-9999"
                  maxLength={18}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="assunto">Assunto *</Label>
                <Select value={assunto} onValueChange={setAssunto} required>
                  <SelectTrigger id="assunto" className="mt-1">
                    <SelectValue placeholder="Selecione o assunto" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSUNTOS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tipo">Sou</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger id="tipo" className="mt-1">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mensagem">Mensagem *</Label>
                <Textarea
                  id="mensagem"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  placeholder="Descreva sua dúvida ou problema..."
                  required
                  rows={5}
                  maxLength={2000}
                  className="mt-1"
                />
              </div>
              {status === 'success' && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Mensagem enviada com sucesso. Obrigado pelo contato!
                </p>
              )}
              {status === 'error' && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}
              <Button type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? (
                  'Enviando...'
                ) : (
                  <>
                <Send className="h-4 w-4 mr-2" />
                Enviar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
