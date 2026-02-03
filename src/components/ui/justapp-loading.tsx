'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface JustAppLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  fullScreen?: boolean
}

const sizeMap = {
  sm: { icon: 32, text: 'text-sm' },
  md: { icon: 48, text: 'text-base' },
  lg: { icon: 64, text: 'text-lg' },
}

export function JustAppLoading({
  size = 'md',
  className,
  text,
  fullScreen = false,
}: JustAppLoadingProps) {
  const sizeConfig = sizeMap[size]

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen && 'min-h-screen',
        className
      )}
    >
      <div className="relative">
        <Image
          src="/logo-icon.svg"
          alt="JustApp"
          width={sizeConfig.icon}
          height={sizeConfig.icon}
          className="animate-pulse"
          priority
        />
        <div className="absolute inset-0 animate-spin">
          <div className="h-full w-full rounded-full border-4 border-transparent border-t-[#0066CC] border-r-[#00BFBF] opacity-30" />
        </div>
      </div>
      {text && (
        <p className={cn('text-muted-foreground animate-pulse', sizeConfig.text)}>{text}</p>
      )}
    </div>
  )

  return content
}
