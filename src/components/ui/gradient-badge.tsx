import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const gradientBadgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white transition-all',
  {
    variants: {
      variant: {
        primary: 'gradient-primary shadow-sm',
        accent: 'gradient-accent shadow-sm',
        success: 'gradient-success shadow-sm',
        gradient: 'bg-gradient-animated shadow-sm',
      },
      size: {
        default: 'px-3 py-1 text-xs',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-4 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface GradientBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gradientBadgeVariants> {}

function GradientBadge({ className, variant, size, ...props }: GradientBadgeProps) {
  return <div className={cn(gradientBadgeVariants({ variant, size }), className)} {...props} />
}

export { GradientBadge, gradientBadgeVariants }
