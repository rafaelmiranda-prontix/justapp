'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, User, Phone, CheckCircle2 } from 'lucide-react'

interface LeadCaptureFormProps {
  onSubmit: (data: { name: string; email: string; phone?: string }) => Promise<void>
  extractedData?: {
    especialidade?: string
    cidade?: string
    estado?: string
    score?: number
  }
}

export function LeadCaptureForm({ onSubmit, extractedData }: LeadCaptureFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validações
    if (!name.trim() || name.trim().split(' ').length < 2) {
      setError('Por favor, informe seu nome completo')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, informe um email válido')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
      })
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar dados. Tente novamente.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Pronto para encontrar seu advogado!
        </h3>

        {extractedData && (
          <div className="text-sm space-y-1">
            {extractedData.especialidade && (
              <p className="text-muted-foreground">
                📋 <strong>Área:</strong> {extractedData.especialidade}
              </p>
            )}
            {extractedData.cidade && extractedData.estado && (
              <p className="text-muted-foreground">
                📍 <strong>Localização:</strong> {extractedData.cidade}, {extractedData.estado}
              </p>
            )}
            {extractedData.score && extractedData.score >= 70 && (
              <p className="text-green-600 dark:text-green-400 font-medium">
                ✅ Seu caso tem boa viabilidade ({extractedData.score} pontos)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Nome Completo *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Ex: João da Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
            className="bg-white dark:bg-gray-900"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
            className="bg-white dark:bg-gray-900"
          />
          <p className="text-xs text-muted-foreground">
            Enviaremos um link de ativação para este email
          </p>
        </div>

        {/* Telefone (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telefone (opcional)
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(21) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSubmitting}
            className="bg-white dark:bg-gray-900"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Enviar meu caso para advogados
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Ao enviar, você concorda com nossos termos de uso
        </p>
      </form>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs text-center">
        <div>
          <div className="font-semibold">100% Grátis</div>
          <div className="text-muted-foreground">Para você</div>
        </div>
        <div>
          <div className="font-semibold">Até 5 Advogados</div>
          <div className="text-muted-foreground">Qualificados</div>
        </div>
        <div>
          <div className="font-semibold">Você Escolhe</div>
          <div className="text-muted-foreground">Qual contratar</div>
        </div>
      </div>
    </div>
  )
}
