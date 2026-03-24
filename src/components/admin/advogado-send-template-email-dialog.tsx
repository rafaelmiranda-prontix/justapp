'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Loader2, FlaskConical } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  LAWYER_EMAIL_TEMPLATE_TYPES,
  LAWYER_EMAIL_TEMPLATE_META,
  type LawyerEmailTemplateType,
} from '@/lib/admin-lawyer-email-templates'
import { isReasonableEmail } from '@/lib/email-utils'

export type AdvogadoSendTemplateEmailDialogProps = {
  advogadoId: string
  recipientEmail: string
  preAprovado: boolean
  aprovado: boolean
  /** Se omitido, usa botão padrão “Enviar e-mail”. */
  trigger?: ReactNode
}

export function AdvogadoSendTemplateEmailDialog({
  advogadoId,
  recipientEmail,
  preAprovado,
  aprovado,
  trigger,
}: AdvogadoSendTemplateEmailDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [template, setTemplate] = useState<LawyerEmailTemplateType>('validacao_dados')
  const [sending, setSending] = useState(false)
  const [testEmailInput, setTestEmailInput] = useState('')

  const meta = LAWYER_EMAIL_TEMPLATE_META[template]
  const betaBlocked =
    template === 'convite_beta_pre_aprovado' && (!preAprovado || aprovado)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setTestEmailInput('')
  }

  const send = async (testEmail: string | null) => {
    if (betaBlocked) return
    if (testEmail && !isReasonableEmail(testEmail)) {
      toast({
        title: 'E-mail inválido',
        description: 'Informe um endereço de e-mail válido para o envio de teste.',
        variant: 'destructive',
      })
      return
    }
    setSending(true)
    try {
      const res = await fetch(
        `/api/admin/advogados/${advogadoId}/send-template-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateType: template,
            ...(testEmail ? { testEmail } : {}),
          }),
        }
      )
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao enviar')
      }
      const toLabel = testEmail ?? recipientEmail
      toast({
        title: testEmail ? 'E-mail de teste enviado' : 'E-mail enviado',
        description: `Template “${meta.label}” enviado para ${toLabel}.`,
      })
      setOpen(false)
    } catch (e) {
      toast({
        title: 'Erro ao enviar',
        description: e instanceof Error ? e.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            Enviar e-mail
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar e-mail ao advogado</DialogTitle>
          <DialogDescription className="text-left space-y-1">
            <span>
              Envio real:{' '}
              <strong className="text-foreground">{recipientEmail}</strong>
            </span>
            <span className="block text-xs text-muted-foreground">
              A personalização do texto usa o nome do advogado deste cadastro.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email-test-to">E-mail para teste (opcional)</Label>
            <Input
              id="admin-email-test-to"
              type="email"
              autoComplete="email"
              placeholder="ex.: seu-email@gmail.com"
              value={testEmailInput}
              onChange={(e) => setTestEmailInput(e.target.value)}
              disabled={sending}
            />
            <p className="text-xs text-muted-foreground">
              Use &quot;Enviar teste&quot; para receber uma cópia em outro endereço. Assunto
              virá com o prefixo <strong>[TESTE]</strong>.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Template</p>
            <Select
              value={template}
              onValueChange={(v) => setTemplate(v as LawyerEmailTemplateType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAWYER_EMAIL_TEMPLATE_TYPES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {LAWYER_EMAIL_TEMPLATE_META[key].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {betaBlocked && (
            <Alert variant="destructive">
              <AlertDescription>
                O convite Beta só pode ser enviado para advogados{' '}
                <strong>pré-aprovados</strong> e ainda <strong>não aprovados</strong>.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <p className="text-sm font-medium mb-1">Assunto</p>
            <p className="text-sm text-muted-foreground">{meta.subject}</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-1">Resumo</p>
            <p className="text-sm text-muted-foreground">{meta.description}</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Prévia do conteúdo</p>
            <ScrollArea className="h-36 rounded-md border p-3">
              <pre className="text-xs whitespace-pre-wrap font-sans text-muted-foreground">
                {meta.previewBody}
              </pre>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            disabled={
              sending ||
              betaBlocked ||
              !testEmailInput.trim()
            }
            onClick={() => send(testEmailInput.trim())}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <FlaskConical className="h-4 w-4 mr-2" />
                Enviar teste
              </>
            )}
          </Button>
          <Button disabled={sending || betaBlocked} onClick={() => send(null)}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando…
              </>
            ) : (
              'Enviar ao advogado'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
