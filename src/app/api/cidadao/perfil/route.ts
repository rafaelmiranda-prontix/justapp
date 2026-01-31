import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar cidadão com todas as informações necessárias
    const cidadao = await prisma.cidadaos.findUnique({
      where: { userId: session.user.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            status: true,
          },
        },
        casos: {
          select: {
            id: true,
            status: true,
          },
        },
        avaliacoes: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!cidadao) {
      return NextResponse.json({ error: 'Cidadão não encontrado' }, { status: 404 })
    }

    // Estatísticas
    const totalCasos = cidadao.casos.length
    const casosAbertos = cidadao.casos.filter((c) => c.status === 'ABERTO' || c.status === 'EM_ANDAMENTO').length
    const totalAvaliacoes = cidadao.avaliacoes.length

    // Verificar se localização está completa (útil para matching)
    const localizacaoCompleta = !!(cidadao.cidade && cidadao.estado)

    return NextResponse.json({
      success: true,
      data: {
        id: cidadao.id,
        userId: cidadao.userId,
        cidade: cidadao.cidade,
        estado: cidadao.estado,
        latitude: cidadao.latitude,
        longitude: cidadao.longitude,
        user: cidadao.users,
        localizacaoCompleta,
        estatisticas: {
          totalCasos,
          casosAbertos,
          totalAvaliacoes,
        },
      },
    })
  } catch (error) {
    console.error('Erro ao buscar perfil do cidadão:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const {
      cidade,
      estado,
      latitude,
      longitude,
      phone,
    } = body

    // Validar coordenadas se fornecidas
    if (latitude !== undefined && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
      return NextResponse.json(
        { error: 'Latitude inválida' },
        { status: 400 }
      )
    }

    if (longitude !== undefined && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
      return NextResponse.json(
        { error: 'Longitude inválida' },
        { status: 400 }
      )
    }

    // Buscar cidadão atual
    const cidadaoAtual = await prisma.cidadaos.findUnique({
      where: { userId: session.user.id },
      include: {
        users: true,
      },
    })

    if (!cidadaoAtual) {
      return NextResponse.json({ error: 'Cidadão não encontrado' }, { status: 404 })
    }

    // Atualizar dados do cidadão
    const cidadaoAtualizado = await prisma.cidadaos.update({
      where: { id: cidadaoAtual.id },
      data: {
        ...(cidade !== undefined && { cidade }),
        ...(estado !== undefined && { estado }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        updatedAt: new Date(),
      },
    })

    // Atualizar telefone do usuário se fornecido
    if (phone !== undefined) {
      await prisma.users.update({
        where: { id: session.user.id },
        data: {
          phone,
          updatedAt: new Date(),
        },
      })
    }

    // Buscar dados atualizados
    const cidadaoCompleto = await prisma.cidadaos.findUnique({
      where: { id: cidadaoAtual.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            status: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: cidadaoCompleto!.id,
        cidade: cidadaoCompleto!.cidade,
        estado: cidadaoCompleto!.estado,
        latitude: cidadaoCompleto!.latitude,
        longitude: cidadaoCompleto!.longitude,
        user: cidadaoCompleto!.users,
      },
    })
  } catch (error) {
    console.error('Erro ao atualizar perfil do cidadão:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    )
  }
}
