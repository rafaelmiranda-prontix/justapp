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
  TrendingUp,
} from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LegalMatch - Conecte-se ao Advogado Ideal',
  description:
    'Plataforma que conecta pessoas com problemas jurídicos a advogados especializados. Encontre o advogado perfeito para o seu caso em minutos.',
  openGraph: {
    title: 'LegalMatch - Conecte-se ao Advogado Ideal',
    description:
      'Plataforma que conecta pessoas com problemas jurídicos a advogados especializados.',
    type: 'website',
  },
}

const features = [
  {
    icon: Zap,
    title: 'Matching Inteligente',
    description:
      'IA analisa seu caso e encontra os advogados mais compatíveis em segundos',
  },
  {
    icon: Shield,
    title: 'Advogados Verificados',
    description: 'Todos os advogados são verificados pela OAB e têm avaliações reais',
  },
  {
    icon: Users,
    title: 'Comunicação Direta',
    description: 'Converse diretamente com advogados através do chat integrado',
  },
  {
    icon: TrendingUp,
    title: 'Resultados Comprovados',
    description: 'Milhares de casos resolvidos com sucesso através da plataforma',
  },
]

const benefits = [
  'Encontre advogados especializados na sua área',
  'Compare perfis e avaliações antes de contratar',
  'Comunicação direta e segura',
  'Processo 100% online',
  'Sem custos para cidadãos',
]

const stats = [
  { label: 'Advogados Cadastrados', value: '500+' },
  { label: 'Casos Resolvidos', value: '2.500+' },
  { label: 'Avaliações', value: '1.200+' },
  { label: 'Taxa de Satisfação', value: '98%' },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Encontre o Advogado Ideal
          <br />
          para o Seu Caso
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Conectamos pessoas com problemas jurídicos a advogados especializados.
          <br />
          Rápido, seguro e 100% online.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/signup/cidadao">
              Buscar Advogado
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/signup/advogado">
              Sou Advogado
            </Link>
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Por que escolher o LegalMatch?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Como Funciona
            </h2>
            <div className="space-y-6">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <p className="text-lg">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-12 pb-12 text-center">
            <Scale className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Pronto para encontrar seu advogado?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que já encontraram o advogado ideal
              através do LegalMatch
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/signup/cidadao">
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/signup/advogado">
                  Cadastrar como Advogado
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          O que nossos usuários dizem
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'Maria Silva',
              role: 'Cidadã',
              text: 'Encontrei o advogado perfeito em minutos. O processo foi muito simples e o atendimento foi excelente!',
              rating: 5,
            },
            {
              name: 'João Santos',
              role: 'Cidadão',
              text: 'A plataforma é muito intuitiva e os advogados são realmente especializados. Recomendo!',
              rating: 5,
            },
            {
              name: 'Ana Costa',
              role: 'Cidadã',
              text: 'Consegui resolver meu caso rapidamente graças ao LegalMatch. Profissionais de qualidade!',
              rating: 5,
            },
          ].map((testimonial, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
