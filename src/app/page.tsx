import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Scale, Users, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <main className="flex-1">
        <div className="container px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Legal<span className="text-primary">Match</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              O Uber dos Processos Jurídicos
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              Conecte-se ao advogado ideal para o seu caso
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" asChild>
                <Link href="/signup/cidadao">
                  Preciso de um advogado
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup/advogado">Sou advogado</Link>
              </Button>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-primary/10 rounded-lg mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Encontre Especialistas</h3>
                <p className="text-sm text-muted-foreground">
                  Advogados qualificados na sua área e região
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-primary/10 rounded-lg mb-4">
                  <Scale className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Matching Inteligente</h3>
                <p className="text-sm text-muted-foreground">
                  IA analisa seu caso e conecta você ao profissional ideal
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-primary/10 rounded-lg mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Seguro e Confiável</h3>
                <p className="text-sm text-muted-foreground">
                  Todos os advogados são verificados pela OAB
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>
            Já tem uma conta?{' '}
            <Link href="/signin" className="text-primary hover:underline font-medium">
              Fazer login
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
