import Link from 'next/link'
import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resposta ao convite Beta — JustApp',
  description: 'Confirmação da sua resposta ao convite para o teste Beta.',
}

export default async function ConviteBetaResultadoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const resultado =
    typeof sp.resultado === 'string' ? sp.resultado : undefined
  const erro = typeof sp.erro === 'string' ? sp.erro : undefined

  let title = 'Resposta registrada'
  let description = 'Obrigado por responder ao nosso convite.'
  let icon: ReactNode = <CheckCircle2 className="h-12 w-12 text-green-600" />

  if (erro) {
    icon = <AlertCircle className="h-12 w-12 text-amber-600" />
    if (erro === 'expirado') {
      title = 'Link expirado'
      description =
        'Este convite não é mais válido. Se precisar de ajuda, entre em contato com o suporte pelo site.'
    } else if (erro === 'ja_usado') {
      title = 'Resposta já registrada'
      description =
        'Este link já foi utilizado. Se você já respondeu anteriormente, não é necessário fazer nada novamente.'
    } else if (erro === 'token' || erro === 'invalido') {
      title = 'Link inválido'
      description =
        'Não foi possível identificar seu convite. Verifique se copiou o link completo ou solicite um novo e-mail ao suporte.'
    } else {
      title = 'Algo deu errado'
      description =
        'Não foi possível processar sua resposta no momento. Tente novamente mais tarde ou fale com o suporte.'
    }
  } else if (resultado === 'aceito') {
    title = 'Obrigado por aceitar!'
    description =
      'Registramos sua participação no programa Beta. Em breve você receberá mais informações por e-mail ou na plataforma.'
    icon = <CheckCircle2 className="h-12 w-12 text-green-600" />
  } else if (resultado === 'recusado') {
    title = 'Resposta registrada'
    description =
      'Registramos que você não deseja participar do Beta neste momento. Agradecemos seu retorno.'
    icon = <XCircle className="h-12 w-12 text-slate-500" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{icon}</div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center text-muted-foreground">
          <p className="text-sm leading-relaxed">{description}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button asChild variant="default">
              <Link href="/em-teste">Sobre o Beta</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Página inicial</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
