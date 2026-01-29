'use client'

import { AlertCircle, X } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  title?: string
  message: string
  onDismiss?: () => void
  className?: string
  variant?: 'default' | 'destructive' | 'warning'
}

export function ErrorMessage({
  title,
  message,
  onDismiss,
  className,
  variant = 'destructive',
}: ErrorMessageProps) {
  const variants = {
    default: 'bg-muted text-muted-foreground',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        variants[variant],
        className
      )}
    >
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <p className="text-sm">{message}</p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="shrink-0 h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
