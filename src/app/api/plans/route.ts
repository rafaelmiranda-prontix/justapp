import { NextResponse } from 'next/server'
import { getAllPlans } from '@/lib/plans'

export async function GET() {
  try {
    const plans = await getAllPlans()

    return NextResponse.json({
      success: true,
      data: plans,
    })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    )
  }
}
