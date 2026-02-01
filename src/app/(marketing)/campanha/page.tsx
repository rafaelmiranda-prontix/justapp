'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Scale,
  CheckCircle2,
  ArrowRight,
  Star,
  Users,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Target,
  Award,
  Phone,
  Mail,
  MapPin,
  UserPlus,
  DollarSign,
} from 'lucide-react'
import { AnonymousChatButton } from '@/components/anonymous-chat/anonymous-chat-button'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export default function CampanhaPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simular envio (você pode integrar com sua API)
    setTimeout(() => {
      setSubmitted(true)
      setIsSubmitting(false)
    }, 1000)
  }

  const benefits = [
    {
      icon: Zap,
      title: 'Resposta em 24h',
      description: 'Advogados verificados respondem rapidamente ao seu caso',
    },
    {
      icon: Shield,
      title: '100% Gratuito',
      description: 'Sem custos para você. Pague apenas se contratar o advogado',
    },
    {
      icon: Target,
      title: 'Advogado Certo',
      description: 'IA encontra o especialista ideal para seu caso',
    },
    {
      icon: Award,
      title: 'Verificado pela OAB',
      description: 'Todos os advogados são profissionais certificados',
    },
  ]

  const stats = [
    { value: '5.000+', label: 'Casos resolvidos' },
    { value: '500+', label: 'Advogados ativos' },
    { value: '98%', label: 'Taxa de satisfação' },
    { value: '24h', label: 'Tempo médio de resposta' },
  ]

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Resolveu problema trabalhista',
      text: 'Encontrei o advogado perfeito em menos de 1 dia. O processo foi muito simples e rápido!',
      rating: 5,
    },
    {
      name: 'João Santos',
      role: 'Questão de família',
      text: 'A plataforma me conectou com um especialista incrível. Recomendo para todos!',
      rating: 5,
    },
    {
      name: 'Ana Costa',
      role: 'Direito do consumidor',
      text: 'Gratuito e eficiente. Consegui resolver meu problema sem complicações.',
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* Hero Section - Foco em Conversão */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-20 md:py-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            {/* Badge de Urgência */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 mb-6 shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">Atendimento em todo o Brasil</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Resolva seu problema jurídico com o{' '}
              <span className="text-yellow-300">advogado certo</span>
            </h1>

            <p className="text-xl md:text-2xl mb-8 text-white max-w-2xl mx-auto">
              Conecte-se com advogados especializados em minutos.{' '}
              <strong className="text-yellow-200">100% gratuito</strong> e sem compromisso.
            </p>

            {/* CTA Principal */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <AnonymousChatButton onClick={() => window.location.href = '/'} variant="large" />
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 h-auto border-2 border-white/50 bg-white/15 backdrop-blur-sm hover:bg-white/25 hover:border-white/70 text-white font-semibold shadow-lg"
                asChild
              >
                <Link href="/signup/cidadao">
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-base md:text-lg">
              <div className="flex items-center gap-2 bg-white/35 backdrop-blur-md px-5 py-3 rounded-full border-2 border-white/60 shadow-xl">
                <UserPlus className="h-5 w-5 text-white" />
                <span className="text-white font-bold">Sem cadastro inicial</span>
              </div>
              <div className="flex items-center gap-2 bg-white/35 backdrop-blur-md px-5 py-3 rounded-full border-2 border-white/60 shadow-xl">
                <Zap className="h-5 w-5 text-white" />
                <span className="text-white font-bold">Resposta em minutos</span>
              </div>
              <div className="flex items-center gap-2 bg-white/35 backdrop-blur-md px-5 py-3 rounded-full border-2 border-white/60 shadow-xl">
                <DollarSign className="h-5 w-5 text-white" />
                <span className="text-white font-bold">100% gratuito</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que escolher o JustApp?
            </h2>
            <p className="text-xl text-muted-foreground">
              A forma mais rápida e fácil de encontrar o advogado ideal
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon
              return (
                <Card key={idx} className="border-2 hover:border-primary transition-all hover:shadow-lg">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-br from-primary/5 to-purple-500/5 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Como Funciona
              </h2>
              <p className="text-xl text-muted-foreground">
                Simples, rápido e eficiente
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Conte seu caso',
                  description: 'Use nosso chat inteligente para descrever seu problema jurídico',
                  icon: MessageSquare,
                },
                {
                  step: '2',
                  title: 'Encontre o advogado',
                  description: 'Nossa IA conecta você ao advogado especializado ideal',
                  icon: Target,
                },
                {
                  step: '3',
                  title: 'Resolva seu problema',
                  description: 'Converse diretamente e resolva seu caso de forma rápida',
                  icon: CheckCircle2,
                },
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div key={idx} className="text-center">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                      {item.step}
                    </div>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl text-muted-foreground">
              Milhares de pessoas já resolveram seus problemas jurídicos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para resolver seu problema jurídico?
            </h2>
            <p className="text-xl mb-8 text-white">
              Comece agora mesmo. É rápido, fácil e <strong className="text-yellow-200">100% gratuito</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AnonymousChatButton onClick={() => window.location.href = '/'} variant="large" />
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 h-auto border-2 border-white/50 bg-white/15 backdrop-blur-sm hover:bg-white/25 hover:border-white/70 text-white font-semibold shadow-lg"
                asChild
              >
                <Link href="/signup/cidadao">
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-white/90 mt-6 font-medium">
              Sem cartão de crédito • Sem compromisso • 100% gratuito
            </p>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
