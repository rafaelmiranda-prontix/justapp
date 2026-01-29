import { NextResponse } from 'next/server'
import { PLANS } from '@/lib/plans'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: Object.entries(PLANS).map(([key, plan]) => ({
        id: key,
        ...plan,
      })),
    })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    )
  }
}
