'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserCircle, Scale, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-colors">
              <Scale className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold">LegalConnect</span>
          </Link>

          {/* Main Content */}
          <div className="max-w-lg">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Junte-se à plataforma que conecta
            </h1>
            <p className="text-xl text-primary-foreground/90 mb-12">
              Milhares de cidadãos e advogados já estão usando o LegalConnect para resolver casos jurídicos.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-4xl font-bold mb-2">5.000+</div>
                <div className="text-primary-foreground/80">Casos resolvidos</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-primary-foreground/80">Advogados ativos</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-primary-foreground/70">
            © 2026 LegalConnect. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Right Side - Selection */}
      <div className="flex-1 lg:max-w-2xl flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-2xl">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-2">
              <Scale className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">LegalConnect</span>
            </Link>
            <p className="text-muted-foreground">Conecte-se ao advogado ideal</p>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Criar sua conta</h2>
            <p className="text-muted-foreground">
              Escolha o tipo de conta que você deseja criar
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Cidadão Card */}
            <Link href="/signup/cidadao" className="group">
              <Card className="border-2 hover:border-primary hover:shadow-xl transition-all duration-300 h-full cursor-pointer">
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl mb-2">Sou Cidadão</CardTitle>
                    <CardDescription className="text-base">
                      Preciso de ajuda jurídica
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Cadastre-se para encontrar advogados especializados no seu caso
                  </p>

                  <div className="space-y-2">
                    {[
                      'Análise gratuita do seu caso',
                      'Matching com especialistas',
                      'Chat direto com advogados',
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full group-hover:gap-3 gap-2 transition-all" variant="outline">
                    Criar conta como Cidadão
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Advogado Card */}
            <Link href="/signup/advogado" className="group">
              <Card className="border-2 hover:border-primary hover:shadow-xl transition-all duration-300 h-full cursor-pointer">
                <CardHeader className="space-y-4">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Scale className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl mb-2">Sou Advogado</CardTitle>
                    <CardDescription className="text-base">
                      Quero receber clientes
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Cadastre-se para receber leads qualificados na sua área de atuação
                  </p>

                  <div className="space-y-2">
                    {[
                      'Leads qualificados diariamente',
                      'Perfil profissional completo',
                      'Sistema de avaliações',
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full group-hover:gap-3 gap-2 transition-all" variant="outline">
                    Criar conta como Advogado
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/auth/signin" className="text-primary font-semibold hover:underline">
                Fazer login
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
