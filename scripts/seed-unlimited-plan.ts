import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding UNLIMITED plan and updating plan statuses...')

  // Atualizar status dos planos BASIC e PREMIUM para COMING_SOON
  console.log('📝 Updating BASIC and PREMIUM plans to COMING_SOON...')

  await prisma.planos.updateMany({
    where: {
      codigo: {
        in: ['BASIC', 'PREMIUM'],
      },
    },
    data: {
      status: 'COMING_SOON',
    },
  })

  console.log('✅ Updated BASIC and PREMIUM plans')

  // Atualizar plano FREE para ACTIVE (se necessário)
  await prisma.planos.updateMany({
    where: {
      codigo: 'FREE',
    },
    data: {
      status: 'ACTIVE',
    },
  })

  console.log('✅ Updated FREE plan to ACTIVE')

  // Inserir ou atualizar plano UNLIMITED
  console.log('📝 Creating/updating UNLIMITED plan...')

  const unlimitedPlan = await prisma.planos.upsert({
    where: {
      codigo: 'UNLIMITED',
    },
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

  console.log('✅ UNLIMITED plan created/updated:', unlimitedPlan.id)

  // Listar todos os planos
  console.log('\n📊 Current plans:')
  const allPlans = await prisma.planos.findMany({
    orderBy: { ordem: 'asc' },
  })

  allPlans.forEach((plan) => {
    console.log(
      `  - ${plan.codigo} (${plan.nome}): status=${plan.status}, ativo=${plan.ativo}, ordem=${plan.ordem}`
    )
  })

  console.log('\n✅ Seed completed successfully!')
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
