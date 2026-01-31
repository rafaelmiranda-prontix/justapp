'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, X } from 'lucide-react'

interface GeolocationModalProps {
  open: boolean
  onClose: () => void
  onAllow: () => void
  onDeny: () => void
}

export function GeolocationModal({ open, onClose, onAllow, onDeny }: GeolocationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl leading-tight">
                Localização para melhor atendimento
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base pt-2 leading-relaxed">
                Para conectá-lo aos <strong>advogados mais próximos</strong> da sua região, 
                precisamos da sua permissão para acessar sua localização.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Navigation className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Por que precisamos da sua localização?
              </p>
              <ul className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Encontrar advogados próximos a você</li>
                <li>Agilizar o atendimento presencial</li>
                <li>Melhorar a qualidade do match</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-xs text-muted-foreground leading-relaxed">
              🔒 Sua localização será usada <strong>apenas</strong> para encontrar advogados 
              compatíveis. Não compartilhamos seus dados com terceiros.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onDeny}
            className="w-full sm:flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Prefiro informar manualmente
          </Button>
          <Button
            onClick={onAllow}
            className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Permitir localização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
