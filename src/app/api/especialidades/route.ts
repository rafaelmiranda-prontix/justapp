import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const especialidades = await prisma.especialidades.findMany({
      orderBy: {
        nome: 'asc',
      },
      select: {
        id: true,
        nome: true,
        slug: true,
        descricao: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: especialidades,
    })
  } catch (error) {
    console.error('Erro ao buscar especialidades:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar especialidades' },
      { status: 500 }
    )
  }
}
