'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, MessageSquare } from 'lucide-react'
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

const feedbackSchema = z.object({
  tipo: z.enum(['BUG', 'MELHORIA', 'SUGESTAO', 'OUTRO']),
  categoria: z.enum(['USABILIDADE', 'FUNCIONALIDADE', 'DESIGN', 'PERFORMANCE', 'OUTRO']),
  titulo: z.string().min(5, 'Título deve ter no mínimo 5 caracteres').max(100),
  descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres').max(1000),
  url: z.string().url('URL inválida').optional().or(z.literal('')),
  prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA']).optional(),
})

type FeedbackFormData = z.infer<typeof feedbackSchema>

interface FeedbackDialogProps {
  trigger?: React.ReactNode
}

export function FeedbackDialog({ trigger }: FeedbackDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      tipo: 'SUGESTAO',
      categoria: 'FUNCIONALIDADE',
      prioridade: 'MEDIA',
    },
  })

  const onSubmit = async (data: FeedbackFormData) => {
    setIsLoading(true)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Erro ao enviar feedback')
      }

      trackEvent(AnalyticsEvents.BUTTON_CLICKED, {
        action: 'feedback_submitted',
        tipo: data.tipo,
      })

      toast({
        title: 'Feedback enviado!',
        description: 'Obrigado pela sua contribuição. Vamos analisar seu feedback.',
      })

      reset()
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao enviar feedback',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Enviar Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
          <DialogDescription>
            Sua opinião é muito importante para melhorarmos a plataforma
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={watch('tipo')}
                onValueChange={(value) => setValue('tipo', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUG">Bug</SelectItem>
                  <SelectItem value="MELHORIA">Melhoria</SelectItem>
                  <SelectItem value="SUGESTAO">Sugestão</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo && (
                <p className="text-sm text-destructive mt-1">{errors.tipo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={watch('categoria')}
                onValueChange={(value) => setValue('categoria', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USABILIDADE">Usabilidade</SelectItem>
                  <SelectItem value="FUNCIONALIDADE">Funcionalidade</SelectItem>
                  <SelectItem value="DESIGN">Design</SelectItem>
                  <SelectItem value="PERFORMANCE">Performance</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
              {errors.categoria && (
                <p className="text-sm text-destructive mt-1">{errors.categoria.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              placeholder="Resumo do feedback..."
              {...register('titulo')}
            />
            {errors.titulo && (
              <p className="text-sm text-destructive mt-1">{errors.titulo.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva seu feedback em detalhes..."
              rows={6}
              {...register('descricao')}
            />
            {errors.descricao && (
              <p className="text-sm text-destructive mt-1">{errors.descricao.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="url">URL (opcional)</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                {...register('url')}
              />
              {errors.url && (
                <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select
                value={watch('prioridade')}
                onValueChange={(value) => setValue('prioridade', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                  <SelectItem value="MEDIA">Média</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Feedback
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
