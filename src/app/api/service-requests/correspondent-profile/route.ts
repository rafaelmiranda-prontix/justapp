import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { OperationalServiceKind } from '@prisma/client'
import { getAdvogadoForUserId } from '@/lib/service-requests/access'

const kindEnum = z.nativeEnum(OperationalServiceKind)

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  minFeeCents: z.number().int().min(0).nullable().optional(),
  availabilityJson: z.record(z.unknown()).nullable().optional(),
  regions: z
    .array(
      z.object({
        id: z.string().optional(),
        cidade: z.string().max(200).nullable().optional(),
        estado: z.string().max(10).nullable().optional(),
        comarca: z.string().max(200).nullable().optional(),
        forum: z.string().max(200).nullable().optional(),
      })
    )
    .optional(),
  acceptedKinds: z.array(kindEnum).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const advogado = await getAdvogadoForUserId(session.user.id)
    if (!advogado) return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })

    let profile = await prisma.correspondentProfile.findUnique({
      where: { advogadoId: advogado.id },
      include: { regions: true, acceptedKinds: true },
    })
    if (!profile) {
      profile = await prisma.correspondentProfile.create({
        data: { advogadoId: advogado.id },
        include: { regions: true, acceptedKinds: true },
      })
    }

    const reviewAgg = await prisma.serviceReview.aggregate({
      where: { targetAdvogadoId: advogado.id },
      _avg: { rating: true },
      _count: { _all: true },
    })

    return NextResponse.json({
      profile,
      advogadoAprovado: advogado.aprovado,
      reputation: {
        averageRating: reviewAgg._avg.rating ?? null,
        reviewCount: reviewAgg._count._all,
      },
    })
  } catch (e) {
    console.error('[correspondent-profile GET]', e)
    return NextResponse.json({ error: 'Erro ao carregar perfil' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADVOGADO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const advogado = await getAdvogadoForUserId(session.user.id)
    if (!advogado) return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })

    const body = patchSchema.parse(await req.json())

    if (body.isActive === true && !advogado.aprovado) {
      return NextResponse.json(
        { error: 'Apenas advogados aprovados podem ativar o perfil de correspondente.' },
        { status: 403 }
      )
    }

    let profile = await prisma.correspondentProfile.findUnique({
      where: { advogadoId: advogado.id },
    })
    if (!profile) {
      profile = await prisma.correspondentProfile.create({
        data: { advogadoId: advogado.id },
      })
    }

    await prisma.$transaction(async (tx) => {
      const data: Prisma.CorrespondentProfileUpdateInput = {}
      if (body.isActive !== undefined) data.isActive = body.isActive
      if (body.minFeeCents !== undefined) data.minFeeCents = body.minFeeCents
      if (body.availabilityJson !== undefined) {
        data.availabilityJson =
          body.availabilityJson === null
            ? Prisma.DbNull
            : (body.availabilityJson as Prisma.InputJsonValue)
      }
      if (Object.keys(data).length > 0) {
        await tx.correspondentProfile.update({
          where: { id: profile!.id },
          data,
        })
      }

      if (body.regions) {
        await tx.correspondentRegion.deleteMany({ where: { profileId: profile!.id } })
        if (body.regions.length > 0) {
          await tx.correspondentRegion.createMany({
            data: body.regions.map((r) => ({
              profileId: profile!.id,
              cidade: r.cidade ?? null,
              estado: r.estado ?? null,
              comarca: r.comarca ?? null,
              forum: r.forum ?? null,
            })),
          })
        }
      }

      if (body.acceptedKinds) {
        await tx.correspondentAcceptedKind.deleteMany({ where: { profileId: profile!.id } })
        if (body.acceptedKinds.length > 0) {
          await tx.correspondentAcceptedKind.createMany({
            data: body.acceptedKinds.map((kind) => ({
              profileId: profile!.id,
              kind,
            })),
            skipDuplicates: true,
          })
        }
      }
    })

    const updated = await prisma.correspondentProfile.findUnique({
      where: { id: profile.id },
      include: { regions: true, acceptedKinds: true },
    })
    return NextResponse.json({ profile: updated })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? 'Dados inválidos' }, { status: 400 })
    }
    console.error('[correspondent-profile PATCH]', e)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
