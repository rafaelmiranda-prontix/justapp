import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning up old plan configurations...\n')

  // Remover configurações antigas de planos
  const oldConfigKeys = [
    'free_plan_monthly_leads',
    'basic_plan_monthly_leads',
    'premium_plan_monthly_leads',
  ]

  console.log('Checking for old configurations...')
  const oldConfigs = await prisma.configuracoes.findMany({
    where: {
      chave: {
        in: oldConfigKeys,
      },
    },
  })

  if (oldConfigs.length === 0) {
    console.log('✅ No old configurations found. Database is clean!')
    return
  }

  console.log(`\n📋 Found ${oldConfigs.length} old configuration(s):`)
  oldConfigs.forEach((config) => {
    console.log(`  - ${config.chave}: ${config.valor}`)
  })

  console.log('\n🗑️  Deleting old configurations...')
  const result = await prisma.configuracoes.deleteMany({
    where: {
      chave: {
        in: oldConfigKeys,
      },
    },
  })

  console.log(`✅ Deleted ${result.count} configuration(s)`)
  console.log('\n💡 Plan limits are now managed in the "planos" table')
  console.log('   Use: npx tsx scripts/seed-all-plans.ts')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
