import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Scale,
  Users,
  Zap,
  Shield,
  CheckCircle2,
  ArrowRight,
  Star,
  MessageSquare,
  MapPin,
  TrendingUp,
  Clock,
  Sparkles,
  Target,
  Award,
  Menu,
  X,
} from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LegalConnect - Resolva seu Caso Jurídico em Minutos | Plataforma Jurídica Inteligente',
  description:
    'Conectamos pessoas com problemas jurídicos a advogados especializados. Chat inteligente, conexão automática e 100% online. Comece agora!',
  openGraph: {
    title: 'LegalConnect - Resolva seu Caso Jurídico em Minutos',
    description:
      'Resolva seu caso jurídico com o advogado ideal em minutos. Plataforma inteligente que conecta você ao profissional certo.',
    type: 'website',
  },
}

const problems = [
  {
    icon: Target,
    title: 'Não sabe se tem um caso válido',
    description: 'Dúvidas sobre seus direitos e se vale a pena buscar ajuda jurídica',
  },
  {
    icon: Users,
    title: 'Dificuldade em encontrar advogado',
    description: 'Não sabe qual especialista procurar ou onde encontrar profissionais confiáveis',
  },
  {
    icon: Clock,
    title: 'Processo complexo e demorado',
    description: 'Medo de custos ocultos e burocracias que tornam tudo mais difícil',
  },
]

