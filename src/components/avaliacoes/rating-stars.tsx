'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  className,
}: RatingStarsProps) {
  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value)
    }
  }

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      // Pode adicionar hover effect aqui se necessário
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const value = i + 1
        const filled = value <= Math.round(rating)

        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            disabled={!interactive}
            className={cn(
              'transition-colors',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                filled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
              )}
            />
          </button>
        )
      })}
      {rating > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}
