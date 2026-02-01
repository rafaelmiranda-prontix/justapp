import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const statusPillVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
  {
    variants: {
      variant: {
        pending: 'bg-warning/10 text-warning border border-warning/20',
        active: 'bg-success/10 text-success border border-success/20',
        accepted: 'bg-primary/10 text-primary border border-primary/20',
        rejected: 'bg-destructive/10 text-destructive border border-destructive/20',
        completed: 'bg-info/10 text-info border border-info/20',
        default: 'bg-secondary text-secondary-foreground border border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusPillVariants> {
  showDot?: boolean
}

function StatusPill({ className, variant, showDot = true, children, ...props }: StatusPillProps) {
  return (
    <div className={cn(statusPillVariants({ variant }), className)} {...props}>
      {showDot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </div>
  )
}

export { StatusPill, statusPillVariants }
