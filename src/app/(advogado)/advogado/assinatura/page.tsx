'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PlanCard } from '@/components/assinatura/plan-card'
import { SubscriptionStatus } from '@/components/assinatura/subscription-status'
import { PlanComparison } from '@/components/assinatura/plan-comparison'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertCircle } from 'lucide-react'
import { type PlanConfig } from '@/lib/plans'

interface PlanData {
  plano: string
  planoExpira: string | null
  isActive: boolean
  leadsRecebidosMes: number
  leadsLimiteMes: number
  ultimoResetLeads: string
  hasStripeSubscription: boolean
}

export default function AssinaturaPage() {
  const [planData, setPlanData] = useState<PlanData | null>(null)
  const [plans, setPlans] = useState<Record<string, PlanConfig>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Buscar dados do plano atual e configs dos planos
      const [planRes, plansRes] = await Promise.all([
        fetch('/api/advogado/plano'),
        fetch('/api/plans'),
      ])

      const [planResult, plansResult] = await Promise.all([
        planRes.json(),
        plansRes.json(),
      ])

      if (planResult.success) {
        setPlanData(planResult.data)
      }

      if (plansResult.success) {
        setPlans(plansResult.data)
      }
    } catch (error) {
      console.error('Erro ao buscar plano:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao buscar informações do plano',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlanData = loadData // Alias para compatibilidade

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'FREE') {
      return
    }

    setIsSubscribing(true)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })

      const result = await res.json()

      if (result.success && result.url) {
        // Redireciona para checkout do Stripe
        window.location.href = result.url
      } else {
        throw new Error(result.error || 'Erro ao criar checkout')
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao processar assinatura',
        variant: 'destructive',
      })
      setIsSubscribing(false)
    }
  }

  // Verifica se há parâmetros de sucesso/cancelamento na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Assinatura ativada com sucesso',
      })
      fetchPlanData()
      // Remove parâmetro da URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (params.get('canceled') === 'true') {
      toast({
        variant: 'warning',
        title: 'Cancelado',
        description: 'Assinatura cancelada',
      })
      // Remove parâmetro da URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciar Assinatura</h1>
        <p className="text-muted-foreground">
          Escolha o plano ideal para receber leads qualificados
        </p>
      </div>

      {planData && (
        <div className="mb-8">
          <SubscriptionStatus
            plano={planData.plano}
            planoExpira={planData.planoExpira}
            isActive={planData.isActive}
            leadsRecebidosMes={planData.leadsRecebidosMes}
            leadsLimiteMes={planData.leadsLimiteMes}
            ultimoResetLeads={planData.ultimoResetLeads}
          />
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Escolha seu Plano</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {Object.keys(plans).length > 0 ? (
            Object.entries(plans).map(([planId, plan]) => (
              <PlanCard
                key={planId}
                plan={plan}
                planId={planId}
                currentPlan={planData?.plano}
                onSelect={handleSelectPlan}
                isLoading={isSubscribing}
              />
            ))
          ) : (
            // Skeleton dos planos enquanto carrega
            <>
              <Skeleton className="h-[400px]" />
              <Skeleton className="h-[400px]" />
              <Skeleton className="h-[400px]" />
            </>
          )}
        </div>
      </div>

      <div className="mb-8">
        <PlanComparison plans={plans} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Como funciona o limite de leads?</h3>
            <p className="text-sm text-muted-foreground">
              O limite de leads é resetado mensalmente. Leads recebidos são contabilizados
              apenas quando você aceita o caso. Leads recusados não contam para o limite.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Posso mudar de plano a qualquer momento?</h3>
            <p className="text-sm text-muted-foreground">
              Sim! Você pode fazer upgrade ou downgrade a qualquer momento. O novo plano será
              aplicado imediatamente e o valor será ajustado proporcionalmente.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">O que acontece se eu cancelar?</h3>
            <p className="text-sm text-muted-foreground">
              Seu plano continuará ativo até o final do período pago. Após isso, você voltará
              para o plano gratuito e não receberá mais leads.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
