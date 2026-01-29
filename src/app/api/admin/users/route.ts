import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware/admin'

export async function GET(req: Request) {
  try {
    const { error } = await requireAdmin()

    if (error) {
      return error
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') // 'all', 'CIDADAO', 'ADVOGADO', 'ADMIN'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    const where: any = {}

    if (role && role !== 'all') {
      where.role = role
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          cidadao: {
            select: {
              id: true,
              cidade: true,
              estado: true,
            },
          },
          advogado: {
            select: {
              id: true,
              oab: true,
              oabVerificado: true,
              cidade: true,
              estado: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    )
  }
}
