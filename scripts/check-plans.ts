import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const plans = await prisma.planos.findMany({
    orderBy: { ordem: 'asc' },
  })

  console.log(`Total plans in database: ${plans.length}\n`)

  plans.forEach((plan) => {
    console.log(`${plan.codigo}:`)
    console.log(`  Nome: ${plan.nome}`)
    console.log(`  Status: ${plan.status}`)
    console.log(`  Ativo: ${plan.ativo}`)
    console.log(`  Ordem: ${plan.ordem}`)
    console.log(`  Leads/mês: ${plan.leadsPerMonth}`)
    console.log(`  Preço: R$ ${plan.precoDisplay}`)
    console.log()
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
