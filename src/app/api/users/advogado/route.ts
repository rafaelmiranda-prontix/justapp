import { NextResponse } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { validateOAB } from '@/lib/utils'

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  oab: z.string().refine((val) => validateOAB(val), {
    message: 'Número OAB inválido',
  }),
  cidade: z.string().min(2),
  estado: z.string().length(2),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = signupSchema.parse(body)

    // Normalizar OAB (remover espaços e pontos)
    const oabNormalizado = data.oab.replace(/[^A-Z0-9]/gi, '').toUpperCase()

    // Verificar se email já existe
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }

    // Verificar se OAB já existe
    const existingOAB = await prisma.advogados.findUnique({
      where: { oab: oabNormalizado },
    })

    if (existingOAB) {
      return NextResponse.json({ error: 'Número OAB já cadastrado' }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await hash(data.password, 12)
    const now = new Date()

    // Criar usuário + advogado
    const user = await prisma.users.create({
      data: {
        id: nanoid(),
        email: data.email,
        name: data.name,
        phone: data.phone,
        password: hashedPassword,
        role: 'ADVOGADO',
        updatedAt: now,
        advogados: {
          create: {
            id: nanoid(),
            oab: oabNormalizado,
            cidade: data.cidade,
            estado: data.estado.toUpperCase(),
            updatedAt: now,
          },
        },
      },
      include: {
        advogados: true,
      },
    })

    // Retornar sem a senha
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        advogado: {
          id: user.advogado?.id,
          oab: user.advogado?.oab,
          cidade: user.advogado?.cidade,
          estado: user.advogado?.estado,
        },
      },
    })
  } catch (error) {
    console.error('Erro ao criar advogado:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}
