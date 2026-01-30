import { NextResponse } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = signupSchema.parse(body)

    // Verificar se email já existe
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await hash(data.password, 12)
    const now = new Date()

    // Criar usuário + cidadão
    const user = await prisma.users.create({
      data: {
        id: nanoid(),
        email: data.email,
        name: data.name,
        phone: data.phone,
        password: hashedPassword,
        role: 'CIDADAO',
        updatedAt: now,
        cidadaos: {
          create: {
            id: nanoid(),
            updatedAt: now,
          },
        },
      },
      include: {
        cidadaos: true,
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
      },
    })
  } catch (error) {
    console.error('Erro ao criar cidadão:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}
