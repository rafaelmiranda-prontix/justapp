'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatPhone, unformatPhone } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const signupCidadaoSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type SignupCidadaoFormData = z.infer<typeof signupCidadaoSchema>

export function SignupCidadaoForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SignupCidadaoFormData>({
    resolver: zodResolver(signupCidadaoSchema),
  })

  const phoneValue = watch('phone')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setValue('phone', formatted)
  }

  const onSubmit = async (data: SignupCidadaoFormData) => {
    setIsLoading(true)

    try {
      const res = await fetch('/api/users/cidadao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone ? unformatPhone(data.phone) : undefined,
          password: data.password,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Erro ao criar conta')
      }

      toast({
        variant: 'success',
        title: 'Conta criada com sucesso!',
        description: 'Faça login para continuar',
      })

      router.push('/auth/signin')
    } catch (error) {
      toast({
        title: 'Erro ao criar conta',
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Nome completo <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="João da Silva"
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="joao@exemplo.com"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone (opcional)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(21) 99999-9999"
          value={phoneValue || ''}
          onChange={handlePhoneChange}
          disabled={isLoading}
        />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Senha <span className="text-red-500">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          disabled={isLoading}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          Confirmar senha <span className="text-red-500">*</span>
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Criar conta
      </Button>
    </form>
  )
}
