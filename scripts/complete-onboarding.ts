import { prisma } from '../src/lib/prisma'

const advogadoId = process.argv[2]

if (!advogadoId) {
  console.error('❌ Erro: ID do advogado não fornecido')
  console.log('Uso: npx tsx scripts/complete-onboarding.ts <advogadoId>')
  process.exit(1)
}

async function completeOnboarding() {
  console.log(`🔧 Completando onboarding para advogado: ${advogadoId}\n`)

  try {
    // Buscar advogado
    const advogado = await prisma.advogados.findUnique({
      where: { id: advogadoId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        advogado_especialidades: {
          include: {
            especialidades: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    })

    if (!advogado) {
      console.error(`❌ Advogado não encontrado: ${advogadoId}`)
      process.exit(1)
    }

    console.log(`👤 Advogado: ${advogado.users.name} (${advogado.users.email})`)
    console.log(`   Status atual do onboarding: ${advogado.onboardingCompleted ? '✅ Completo' : '❌ Incompleto'}\n`)

    // Verificar se pode completar
    const missingFields: string[] = []

    if (!advogado.oab || advogado.oab.trim() === '') {
      missingFields.push('OAB')
    }

    if (!advogado.cidade || advogado.cidade.trim() === '') {
      missingFields.push('Cidade')
    }

    if (!advogado.estado || advogado.estado.trim() === '') {
      missingFields.push('Estado')
    }

    // Biografia não é mais obrigatória para completar onboarding
    // if (!advogado.bio || advogado.bio.trim() === '') {
    //   missingFields.push('Biografia')
    // }

    if (advogado.advogado_especialidades.length === 0) {
      missingFields.push('Especialidades')
    }

    // Verificar se conta está ativa (ACTIVE ou PRE_ACTIVE são aceitos)
    if (advogado.users.status !== 'ACTIVE' && advogado.users.status !== 'PRE_ACTIVE') {
      missingFields.push(`Conta não está ativa (status: ${advogado.users.status})`)
    }

    if (missingFields.length > 0) {
      console.error(`❌ Não é possível completar o onboarding. Campos faltando:`)
      missingFields.forEach((field) => {
        console.error(`   - ${field}`)
      })
      console.log('\n💡 Complete os campos faltantes primeiro.')
      process.exit(1)
    }

    // Completar onboarding e ativar conta se necessário
    const wasPreActive = advogado.users.status === 'PRE_ACTIVE'
    
    // Ativar conta se estiver em PRE_ACTIVE
    if (wasPreActive) {
      await prisma.users.update({
        where: { id: advogado.users.id },
        data: {
          status: 'ACTIVE',
          emailVerified: new Date(),
          updatedAt: new Date(),
        },
      })
      console.log('✅ Conta do advogado ativada (status alterado de PRE_ACTIVE para ACTIVE)')
    }

    // Completar onboarding
    await prisma.advogados.update({
      where: { id: advogadoId },
      data: {
        onboardingCompleted: true,
        updatedAt: new Date(),
      },
    })

    console.log('✅ Onboarding completado com sucesso!')
    console.log(`\n📋 Resumo:`)
    console.log(`   - OAB: ${advogado.oab}`)
    console.log(`   - Localização: ${advogado.cidade}, ${advogado.estado}`)
    console.log(`   - Biografia: ${advogado.bio ? 'Preenchida' : 'Não preenchida'}`)
    console.log(`   - Especialidades: ${advogado.advogado_especialidades.map((e) => e.especialidades.nome).join(', ')}`)
    console.log(`   - Status da conta: ${wasPreActive ? 'ACTIVE (ativada agora)' : advogado.users.status}`)
    console.log(`\n💡 O advogado agora pode receber casos (se aprovado pelo admin).`)
  } catch (error) {
    console.error('❌ Erro ao completar onboarding:', error)
    process.exit(1)
  }
}

completeOnboarding()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro:', error)
    process.exit(1)
  })
