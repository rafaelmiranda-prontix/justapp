import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserCircle, Scale } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="space-y-4">
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <Link href="/signup/cidadao">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Sou Cidadão</CardTitle>
                <CardDescription>Preciso de ajuda jurídica</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cadastre-se para encontrar advogados especializados no seu caso
            </p>
          </CardContent>
        </Link>
      </Card>

      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <Link href="/signup/advogado">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Scale className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <CardTitle>Sou Advogado</CardTitle>
                <CardDescription>Quero receber clientes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cadastre-se para receber leads qualificados na sua área de atuação
            </p>
          </CardContent>
        </Link>
      </Card>

      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/signin" className="text-primary hover:underline font-medium">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}
