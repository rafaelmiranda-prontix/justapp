import { NextResponse } from 'next/server'
import { getAllPlans } from '@/lib/plans'

export async function GET() {
  try {
    const allPlans = await getAllPlans()

    // Filtrar planos ocultos
    const visiblePlans = Object.fromEntries(
      Object.entries(allPlans).filter(([_, plan]) => plan.status !== 'HIDDEN')
    )

    return NextResponse.json({
      success: true,
      data: visiblePlans,
    })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    )
  }
}
