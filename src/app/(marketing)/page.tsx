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
  BarChart3,
} from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LegalMatch - O Uber dos Processos | Encontre seu Advogado em Minutos',
  description:
    'Conectamos pessoas com problemas jurídicos a advogados especializados. Chat inteligente, matching automático e 100% online. Comece agora!',
  openGraph: {
    title: 'LegalMatch - O Uber dos Processos',
    description:
      'Encontre o advogado ideal para seu caso em minutos. Plataforma inteligente que conecta você ao profissional certo.',
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
    title: 'Matching Automático',
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
  'Matching inteligente reduz perda de tempo',
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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                O Uber dos Processos
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent leading-tight">
              Encontre seu Advogado
              <br />
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                em Minutos
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Conectamos pessoas com problemas jurídicos a advogados especializados.
              <br />
              <span className="font-semibold text-foreground">
                Chat inteligente • Matching automático • 100% online
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
                <Link href="/signup/cidadao">
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 h-auto border-2"
                asChild
              >
                <Link href="/signup/advogado">Sou Advogado</Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Sem custos para cidadãos</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Foco em Rio de Janeiro</span>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                <span>Direito do Consumidor</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div key={idx} className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Você já passou por isso?
          </h2>
          <p className="text-xl text-muted-foreground">
            Problemas comuns que tornam difícil encontrar ajuda jurídica
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {problems.map((problem, idx) => {
            const Icon = problem.icon
            return (
              <Card key={idx} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-4 rounded-full bg-destructive/10">
                      <Icon className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="text-xl font-semibold">{problem.title}</h3>
                    <p className="text-muted-foreground">{problem.description}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Solution Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-purple-500/5 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              A solução é simples
            </h2>
            <p className="text-xl text-muted-foreground">
              LegalMatch conecta você ao advogado ideal de forma rápida e inteligente
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {solutions.map((solution, idx) => {
              const Icon = solution.icon
              return (
                <Card
                  key={idx}
                  className="border-2 hover:shadow-lg transition-all hover:scale-[1.02]"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${solution.bgColor} shrink-0`}>
                        <Icon className={`h-6 w-6 ${solution.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{solution.title}</h3>
                        <p className="text-muted-foreground">{solution.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Como Funciona</h2>
          <p className="text-xl text-muted-foreground">
            Em 3 passos simples, você encontra o advogado ideal
          </p>
        </div>
        <div className="max-w-4xl mx-auto space-y-8">
          {[
            {
              step: '1',
              title: 'Conte seu problema',
              description:
                'Use nosso chat inteligente para descrever sua situação em texto ou áudio. Nossa IA analisa e identifica a área do direito.',
            },
            {
              step: '2',
              title: 'Receba matches',
              description:
                'Veja uma lista de advogados especializados, próximos de você e com as melhores avaliações.',
            },
            {
              step: '3',
              title: 'Converse e contrate',
              description:
                'Entre em contato diretamente com o advogado através do chat. Tudo acontece na plataforma, de forma segura.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex gap-6 items-start p-6 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl shrink-0">
                {item.step}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-lg">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits - Cidadão */}
      <section className="bg-muted py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Para Cidadãos
              </h2>
              <p className="text-xl text-muted-foreground">
                Encontre o advogado certo sem complicação
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {benefitsCidadao.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-background">
                  <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                  <p className="text-lg">{benefit}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/signup/cidadao">
                  Buscar Advogado Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits - Advogado */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Para Advogados
            </h2>
            <p className="text-xl text-muted-foreground">
              Receba leads qualificados e aumente sua base de clientes
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {benefitsAdvogado.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <Award className="h-6 w-6 text-primary shrink-0 mt-1" />
                <p className="text-lg">{benefit}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="text-lg px-8 border-2" asChild>
              <Link href="/signup/advogado">
                Cadastrar como Advogado
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-br from-primary/5 to-purple-500/5 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl text-muted-foreground">
              Histórias reais de pessoas que encontraram ajuda jurídica
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-2 hover:shadow-lg transition-shadow">
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
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10 border-2 border-primary/20">
          <CardContent className="pt-16 pb-16 text-center">
            <div className="max-w-3xl mx-auto">
              <Scale className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Pronto para encontrar seu advogado?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Junte-se a milhares de pessoas que já resolveram seus problemas jurídicos
                através do LegalMatch. Comece agora, é grátis!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
                  <Link href="/signup/cidadao">
                    Começar Agora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 h-auto border-2"
                  asChild
                >
                  <Link href="/signup/advogado">Sou Advogado</Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>100% Seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Resposta em minutos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Sem compromisso</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
