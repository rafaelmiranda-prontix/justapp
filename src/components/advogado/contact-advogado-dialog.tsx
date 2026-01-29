'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MessageSquare, Loader2 } from 'lucide-react'
import { useContactAdvogado } from '@/hooks/use-contact-advogado'

interface ContactAdvogadoDialogProps {
  advogadoId: string
  advogadoNome: string
  casoId?: string
  trigger?: React.ReactNode
}

export function ContactAdvogadoDialog({
  advogadoId,
  advogadoNome,
  casoId,
  trigger,
}: ContactAdvogadoDialogProps) {
  const [open, setOpen] = useState(false)
  const { contactAdvogado, isLoading } = useContactAdvogado()

  const handleContact = async () => {
    if (!casoId) {
      // Se não há caso ativo, redireciona para criar um caso
      window.location.href = '/novo-caso'
      return
    }

    const result = await contactAdvogado({ advogadoId, casoId })

    if (result.success) {
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contatar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contatar Advogado</DialogTitle>
          <DialogDescription>
            {casoId ? (
              <>
                Deseja enviar uma solicitação de contato para <strong>{advogadoNome}</strong>?
                O advogado receberá os detalhes do seu caso e poderá aceitar ou recusar o atendimento.
              </>
            ) : (
              <>
                Para contatar <strong>{advogadoNome}</strong>, você precisa primeiro descrever seu caso.
                Clique em continuar para iniciar o processo.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button onClick={handleContact} disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>{casoId ? 'Enviar Solicitação' : 'Criar Caso'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
