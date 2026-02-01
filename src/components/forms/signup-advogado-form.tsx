'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { validateOAB, formatPhone, unformatPhone } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const signupAdvogadoSchema = z.object({
  prefixo: z.enum(['Dr.', 'Dra.'], {
    required_error: 'Selecione o prefixo',
  }),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  oab: z.string().refine((val) => validateOAB(val), {
    message: 'Número OAB inválido (formato: SP123456)',
  }),
  cidade: z.string().min(2, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Estado deve ter 2 letras (ex: RJ)'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

type SignupAdvogadoFormData = z.infer<typeof signupAdvogadoSchema>

const ESTADOS_BRASILEIROS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export function SignupAdvogadoForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SignupAdvogadoFormData>({
    resolver: zodResolver(signupAdvogadoSchema),
    defaultValues: {
      prefixo: 'Dr.',
    },
  })

  const oabValue = watch('oab')
  const prefixoValue = watch('prefixo')
  const phoneValue = watch('phone')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setValue('phone', formatted)
  }

  const onSubmit = async (data: SignupAdvogadoFormData) => {
    setIsLoading(true)

    try {
      // Combinar prefixo com nome
      const fullName = `${data.prefixo} ${data.name.trim()}`

      const res = await fetch('/api/users/advogado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: data.email,
          phone: data.phone ? unformatPhone(data.phone) : '',
          oab: data.oab,
          cidade: data.cidade,
          estado: data.estado.toUpperCase(),
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
        description: result.message || 'Enviamos um email de ativação. Verifique sua caixa de entrada para ativar sua conta.',
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
        <div className="flex gap-2">
          <Select
            value={prefixoValue}
            onValueChange={(value) => setValue('prefixo', value as 'Dr.' | 'Dra.')}
            disabled={isLoading}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Dr." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dr.">Dr.</SelectItem>
              <SelectItem value="Dra.">Dra.</SelectItem>
            </SelectContent>
          </Select>
          <Input
            id="name"
            placeholder="João da Silva"
            {...register('name')}
            disabled={isLoading}
            className="flex-1"
          />
        </div>
        {errors.prefixo && (
          <p className="text-sm text-destructive">{errors.prefixo.message}</p>
        )}
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
        <Label htmlFor="phone">
          Telefone <span className="text-red-500">*</span>
        </Label>
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
        <Label htmlFor="oab">
          Número OAB <span className="text-red-500">*</span>
        </Label>
        <Input
          id="oab"
          placeholder="SP123456"
          {...register('oab')}
          disabled={isLoading}
          className={errors.oab ? 'border-destructive' : ''}
        />
        <p className="text-xs text-muted-foreground">Formato: SP123456 (Estado + número)</p>
        {errors.oab && <p className="text-sm text-destructive">{errors.oab.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cidade">
            Cidade <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cidade"
            placeholder="São Paulo"
            {...register('cidade')}
            disabled={isLoading}
          />
          {errors.cidade && <p className="text-sm text-destructive">{errors.cidade.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="estado">
            Estado <span className="text-red-500">*</span>
          </Label>
          <Input
            id="estado"
            placeholder="SP"
            maxLength={2}
            {...register('estado')}
            disabled={isLoading}
            className="uppercase"
          />
          {errors.estado && <p className="text-sm text-destructive">{errors.estado.message}</p>}
        </div>
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-900">
          📝 Após criar sua conta, você poderá completar seu perfil com especialidades, foto e
          outras informações.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Criar conta
      </Button>
    </form>
  )
}
