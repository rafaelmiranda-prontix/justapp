import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email.service'
import { checkRateLimit, getClientIP, RateLimitPresets } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  try {
    // Rate limiting por IP
    const clientIP = getClientIP(req)
    const rateLimit = checkRateLimit(`signup:cidadao:${clientIP}`, RateLimitPresets.SIGNUP)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Muitas tentativas de cadastro. Aguarde antes de tentar novamente.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': RateLimitPresets.SIGNUP.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
          },
        }
      )
    }

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
      logger.info(`[Signup] Activation email sent`)
    } catch (emailError) {
      // Log mas não falha a request - usuário foi criado com sucesso
      logger.error('[Signup] Email send failed:', emailError)
      logger.debug(
        `[Signup] Activation link: ${process.env.NEXTAUTH_URL}/auth/activate?token=[REDACTED]`
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
    logger.error('Erro ao criar cidadão:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}
