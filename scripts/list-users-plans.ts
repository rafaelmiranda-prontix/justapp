#!/usr/bin/env tsx
/**
 * Script para listar todos os advogados e seus planos
 *
 * Uso:
 *   npx tsx scripts/list-users-plans.ts [plano]
 *
 * Exemplos:
 *   npx tsx scripts/list-users-plans.ts              # Lista todos
 *   npx tsx scripts/list-users-plans.ts FREE         # Apenas FREE
 *   npx tsx scripts/list-users-plans.ts PREMIUM      # Apenas PREMIUM
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  const filtroPlano = args[0]?.toUpperCase()

  console.log('👥 Listando Advogados e Seus Planos\n')

  const advogados = await prisma.advogados.findMany({
    where: filtroPlano ? { plano: filtroPlano as any } : {},
    include: {
      users: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { plano: 'asc' },
      { users: { name: 'asc' } },
    ],
  })

  if (advogados.length === 0) {
    console.log('❌ Nenhum advogado encontrado')
    if (filtroPlano) {
      console.log(`   Filtro aplicado: Plano ${filtroPlano}`)
    }
    return
  }

  // Agrupar por plano
  const porPlano = advogados.reduce(
    (acc, adv) => {
      if (!acc[adv.plano]) {
        acc[adv.plano] = []
      }
      acc[adv.plano].push(adv)
      return acc
    },
    {} as Record<string, typeof advogados>
  )

  // Estatísticas gerais
  console.log('📊 Estatísticas:')
  console.log(`   Total de advogados: ${advogados.length}`)
  Object.entries(porPlano).forEach(([plano, advs]) => {
    console.log(`   ${plano}: ${advs.length} advogado(s)`)
  })
  console.log()

  // Listar por plano
  Object.entries(porPlano).forEach(([plano, advs]) => {
    console.log(`\n🏷️  Plano ${plano} (${advs.length})`)
    console.log('─'.repeat(80))

    advs.forEach((adv, idx) => {
      console.log(`\n${idx + 1}. ${adv.users.name}`)
      console.log(`   Email: ${adv.users.email}`)
      console.log(`   OAB: ${adv.oab}`)
      console.log(`   Leads: ${adv.leadsRecebidosMes}/${adv.leadsLimiteMes === -1 ? '∞' : adv.leadsLimiteMes}`)
      console.log(`   Cidade: ${adv.cidade}, ${adv.estado}`)
      console.log(`   Onboarding: ${adv.onboardingCompleted ? '✅' : '❌'}`)

      if (adv.stripeCustomerId) {
        console.log(`   Stripe Customer ID: ${adv.stripeCustomerId}`)
      }
      if (adv.planoExpira) {
        const expira = new Date(adv.planoExpira)
        const hoje = new Date()
        const diasRestantes = Math.ceil((expira.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
        console.log(`   Expira em: ${expira.toLocaleDateString('pt-BR')} (${diasRestantes} dias)`)
      }
    })
  })

  console.log('\n' + '─'.repeat(80))
  console.log('\n💡 Dica: Use "npx tsx scripts/change-user-plan.ts <email> <plano>" para alterar')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Erro:', e.message)
    await prisma.$disconnect()
    process.exit(1)
  })
