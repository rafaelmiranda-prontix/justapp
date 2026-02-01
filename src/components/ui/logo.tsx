'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'default' | 'horizontal' | 'icon' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  href?: string
}

const sizeMap = {
  sm: { icon: 16, text: 'text-sm' },
  md: { icon: 24, text: 'text-lg' },
  lg: { icon: 32, text: 'text-2xl' },
}

const variantMap = {
  default: '/logo.svg',
  horizontal: '/logo-horizontal.svg',
  icon: '/logo-icon.svg',
  dark: '/logo-dark.svg',
}

export function Logo({
  variant = 'default',
  size = 'md',
  showText = true,
  className,
  href = '/',
}: LogoProps) {
  const sizeConfig = sizeMap[size]
  const logoSrc = variantMap[variant]

  const logoContent = (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src={logoSrc}
        alt="JustApp"
        width={sizeConfig.icon}
        height={sizeConfig.icon}
        className="shrink-0"
        priority
      />
      {showText && (
        <span
          className={cn(
            'font-bold tracking-tight bg-gradient-to-r from-[#001F5C] via-[#0066CC] to-[#00BFBF] bg-clip-text text-transparent',
            sizeConfig.text
          )}
        >
          JustApp
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="group">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}
