'use client'

import { SignupAdvogadoForm } from '@/components/forms/signup-advogado-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Scale, Briefcase, CheckCircle2 } from 'lucide-react'

export default function SignupAdvogadoPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-indigo-600 via-indigo-500 to-indigo-400 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-colors">
              <Scale className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold">JustApp</span>
          </Link>

          {/* Main Content */}
          <div className="max-w-lg">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
              <Briefcase className="h-10 w-10" />
            </div>

            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Receba leads qualificados e expanda sua carteira de clientes
            </h1>

            <p className="text-xl text-white/90 mb-8">
              Cadastre-se gratuitamente e conecte-se com clientes que precisam da sua especialidade.
            </p>

            {/* Benefits */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">O que você ganha:</h3>
              {[
                'Leads qualificados e pré-analisados por IA',
                'Perfil profissional otimizado e verificado',
                'Gestão completa de casos e leads',
                'Sistema de avaliações para construir reputação',
                'Planos flexíveis que crescem com você',
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-white/90">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-white/70">
            © 2026 JustApp. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 lg:max-w-xl flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-2">
              <Scale className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">JustApp</span>
            </Link>
          </div>

          {/* Back Button */}
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>

          <Card className="border-2">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold">Cadastro de Advogado</CardTitle>
              <CardDescription className="text-base">
                Crie sua conta para receber leads qualificados e expandir sua prática
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignupAdvogadoForm />
            </CardContent>
          </Card>

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground mt-6 px-4">
            Ao criar uma conta, você concorda com nossos{' '}
            <Link href="/termos" className="underline hover:text-primary">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link href="/privacidade" className="underline hover:text-primary">
              Política de Privacidade
            </Link>
          </p>

          {/* Already have account */}
          <div className="text-center mt-6">
            <span className="text-sm text-muted-foreground">Já tem uma conta? </span>
            <Link href="/auth/signin" className="text-sm text-primary font-semibold hover:underline">
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
