import { SignupCidadaoForm } from '@/components/forms/signup-cidadao-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SignupCidadaoPage() {
  return (
    <>
      <Link
        href="/signup"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Cidadão</CardTitle>
          <CardDescription>Crie sua conta para encontrar advogados especializados</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupCidadaoForm />
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Ao criar uma conta, você concorda com nossos{' '}
        <Link href="/termos" className="text-primary hover:underline">
          Termos de Uso
        </Link>{' '}
        e{' '}
        <Link href="/privacidade" className="text-primary hover:underline">
          Política de Privacidade
        </Link>
      </p>
    </>
  )
}