const solutions = [
  {
    icon: MessageSquare,
    title: 'Chat Inteligente',
    description:
      'Conte seu problema em texto ou áudio. Nossa IA analisa e encontra o advogado ideal para você.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Zap,
    title: 'Conexão Automática',
    description:
      'Sistema inteligente conecta você ao advogado certo: especialidade + localização + avaliações.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: Shield,
    title: 'Advogados Verificados',
    description:
      'Todos os profissionais são verificados pela OAB e têm avaliações reais de clientes.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: TrendingUp,
    title: '100% Online',
    description:
      'Todo o processo acontece na plataforma: do primeiro contato até a contratação.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
]

const benefitsCidadao = [
  'Encontre o advogado certo em minutos',
  'Chat inteligente analisa seu caso automaticamente',
  'Advogados verificados pela OAB',
  'Avaliações reais de outros clientes',
  'Comunicação direta e segura',
  'Sem custos para você',
]

const benefitsAdvogado = [
  'Leads qualificados na sua área',
  'Conexão inteligente reduz perda de tempo',
  'Dashboard com métricas de performance',
  'Plano flexível: gratuito ou premium',
  'Foco em Direito do Consumidor (RJ)',
  'Aumente sua base de clientes',
]

const stats = [
  { label: 'Advogados Cadastrados', value: '500+', icon: Scale },
  { label: 'Casos Resolvidos', value: '2.500+', icon: CheckCircle2 },
  { label: 'Avaliações', value: '1.200+', icon: Star },
  { label: 'Taxa de Satisfação', value: '98%', icon: TrendingUp },
]

const testimonials = [
  {
    name: 'Maria Silva',
    role: 'Cidadã - Rio de Janeiro',
    text: 'Encontrei o advogado perfeito em minutos! O chat foi super fácil e o advogado resolveu meu caso de consumo rapidamente.',
    rating: 5,
    avatar: 'MS',
  },
  {
    name: 'Dr. João Santos',
    role: 'Advogado - Direito do Consumidor',
    text: 'Os leads são muito qualificados. Recebo casos que realmente posso ajudar e a plataforma facilita muito o contato.',
    rating: 5,
    avatar: 'JS',
  },
  {
    name: 'Ana Costa',
    role: 'Cidadã - Rio de Janeiro',
    text: 'Processo super simples e rápido. Consegui resolver minha questão com uma loja online em poucos dias!',
    rating: 5,
    avatar: 'AC',
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header - Estilo Jira */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Scale className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">LegalConnect</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="#funcionalidades"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Funcionalidades
                </Link>
                <Link
                  href="#como-funciona"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Como Funciona
                </Link>
                <Link
                  href="#precos"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Preços
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/signin">Entrar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup/cidadao">Começar Grátis</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Estilo Jira */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Resolva seu caso jurídico
              <br />
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                com o advogado certo em minutos
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A plataforma jurídica inteligente que conecta você ao advogado ideal para seu caso.
              Chat inteligente, conexão automática e 100% online.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8 h-12" asChild>
                <Link href="/signup/cidadao">
                  Começar Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 h-12" asChild>
                <Link href="/signup/advogado">Sou Advogado</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Sem cartão de crédito • Sem compromisso • Comece agora
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div key={idx} className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main Features - Estilo Jira */}
      <section id="funcionalidades" className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tudo isso usando uma fonte única de informações
            </h2>
            <p className="text-xl text-muted-foreground">
              Plataforma completa para conectar cidadãos e advogados
            </p>
          </div>

          <div className="space-y-24">
            {/* Feature 1: Chat Inteligente */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-sm font-medium mb-4">
                  <MessageSquare className="h-4 w-4" />
                  Chat Inteligente
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  Conte seu problema e resolva seu caso rapidamente
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Use nosso chat inteligente para descrever sua situação em texto ou áudio. Nossa
                  IA analisa automaticamente e identifica a área do direito, urgência e
                  complexidade do seu caso.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Análise automática por IA</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Suporte a texto e áudio</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Identificação automática da especialidade</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-8 border">
                <div className="space-y-4">
                  <div className="bg-background rounded-lg p-4 border shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Chat LegalConnect</p>
                        <p className="text-xs text-muted-foreground">Online agora</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      "Tive um problema com uma compra online. A loja não quer me reembolsar..."
                    </p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-4 border-l-4 border-l-primary">
                    <p className="text-sm">
                      <strong>IA:</strong> Identificamos que seu caso é de{' '}
                      <strong>Direito do Consumidor</strong>. Encontramos 5 advogados especializados
                      próximos a você.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Conexão Automática */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-8 border">
                  <div className="space-y-3">
                    {[
                      { name: 'Dr. João Silva', score: 95, status: 'Verificado' },
                      { name: 'Dra. Maria Santos', score: 92, status: 'Verificado' },
                      { name: 'Dr. Pedro Costa', score: 88, status: 'Verificado' },
                    ].map((adv, idx) => (
                      <div
                        key={idx}
                        className="bg-background rounded-lg p-4 border shadow-sm flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                            {adv.name.split(' ')[1][0]}
                          </div>
                          <div>
                            <p className="font-medium">{adv.name}</p>
                            <p className="text-xs text-muted-foreground">{adv.status}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">{adv.score}%</p>
                          <p className="text-xs text-muted-foreground">compatibilidade</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-sm font-medium mb-4">
                  <Zap className="h-4 w-4" />
                  Conexão Automática
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  Sistema inteligente conecta você ao advogado certo
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Nossa tecnologia analisa especialidade, localização, avaliações e disponibilidade
                  para conectar você ao advogado mais compatível com seu caso.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Conexão inteligente baseada em IA e dados reais</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Priorização por compatibilidade e avaliações</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Filtros por localização e especialidade</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3: Comunicação */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium mb-4">
                  <Shield className="h-4 w-4" />
                  Comunicação Segura
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">
                  Converse diretamente com seu advogado
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Todo o processo acontece na plataforma: do primeiro contato até a contratação.
                  Chat integrado, seguro e com histórico completo.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Chat em tempo real na plataforma</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Envio de documentos e anexos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Histórico completo de conversas</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-lg p-8 border">
                <div className="bg-background rounded-lg p-4 border shadow-sm space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      JS
                    </div>
                    <div>
                      <p className="font-medium">Dr. João Silva</p>
                      <p className="text-xs text-muted-foreground">Advogado • Online</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm">Olá! Vi seu caso sobre o reembolso...</p>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-3 ml-8">
                      <p className="text-sm">Obrigado! Quando podemos conversar?</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Estilo Jira */}
      <section id="como-funciona" className="bg-muted/30 border-y py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Como Funciona</h2>
              <p className="text-xl text-muted-foreground">
                Em 3 passos simples, você resolve seu caso jurídico
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Conte seu problema',
                  description:
                    'Use nosso chat inteligente para descrever sua situação. Nossa IA analisa e identifica a área do direito.',
                  icon: MessageSquare,
                },
                {
                  step: '2',
                  title: 'Escolha seu advogado',
                  description:
                    'Veja uma lista de advogados especializados, próximos de você e com as melhores avaliações.',
                  icon: Zap,
                },
                {
                  step: '3',
                  title: 'Converse e contrate',
                  description:
                    'Entre em contato diretamente com o advogado através do chat. Tudo acontece na plataforma, de forma segura.',
                  icon: CheckCircle2,
                },
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <Card key={idx} className="border-2 hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl">
                          {item.step}
                        </div>
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Para Cidadãos */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold">Para Cidadãos</h2>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Resolva seu caso jurídico de forma rápida e simples
              </p>
              <ul className="space-y-4">
                {benefitsCidadao.map((benefit, idx) => {
                  const commercialBenefits = [
                    'Resolva seu caso jurídico em minutos',
                    'Chat inteligente analisa seu caso automaticamente',
                    'Advogados verificados pela OAB',
                    'Avaliações reais de outros clientes',
                    'Comunicação direta e segura',
                    'Sem custos para você',
                  ]
                  return (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-base">{commercialBenefits[idx]}</span>
                    </li>
                  )
                })}
              </ul>
              <Button className="mt-6" asChild>
                <Link href="/signup/cidadao">
                  Resolver Meu Caso Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Para Advogados */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Scale className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold">Para Advogados</h2>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Receba casos qualificados e aumente sua base de clientes
              </p>
              <ul className="space-y-4">
                {benefitsAdvogado.map((benefit, idx) => {
                  const commercialBenefits = [
                    'Casos qualificados na sua área',
                    'Conexão inteligente reduz perda de tempo',
                    'Dashboard com métricas de performance',
                    'Plano flexível: gratuito ou premium',
                    'Foco em Direito do Consumidor (RJ)',
                    'Aumente sua base de clientes',
                  ]
                  return (
                    <li key={idx} className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-base">{commercialBenefits[idx]}</span>
                    </li>
                  )
                })}
              </ul>
              <Button variant="outline" className="mt-6" asChild>
                <Link href="/signup/advogado">
                  Cadastrar como Advogado
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/30 border-y py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                O que nossos usuários dizem
              </h2>
              <p className="text-xl text-muted-foreground">
                Histórias reais de pessoas que encontraram ajuda jurídica
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, idx) => (
                <Card key={idx} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final - Estilo Jira */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10 border-2 border-primary/20">
          <CardContent className="pt-16 pb-16 text-center">
            <div className="max-w-3xl mx-auto">
              <Scale className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Pronto para resolver seu caso jurídico?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Junte-se a milhares de pessoas que já resolveram seus problemas jurídicos através
                do LegalConnect. Comece agora, é grátis!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button size="lg" className="text-lg px-8 h-12" asChild>
                  <Link href="/signup/cidadao">
                    Começar Grátis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 h-12" asChild>
                  <Link href="/signup/advogado">Sou Advogado</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Sem cartão de crédito • Sem compromisso • Comece agora
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer - Estilo Jira */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="h-6 w-6 text-primary" />
                  <span className="text-xl font-bold">LegalConnect</span>
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
                © {new Date().getFullYear()} LegalConnect - Plataforma Jurídica Inteligente. Todos
                os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
