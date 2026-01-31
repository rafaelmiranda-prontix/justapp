import { prisma } from '../src/lib/prisma'
import { ConfigService } from '../src/lib/config-service'

/**
 * Script para corrigir leadsLimiteMes dos advogados
 * baseado nas configurações do banco de dados
 */
async function fixLeadsLimits() {
  console.log('🔧 Corrigindo limites de leads dos advogados...\n')

  // Buscar configurações
  const [freeLimits, basicLimits, premiumLimits] = await Promise.all([
    ConfigService.get<number>('free_plan_monthly_leads', 3),
    ConfigService.get<number>('basic_plan_monthly_leads', 10),
    ConfigService.get<number>('premium_plan_monthly_leads', 50),
  ])

  console.log('📋 Limites configurados:')
  console.log(`   FREE: ${freeLimits} leads/mês`)
  console.log(`   BASIC: ${basicLimits} leads/mês`)
  console.log(`   PREMIUM: ${premiumLimits} leads/mês\n`)

  const limitsMap = {
    FREE: freeLimits,
    BASIC: basicLimits,
    PREMIUM: premiumLimits,
  }

  // Buscar todos os advogados
  const advogados = await prisma.advogados.findMany({
    include: {
      users: true,
    },
  })

  console.log(`👨‍⚖️  Advogados encontrados: ${advogados.length}\n`)

  let updated = 0
  let skipped = 0

  for (const advogado of advogados) {
    const limiteCorreto = limitsMap[advogado.plano]

    if (advogado.leadsLimiteMes !== limiteCorreto) {
      console.log(`🔄 Atualizando: ${advogado.users.name}`)
      console.log(`   Plano: ${advogado.plano}`)
      console.log(`   Limite Atual: ${advogado.leadsLimiteMes} → Novo: ${limiteCorreto}`)

      await prisma.advogados.update({
        where: { id: advogado.id },
        data: {
          leadsLimiteMes: limiteCorreto,
          updatedAt: new Date(),
        },
      })

      updated++
    } else {
      console.log(`✅ Correto: ${advogado.users.name} (${advogado.plano}: ${advogado.leadsLimiteMes})`)
      skipped++
    }
  }

  console.log('\n📊 Resumo:')
  console.log(`   🔄 Atualizados: ${updated}`)
  console.log(`   ✅ Já corretos: ${skipped}`)
  console.log(`   📝 Total: ${advogados.length}`)

  if (updated > 0) {
    console.log('\n✅ Limites de leads corrigidos com sucesso!')
  } else {
    console.log('\n✅ Todos os advogados já estavam com limites corretos!')
  }
}

fixLeadsLimits()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
