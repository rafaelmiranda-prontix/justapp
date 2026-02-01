#!/usr/bin/env tsx
/**
 * Script para alterar o plano de um advogado
 *
 * Uso:
 *   npx tsx scripts/change-user-plan.ts <email-do-advogado> <novo-plano>
 *
 * Exemplos:
 *   npx tsx scripts/change-user-plan.ts advogado@example.com PREMIUM
 *   npx tsx scripts/change-user-plan.ts advogado@example.com UNLIMITED
 *   npx tsx scripts/change-user-plan.ts advogado@example.com FREE
 */

import { PrismaClient } from '@prisma/client'
import { updateAdvogadoPlan } from '../src/lib/subscription-service'
import { getPlanConfig, type PlanType } from '../src/lib/plans'

const prisma = new PrismaClient()

const VALID_PLANS: PlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'UNLIMITED']

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('❌ Uso incorreto!')
    console.log('\nUso:')
    console.log('  npx tsx scripts/change-user-plan.ts <email-do-advogado> <novo-plano>')
    console.log('\nExemplos:')
    console.log('  npx tsx scripts/change-user-plan.ts advogado@example.com PREMIUM')
    console.log('  npx tsx scripts/change-user-plan.ts advogado@example.com UNLIMITED')
    console.log('\nPlanos válidos: FREE, BASIC, PREMIUM, UNLIMITED')
    process.exit(1)
  }

  const [email, novoPlanoCodigo] = args
  const novoplano = novoPlanoCodigo.toUpperCase() as PlanType

  // Validar plano
  if (!VALID_PLANS.includes(novoplano)) {
    console.error(`❌ Plano inválido: ${novoPlanoCodigo}`)
    console.log(`Planos válidos: ${VALID_PLANS.join(', ')}`)
    process.exit(1)
  }

  console.log(`🔍 Buscando advogado: ${email}\n`)

  // Buscar usuário e advogado
  const user = await prisma.users.findUnique({
    where: { email },
    include: {
      advogados: true,
    },
  })

  if (!user) {
    console.error(`❌ Usuário não encontrado: ${email}`)
    process.exit(1)
  }

  if (!user.advogados) {
    console.error(`❌ Usuário não é advogado: ${email}`)
    process.exit(1)
  }

  const advogado = user.advogados

  console.log('📋 Informações do Advogado:')
  console.log(`   Nome: ${user.name}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   OAB: ${advogado.oab}`)
  console.log(`   Plano Atual: ${advogado.plano}`)
  console.log(`   Leads Recebidos: ${advogado.leadsRecebidosMes}/${advogado.leadsLimiteMes}`)

  if (advogado.plano === novoplano) {
    console.log(`\n⚠️  O advogado já está no plano ${novoplano}`)
    process.exit(0)
  }

  // Buscar configuração do novo plano
  const planoConfig = await getPlanConfig(novoplano)

  console.log(`\n🔄 Alterando plano de ${advogado.plano} para ${novoplano}...`)
  console.log(`   Novo limite de leads: ${planoConfig.leadsPerMonth === -1 ? 'Ilimitado' : planoConfig.leadsPerMonth}`)

  // Atualizar plano
  await updateAdvogadoPlan(advogado.id, novoplano)

  console.log('\n✅ Plano alterado com sucesso!')

  // Buscar dados atualizados
  const advogadoAtualizado = await prisma.advogados.findUnique({
    where: { id: advogado.id },
  })

  if (advogadoAtualizado) {
    console.log('\n📊 Situação Atualizada:')
    console.log(`   Plano: ${advogadoAtualizado.plano}`)
    console.log(`   Limite de Leads: ${advogadoAtualizado.leadsLimiteMes === -1 ? 'Ilimitado' : advogadoAtualizado.leadsLimiteMes}`)
    console.log(`   Leads Recebidos: ${advogadoAtualizado.leadsRecebidosMes}`)
  }

  // Mostrar histórico
  const historico = await prisma.historicoAssinaturas.findMany({
    where: { advogadoId: advogado.id },
    include: { planos: true },
    orderBy: { inicioEm: 'desc' },
    take: 3,
  })

  if (historico.length > 0) {
    console.log('\n📜 Histórico de Assinaturas (últimas 3):')
    historico.forEach((h, idx) => {
      console.log(`   ${idx + 1}. ${h.planos.nome} - ${h.status}`)
      console.log(`      Início: ${h.inicioEm.toLocaleDateString('pt-BR')}`)
      if (h.fimEm) {
        console.log(`      Fim: ${h.fimEm.toLocaleDateString('pt-BR')}`)
      }
    })
  }

  console.log('\n✨ Operação concluída!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('\n❌ Erro:', e.message)
    await prisma.$disconnect()
    process.exit(1)
  })
