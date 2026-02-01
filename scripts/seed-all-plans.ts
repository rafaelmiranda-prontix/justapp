import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding all plans...')

  // Plano FREE
  console.log('📝 Creating/updating FREE plan...')
  const freePlan = await prisma.planos.upsert({
    where: { codigo: 'FREE' },
    update: {
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
      ativo: true,
      status: 'ACTIVE',
      ordem: 1,
      updatedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      codigo: 'FREE',
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
      ativo: true,
      status: 'ACTIVE',
      ordem: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  console.log('✅ FREE plan:', freePlan.id)

  // Plano BASIC
  console.log('📝 Creating/updating BASIC plan...')
  const basicPlan = await prisma.planos.upsert({
    where: { codigo: 'BASIC' },
    update: {
      nome: 'Básico',
      descricao: 'Plano ideal para advogados iniciantes',
      preco: 9900,
      precoDisplay: 99,
      leadsPerMonth: 10,
      features: [
        'Leads qualificados por mês',
        'Perfil completo destacado',
        'Suporte por email',
        'Dashboard de métricas',
        'Avaliações de clientes',
      ],
      ativo: true,
      status: 'COMING_SOON',
      ordem: 2,
      updatedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      codigo: 'BASIC',
      nome: 'Básico',
      descricao: 'Plano ideal para advogados iniciantes',
      preco: 9900,
      precoDisplay: 99,
      leadsPerMonth: 10,
      features: [
        'Leads qualificados por mês',
        'Perfil completo destacado',
        'Suporte por email',
        'Dashboard de métricas',
        'Avaliações de clientes',
      ],
      ativo: true,
      status: 'COMING_SOON',
      ordem: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  console.log('✅ BASIC plan:', basicPlan.id)

  // Plano PREMIUM
  console.log('📝 Creating/updating PREMIUM plan...')
  const premiumPlan = await prisma.planos.upsert({
    where: { codigo: 'PREMIUM' },
    update: {
      nome: 'Premium',
      descricao: 'Plano completo para profissionais estabelecidos',
      preco: 29900,
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
      ativo: true,
      status: 'COMING_SOON',
      ordem: 3,
      updatedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      codigo: 'PREMIUM',
      nome: 'Premium',
      descricao: 'Plano completo para profissionais estabelecidos',
      preco: 29900,
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
      ativo: true,
      status: 'COMING_SOON',
      ordem: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  console.log('✅ PREMIUM plan:', premiumPlan.id)

  // Plano UNLIMITED
  console.log('📝 Creating/updating UNLIMITED plan...')
  const unlimitedPlan = await prisma.planos.upsert({
    where: { codigo: 'UNLIMITED' },
    update: {
      nome: 'Ilimitado',
      descricao: 'Plano personalizado para grandes volumes',
      preco: 0,
      precoDisplay: 0,
      leadsPerMonth: -1,
      features: [
        'Leads ilimitados',
        'Perfil destacado premium',
        'Suporte prioritário dedicado',
        'Dashboard avançado com BI',
        'Relatórios personalizados',
        'Gerente de conta exclusivo',
        'Integração API',
      ],
      ativo: true,
      status: 'HIDDEN',
      ordem: 4,
      updatedAt: new Date(),
    },
    create: {
      id: crypto.randomUUID(),
      codigo: 'UNLIMITED',
      nome: 'Ilimitado',
      descricao: 'Plano personalizado para grandes volumes',
      preco: 0,
      precoDisplay: 0,
      leadsPerMonth: -1,
      features: [
        'Leads ilimitados',
        'Perfil destacado premium',
        'Suporte prioritário dedicado',
        'Dashboard avançado com BI',
        'Relatórios personalizados',
        'Gerente de conta exclusivo',
        'Integração API',
      ],
      ativo: true,
      status: 'HIDDEN',
      ordem: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  console.log('✅ UNLIMITED plan:', unlimitedPlan.id)

  console.log('\n📊 All plans:')
  const allPlans = await prisma.planos.findMany({
    orderBy: { ordem: 'asc' },
  })

  allPlans.forEach((plan) => {
    console.log(
      `  ${plan.codigo.padEnd(10)} | ${plan.nome.padEnd(15)} | Status: ${plan.status.padEnd(15)} | Leads: ${String(plan.leadsPerMonth).padEnd(5)} | R$ ${plan.precoDisplay}`
    )
  })

  console.log('\n✅ All plans seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
