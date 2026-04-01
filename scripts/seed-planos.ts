import { prisma } from '../src/lib/prisma'
import { nanoid } from 'nanoid'
import type { Plano } from '@prisma/client'

/**
 * Script para popular a tabela de planos
 */
async function seedPlanos() {
  console.log('📋 Criando catálogo de planos...\n')

  const planos = [
    {
      codigo: 'FREE' as const,
      nome: 'Gratuito',
      descricao: 'Plano gratuito com recursos básicos',
      preco: 0,
      precoDisplay: 0,
      leadsPerMonth: 3,
      features: [
        'Perfil básico na plataforma',
        'Visualização de casos compatíveis',
        'Leads mensais limitados',
      ],
      stripePriceId: null,
      ativo: true,
      ordem: 1,
    },
    {
      codigo: 'BASIC' as const,
      nome: 'Básico',
      descricao: 'Plano ideal para advogados iniciantes',
      preco: 9900, // R$ 99,00 em centavos
      precoDisplay: 99,
      leadsPerMonth: 10,
      features: [
        'Leads qualificados por mês',
        'Perfil completo destacado',
        'Suporte por email',
        'Dashboard de métricas',
        'Avaliações de clientes',
      ],
      stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || null,
      ativo: true,
      ordem: 2,
    },
    {
      codigo: 'PREMIUM' as const,
      nome: 'Premium',
      descricao: 'Plano completo para profissionais estabelecidos',
      preco: 29900, // R$ 299,00 em centavos
      precoDisplay: 299,
      leadsPerMonth: 50,
      features: [
        'Máximo de leads qualificados',
        'Perfil destacado no topo',
        'Suporte prioritário',
        'Dashboard avançado',
        'Avaliações de clientes',
        'Relatórios detalhados',
        'Badge "Premium" no perfil',
      ],
      stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || null,
      ativo: true,
      ordem: 3,
    },
  ]

  let created = 0
  let updated = 0

  for (const plano of planos) {
    const existing = await prisma.planos.findUnique({
      where: { codigo: plano.codigo },
    })

    if (existing) {
      // Atualizar plano existente (mantém preço se não quiser sobrescrever)
      await prisma.planos.update({
        where: { codigo: plano.codigo },
        data: {
          nome: plano.nome,
          descricao: plano.descricao,
          features: plano.features,
          stripePriceId: plano.stripePriceId,
          ativo: plano.ativo,
          ordem: plano.ordem,
          updatedAt: new Date(),
          // Não atualiza preço e leads para preservar mudanças manuais
        },
      })
      console.log(`✅ Atualizado: ${plano.nome}`)
      updated++
    } else {
      // Criar novo plano
      await prisma.planos.create({
        data: {
          id: nanoid(),
          ...plano,
          updatedAt: new Date(),
        },
      })
      console.log(`✅ Criado: ${plano.nome}`)
      created++
    }
  }

  console.log(`\n📊 Resumo:`)
  console.log(`   ✅ Criados: ${created}`)
  console.log(`   🔄 Atualizados: ${updated}`)
  console.log(`   📝 Total: ${planos.length}`)
  console.log('\n✅ Catálogo de planos configurado com sucesso!')

  const distDefaults: Record<
    Extract<Plano, 'FREE' | 'BASIC' | 'PREMIUM'>,
    { monthlyOpportunityQuota: number; batchSize: number; priorityWeight: number; acceptanceWindowMinutes: number }
  > = {
    FREE: { monthlyOpportunityQuota: 30, batchSize: 20, priorityWeight: 0, acceptanceWindowMinutes: 720 },
    BASIC: { monthlyOpportunityQuota: 80, batchSize: 35, priorityWeight: 10, acceptanceWindowMinutes: 1440 },
    PREMIUM: { monthlyOpportunityQuota: 200, batchSize: 50, priorityWeight: 25, acceptanceWindowMinutes: 1440 },
  }

  for (const codigo of ['FREE', 'BASIC', 'PREMIUM'] as const) {
    const pl = await prisma.planos.findUnique({ where: { codigo } })
    if (!pl) continue
    const d = distDefaults[codigo]
    await prisma.planDistributionRule.upsert({
      where: { planId: pl.id },
      create: {
        id: nanoid(),
        planId: pl.id,
        monthlyOpportunityQuota: d.monthlyOpportunityQuota,
        batchSize: d.batchSize,
        priorityWeight: d.priorityWeight,
        acceptanceWindowMinutes: d.acceptanceWindowMinutes,
        updatedAt: new Date(),
      },
      update: {
        updatedAt: new Date(),
      },
    })
    console.log(`✅ Regra de distribuição: ${codigo}`)
  }
}

seedPlanos()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
