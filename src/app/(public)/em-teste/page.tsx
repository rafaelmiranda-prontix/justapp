import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Beaker,
  Users,
  Scale,
  Shield,
  MessageSquare,
  FileText,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Mail,
} from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aplicação em teste Beta',
  description:
    'O JustApp está em fase de testes. Informações para cidadãos e advogados.',
}

export default function EmTestePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo-icon.svg" alt="JustApp" className="h-6 w-6" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#001F5C] via-[#0066CC] to-[#00BFBF] bg-clip-text text-transparent">
                JustApp
              </span>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Aviso Beta */}
        <Card className="mb-8 border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/50">
                <Beaker className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Aplicação em teste Beta
                  <Badge variant="secondary" className="bg-amber-500 text-white border-0">
                    Beta
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  O JustApp está em fase de testes. Sua experiência e feedback são muito importantes para nós.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Durante o período Beta, a plataforma pode apresentar ajustes, melhorias e eventualmente falhas
              pontuais. Recomendamos que você reporte qualquer problema ou sugestão para que possamos
              melhorar continuamente.
            </p>
            <p className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                Os serviços oferecidos na Beta são reais: conexões entre cidadãos e advogados são
                realizadas. Utilize com consciência e nos ajude a melhorar.
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Para Cidadãos */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/50">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Para Cidadãos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Informações para quem busca orientação jurídica ou deseja conectar-se a um advogado
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4" />
                Como funciona
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Você descreve seu problema (por texto ou áudio) no chat da plataforma.</li>
                <li>Nossa equipe e ferramentas ajudam a qualificar seu caso e a encontrar advogados compatíveis.</li>
                <li>Advogados aprovados na plataforma podem receber seu caso e entrar em contato.</li>
                <li>Você acompanha o status do caso, troca mensagens e pode falar com a equipe em caso de mediação.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4" />
                O que você precisa saber
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Cadastre-se com dados verdadeiros (nome, e-mail, cidade/estado quando aplicável).</li>
                <li>O JustApp conecta você a advogados; o contrato de honorários e a relação profissional são entre você e o advogado.</li>
                <li>Em fase Beta, podemos assumir a mediação de alguns casos para garantir qualidade e suporte.</li>
                <li>Mantenha o e-mail e as notificações em dia para não perder prazos ou respostas dos advogados.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <HelpCircle className="h-4 w-4" />
                Dúvidas e suporte
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Em caso de dúvidas sobre seu caso, atrasos ou problemas na plataforma, use o canal de
                mensagens dentro do próprio caso (quando em mediação) ou entre em contato conosco:
              </p>
              <div className="flex flex-wrap gap-2">
                {process.env.NEXT_PUBLIC_SUPPORT_EMAIL && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}>
                      <Mail className="h-4 w-4 mr-1" />
                      E-mail
                    </a>
                  </Button>
                )}
                {process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://wa.me/${String(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP).replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href="/contato">Formulário de contato</Link>
                </Button>
              </div>
            </section>

            <div className="pt-2">
              <Button asChild>
                <Link href="/signup/cidadao">
                  Quero me cadastrar como cidadão
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Para Advogados */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-indigo-100 p-3 dark:bg-indigo-900/50">
                <Scale className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Para Advogados</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Informações para profissionais que desejam integrar a plataforma e receber casos
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4" />
                Requisitos para participar
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>OAB ativa e em dia (informação verificada quando aplicável).</li>
                <li>Cadastro completo: dados pessoais, profissional, especialidades, cidade/estado e raio de atuação.</li>
                <li>Aprovação pela equipe JustApp (análise de perfil e documentação em fase Beta).</li>
                <li>Plano ativo conforme oferta da plataforma (há planos gratuitos com limites e planos pagos com mais leads).</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Como funciona na prática
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Casos compatíveis com seu perfil (especialidade, localização) podem ser distribuídos para você.</li>
                <li>Você recebe notificações de novos casos e pode aceitar ou recusar dentro do prazo definido.</li>
                <li>Após aceitar, a comunicação com o cidadão ocorre pela plataforma (chat) até o combinado entre as partes.</li>
                <li>Respeite os limites de leads do seu plano e os prazos de resposta para manter a qualidade do serviço.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4" />
                Durante a Beta
              </h3>
              <p className="text-sm text-muted-foreground">
                Em fase de testes, podemos ajustar regras de distribuição de casos, limites por plano e
                fluxos de aprovação. Consulte sempre as configurações e comunicações enviadas pela
                plataforma. Em caso de inconsistências (ex.: contador de leads, casos não aparecendo),
                entre em contato com o suporte antes de tomar decisões que afetem sua prática.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" />
                Contato e suporte
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Dúvidas sobre cadastro, aprovação, planos ou problemas técnicos: utilize os canais abaixo.
                Na Beta, valorizamos seu feedback para melhorar a experiência profissional na plataforma.
              </p>
              <div className="flex flex-wrap gap-2">
                {process.env.NEXT_PUBLIC_SUPPORT_EMAIL && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}>
                      <Mail className="h-4 w-4 mr-1" />
                      E-mail
                    </a>
                  </Button>
                )}
                {process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://wa.me/${String(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP).replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href="/contato">Formulário de contato</Link>
                </Button>
              </div>
            </section>

            <div className="pt-2">
              <Button asChild variant="secondary">
                <Link href="/signup/advogado">
                  Quero me cadastrar como advogado
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Links úteis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Links úteis</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/termos">Termos de Uso</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/privacidade">Política de Privacidade</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Página inicial</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
