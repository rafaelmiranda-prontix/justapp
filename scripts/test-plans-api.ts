import { getAllPlans } from '../src/lib/plans'

async function main() {
  console.log('🧪 Testing Plans API Logic...\n')

  // Testar getAllPlans (retorna todos os planos incluindo HIDDEN)
  console.log('1️⃣ Testing getAllPlans() - should return all plans including HIDDEN:')
  const allPlans = await getAllPlans()

  console.log(`   Total plans: ${Object.keys(allPlans).length}`)
  Object.entries(allPlans).forEach(([code, plan]) => {
    console.log(`   - ${code}: status=${plan.status}, name=${plan.name}`)
  })

  // Testar filtro (simular o que a API faz)
  console.log('\n2️⃣ Testing API filter - should exclude HIDDEN plans:')
  const visiblePlans = Object.fromEntries(
    Object.entries(allPlans).filter(([_, plan]) => plan.status !== 'HIDDEN')
  )

  console.log(`   Visible plans: ${Object.keys(visiblePlans).length}`)
  Object.entries(visiblePlans).forEach(([code, plan]) => {
    console.log(`   - ${code}: status=${plan.status}, name=${plan.name}`)
  })

  // Verificar se UNLIMITED está oculto
  console.log('\n3️⃣ Verification:')
  console.log(`   ✓ UNLIMITED in allPlans: ${!!allPlans.UNLIMITED}`)
  console.log(`   ✓ UNLIMITED in visiblePlans: ${!!visiblePlans.UNLIMITED}`)
  console.log(`   ✓ FREE is ACTIVE: ${allPlans.FREE?.status === 'ACTIVE'}`)
  console.log(`   ✓ BASIC is COMING_SOON: ${allPlans.BASIC?.status === 'COMING_SOON'}`)
  console.log(`   ✓ PREMIUM is COMING_SOON: ${allPlans.PREMIUM?.status === 'COMING_SOON'}`)
  console.log(`   ✓ UNLIMITED is HIDDEN: ${allPlans.UNLIMITED?.status === 'HIDDEN'}`)

  console.log('\n✅ Test completed!')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
