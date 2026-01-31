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

/**
 * Formata telefone brasileiro: (XX) XXXXX-XXXX
 * Remove caracteres não numéricos e aplica a máscara
 */
export function formatPhone(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  // Aplica a máscara
  if (numbers.length <= 2) {
    return numbers.length > 0 ? `(${numbers}` : numbers
  } else if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
  } else {
    // Limita a 11 dígitos (com DDD + 9 dígitos)
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
  }
}

/**
 * Remove a máscara do telefone, retornando apenas os números
 */
export function unformatPhone(value: string): string {
  return value.replace(/\D/g, '')
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
