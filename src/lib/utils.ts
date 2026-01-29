import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatOAB(oab: string): string {
  // Remove tudo que não é letra ou número
  const clean = oab.replace(/[^A-Z0-9]/gi, '').toUpperCase()

  // Formato: XX123456 -> XX 123.456
  const match = clean.match(/^([A-Z]{2})(\d+)$/)
  if (!match) return oab

  const [, state, number] = match
  const formattedNumber = number.replace(/(\d{3})(\d{3})/, '$1.$2')
  return `${state} ${formattedNumber}`
}

export function validateOAB(oab: string): boolean {
  const clean = oab.replace(/[^A-Z0-9]/gi, '')
  return /^[A-Z]{2}\d{6}$/i.test(clean)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
