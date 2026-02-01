import { getAllPlans } from '../src/lib/plans'

async function main() {
  console.log('🧪 Testing Plan Comparison Filtering...\n')

  const allPlans = await getAllPlans()

  console.log('1️⃣ All plans from database:')
  Object.entries(allPlans).forEach(([code, plan]) => {
    console.log(`   ${code}: status=${plan.status}, name=${plan.name}`)
  })

  // Simular filtro do componente PlanComparison
  const visiblePlans = Object.fromEntries(
    Object.entries(allPlans).filter(([_, plan]) => plan.status !== 'HIDDEN')
  )

  console.log('\n2️⃣ Visible plans in comparison table:')
  Object.entries(visiblePlans).forEach(([code, plan]) => {
    console.log(`   ${code}: status=${plan.status}, name=${plan.name}`)
  })

  console.log('\n3️⃣ Verification:')
  console.log(`   ✓ Total plans: ${Object.keys(allPlans).length}`)
  console.log(`   ✓ Visible plans: ${Object.keys(visiblePlans).length}`)
  console.log(`   ✓ UNLIMITED hidden: ${!visiblePlans.UNLIMITED}`)
  console.log(`   ✓ FREE visible: ${!!visiblePlans.FREE}`)
  console.log(`   ✓ BASIC visible: ${!!visiblePlans.BASIC}`)
  console.log(`   ✓ PREMIUM visible: ${!!visiblePlans.PREMIUM}`)

  if (!visiblePlans.UNLIMITED && visiblePlans.FREE && visiblePlans.BASIC && visiblePlans.PREMIUM) {
    console.log('\n✅ Plan Comparison filtering working correctly!')
  } else {
    console.log('\n❌ Plan Comparison filtering NOT working correctly!')
    process.exit(1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
