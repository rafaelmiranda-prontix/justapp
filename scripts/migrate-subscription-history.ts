import { prisma } from '../src/lib/prisma'
import { createSubscriptionHistory } from '../src/lib/subscription-history.service'

/**
 * Script para criar histórico de assinaturas para advogados existentes
 */
async function migrateSubscriptionHistory() {
  console.log('📋 Criando histórico de assinaturas para advogados existentes...\n')

  // Buscar todos os advogados
  const advogados = await prisma.advogados.findMany({
    include: {
      users: true,
    },
  })

  console.log(`👨‍⚖️  Advogados encontrados: ${advogados.length}\n`)

  let created = 0
  let skipped = 0

  for (const advogado of advogados) {
    // Verificar se já tem histórico
    const hasHistory = await prisma.historicoAssinaturas.findFirst({
      where: { advogadoId: advogado.id },
    })

    if (hasHistory) {
      console.log(`⏭️  Já tem histórico: ${advogado.users.name}`)
      skipped++
      continue
    }

    // Buscar plano no catálogo
    const plano = await prisma.planos.findUnique({
      where: { codigo: advogado.plano },
    })

    if (!plano) {
      console.log(`❌ Plano ${advogado.plano} não encontrado no catálogo para ${advogado.users.name}`)
      skipped++
      continue
    }

    // Criar histórico
    try {
      await createSubscriptionHistory({
        advogadoId: advogado.id,
        planoId: plano.id,
        precoPago: plano.preco,
        leadsLimite: advogado.leadsLimiteMes,
        stripeSubscriptionId: advogado.stripeSubscriptionId || undefined,
      })

      console.log(`✅ Criado histórico: ${advogado.users.name} (${advogado.plano})`)
      created++
    } catch (error) {
      console.error(`❌ Erro ao criar histórico para ${advogado.users.name}:`, error)
      skipped++
    }
  }

  console.log('\n📊 Resumo:')
  console.log(`   ✅ Criados: ${created}`)
  console.log(`   ⏭️  Já existiam: ${skipped}`)
  console.log(`   📝 Total: ${advogados.length}`)

  if (created > 0) {
    console.log('\n✅ Histórico de assinaturas criado com sucesso!')
  } else {
    console.log('\n✅ Todos os advogados já tinham histórico!')
  }
}

migrateSubscriptionHistory()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
