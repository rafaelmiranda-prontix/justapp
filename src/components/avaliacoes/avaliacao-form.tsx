'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RatingStars } from './rating-stars'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const avaliacaoSchema = z.object({
  nota: z.number().min(1).max(5),
  comentario: z.string().max(500, 'Comentário muito longo').optional(),
})

type AvaliacaoFormData = z.infer<typeof avaliacaoSchema>

interface AvaliacaoFormProps {
  advogadoId: string
  matchId?: string
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AvaliacaoForm({
  advogadoId,
  matchId,
  onSuccess,
  open = false,
  onOpenChange,
}: AvaliacaoFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<AvaliacaoFormData>({
    resolver: zodResolver(avaliacaoSchema),
    defaultValues: {
      nota: 0,
      comentario: '',
    },
  })

  const onSubmit = async (data: AvaliacaoFormData) => {
    if (selectedRating === 0) {
      toast({
        title: 'Avaliação incompleta',
        description: 'Por favor, selecione uma nota de 1 a 5 estrelas',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advogadoId,
          matchId,
          nota: selectedRating,
          comentario: data.comentario || undefined,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Erro ao criar avaliação')
      }

      toast({
        title: 'Avaliação enviada!',
        description: 'Obrigado por avaliar este advogado',
      })

      reset()
      setSelectedRating(0)
      onSuccess?.()
      onOpenChange?.(false)
    } catch (error) {
      toast({
        title: 'Erro ao criar avaliação',
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRatingChange = (rating: number) => {
    setSelectedRating(rating)
    setValue('nota', rating, { shouldValidate: true })
  }

  const content = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Como você avalia este advogado?</Label>
        <div className="flex items-center gap-4">
          <RatingStars
            rating={selectedRating}
            interactive
            onRatingChange={handleRatingChange}
            size="lg"
          />
          {selectedRating > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedRating} de 5 estrelas
            </span>
          )}
        </div>
        {errors.nota && (
          <p className="text-sm text-destructive">{errors.nota.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="comentario">
          Comentário (opcional)
        </Label>
        <Textarea
          id="comentario"
          placeholder="Conte sua experiência com este advogado..."
          {...register('comentario')}
          disabled={isLoading}
          rows={4}
          maxLength={500}
        />
        {errors.comentario && (
          <p className="text-sm text-destructive">{errors.comentario.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Máximo de 500 caracteres
        </p>
      </div>

      <div className="flex gap-2 justify-end">
        {onOpenChange && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading || selectedRating === 0}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar Avaliação
        </Button>
      </div>
    </form>
  )

  if (onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar Advogado</DialogTitle>
            <DialogDescription>
              Sua opinião é muito importante para nós e para outros usuários
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return <div className="space-y-6">{content}</div>
}
