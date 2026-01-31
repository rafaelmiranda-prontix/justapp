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

    // Buscar advogado com todas as informações necessárias
    const advogado = await prisma.advogados.findUnique({
      where: { userId: session.user.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          },
        },
        advogado_especialidades: {
          include: {
            especialidades: {
              select: {
                id: true,
                nome: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!advogado) {
      return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    }

    // Verificar o que está faltando para receber casos
    const missingFields: string[] = []
    
    if (!advogado.oab) {
      missingFields.push('Número OAB')
    }
    
    if (!advogado.cidade || !advogado.estado) {
      missingFields.push('Cidade e Estado')
    }
    
    if (!advogado.bio) {
      missingFields.push('Biografia')
    }
    
    if (advogado.advogado_especialidades.length === 0) {
      missingFields.push('Pelo menos uma especialidade')
    }
    
    // Nota: onboardingCompleted é marcado automaticamente quando todos os campos acima estão preenchidos
    // Não precisa aparecer como campo faltando separado
    
    if (advogado.users.status !== 'ACTIVE') {
      missingFields.push('Conta ativada')
    }

    // Verificar se pode receber casos
    const canReceiveCases = 
      advogado.users.status === 'ACTIVE' &&
      advogado.onboardingCompleted &&
      advogado.oab &&
      advogado.cidade &&
      advogado.estado &&
      advogado.bio &&
      advogado.advogado_especialidades.length > 0

    return NextResponse.json({
      success: true,
      data: {
        id: advogado.id,
        userId: advogado.userId,
        oab: advogado.oab,
        oabVerificado: advogado.oabVerificado,
        bio: advogado.bio,
        fotoUrl: advogado.fotoUrl,
        cidade: advogado.cidade,
        estado: advogado.estado,
        latitude: advogado.latitude,
        longitude: advogado.longitude,
        raioAtuacao: advogado.raioAtuacao,
        precoConsulta: advogado.precoConsulta,
        aceitaOnline: advogado.aceitaOnline,
        plano: advogado.plano,
        planoExpira: advogado.planoExpira,
        leadsRecebidosMes: advogado.leadsRecebidosMes,
        leadsLimiteMes: advogado.leadsLimiteMes,
        onboardingCompleted: advogado.onboardingCompleted,
        user: advogado.users,
        especialidades: advogado.advogado_especialidades.map((ae) => ({
          id: ae.especialidades.id,
          nome: ae.especialidades.nome,
          slug: ae.especialidades.slug,
        })),
        missingFields,
        canReceiveCases,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar perfil do advogado:', error)
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
      oab,
      bio,
      fotoUrl,
      cidade,
      estado,
      latitude,
      longitude,
      raioAtuacao,
      precoConsulta,
      aceitaOnline,
      especialidades,
    } = body

    // Buscar advogado atual
    const advogadoAtual = await prisma.advogados.findUnique({
      where: { userId: session.user.id },
      include: {
        advogado_especialidades: {
          select: {
            especialidadeId: true,
          },
        },
      },
    })

    if (!advogadoAtual) {
      return NextResponse.json({ error: 'Advogado não encontrado' }, { status: 404 })
    }

    // Verificar se todos os campos obrigatórios estão preenchidos
    const oabFinal = oab !== undefined ? oab : advogadoAtual.oab
    const bioFinal = bio !== undefined ? bio : advogadoAtual.bio
    const cidadeFinal = cidade !== undefined ? cidade : advogadoAtual.cidade
    const estadoFinal = estado !== undefined ? estado : advogadoAtual.estado
    const especialidadesFinal = especialidades && Array.isArray(especialidades) ? especialidades : advogadoAtual.advogado_especialidades.map((ae) => ae.especialidadeId)

    const allFieldsComplete = 
      oabFinal &&
      bioFinal &&
      cidadeFinal &&
      estadoFinal &&
      especialidadesFinal.length > 0

    // Atualizar dados básicos
    const advogadoAtualizado = await prisma.advogados.update({
      where: { id: advogadoAtual.id },
      data: {
        ...(oab !== undefined && { oab }),
        ...(bio !== undefined && { bio }),
        ...(fotoUrl !== undefined && { fotoUrl }),
        ...(cidade !== undefined && { cidade }),
        ...(estado !== undefined && { estado }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(raioAtuacao !== undefined && { raioAtuacao }),
        ...(precoConsulta !== undefined && { precoConsulta }),
        ...(aceitaOnline !== undefined && { aceitaOnline }),
        ...(allFieldsComplete && { onboardingCompleted: true }),
        updatedAt: new Date(),
      },
    })

    // Atualizar especialidades se fornecidas
    if (especialidades && Array.isArray(especialidades)) {
      // Remover todas as especialidades atuais
      await prisma.advogado_especialidades.deleteMany({
        where: { advogadoId: advogadoAtual.id },
      })

      // Adicionar novas especialidades
      if (especialidades.length > 0) {
        await prisma.advogado_especialidades.createMany({
          data: especialidades.map((espId: string) => ({
            advogadoId: advogadoAtual.id,
            especialidadeId: espId,
          })),
        })
      }
    }

    // Buscar dados atualizados
    const advogadoCompleto = await prisma.advogados.findUnique({
      where: { id: advogadoAtual.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          },
        },
        advogado_especialidades: {
          include: {
            especialidades: {
              select: {
                id: true,
                nome: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: advogadoCompleto!.id,
        oab: advogadoCompleto!.oab,
        oabVerificado: advogadoCompleto!.oabVerificado,
        bio: advogadoCompleto!.bio,
        fotoUrl: advogadoCompleto!.fotoUrl,
        cidade: advogadoCompleto!.cidade,
        estado: advogadoCompleto!.estado,
        latitude: advogadoCompleto!.latitude,
        longitude: advogadoCompleto!.longitude,
        raioAtuacao: advogadoCompleto!.raioAtuacao,
        precoConsulta: advogadoCompleto!.precoConsulta,
        aceitaOnline: advogadoCompleto!.aceitaOnline,
        plano: advogadoCompleto!.plano,
        user: advogadoCompleto!.users,
        especialidades: advogadoCompleto!.advogado_especialidades.map((ae) => ({
          id: ae.especialidades.id,
          nome: ae.especialidades.nome,
          slug: ae.especialidades.slug,
        })),
      },
    })
  } catch (error) {
    console.error('Erro ao atualizar perfil do advogado:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    )
  }
}
