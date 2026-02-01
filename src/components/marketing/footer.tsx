import Link from 'next/link'
import { Scale } from 'lucide-react'

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">JustApp</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2 font-semibold">
                Plataforma Jurídica Inteligente
              </p>
              <p className="text-sm text-muted-foreground">
                Conectando pessoas a advogados especializados através de tecnologia avançada
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Para Cidadãos</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/signup/cidadao" className="hover:text-foreground">
                    Criar Conta
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signin" className="hover:text-foreground">
                    Entrar
                  </Link>
                </li>
                <li>
                  <Link href="/novo-caso" className="hover:text-foreground">
                    Criar Caso
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Para Advogados</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/signup/advogado" className="hover:text-foreground">
                    Cadastrar
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signin" className="hover:text-foreground">
                    Entrar
                  </Link>
                </li>
                <li>
                  <Link href="/advogado/assinatura" className="hover:text-foreground">
                    Planos
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Ajuda
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Termos de Uso
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} JustApp - Plataforma Jurídica Inteligente. Todos
              os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
