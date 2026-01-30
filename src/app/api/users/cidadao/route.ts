import { NextResponse } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email.service'

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

    // Gerar token de ativação
    const activationToken = nanoid(32)
    const activationExpires = new Date()
    activationExpires.setHours(activationExpires.getHours() + 48) // 48h para ativar

    // Criar usuário + cidadão com status PRE_ACTIVE
    const user = await prisma.users.create({
      data: {
        id: nanoid(),
        email: data.email.toLowerCase(),
        name: data.name,
        phone: data.phone,
        password: hashedPassword,
        role: 'CIDADAO',
        status: 'PRE_ACTIVE',
        activationToken,
        activationExpires,
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

    // Enviar email de ativação
    try {
      await EmailService.sendActivationEmail(user.email, user.name, activationToken)
      console.log(`[Signup] Activation email sent to: ${user.email}`)
    } catch (emailError) {
      // Log mas não falha a request - usuário foi criado com sucesso
      console.error('[Signup] Email send failed:', emailError)
      console.log(
        `[Signup] Activation link: ${process.env.NEXTAUTH_URL}/auth/activate?token=${activationToken}`
      )
    }

    // Retornar sem a senha
    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso! Verifique seu email para ativar sua conta.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        activationRequired: true,
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
