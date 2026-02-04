import { prisma } from '../src/lib/prisma'

interface OnboardingAnalysis {
  advogadoId: string
  nome: string
  email: string
  onboardingCompleted: boolean
  userStatus: string
  missingFields: string[]
  issues: string[]
  canComplete: boolean
}

async function analyzeOnboarding() {
  console.log('=== Análise de Onboarding de Advogados ===\n')

  // Buscar todos os advogados
  const advogados = await prisma.advogados.findMany({
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
    orderBy: {
      createdAt: 'desc',
    },
  })

  console.log(`📊 Total de advogados: ${advogados.length}\n`)

  const analyses: OnboardingAnalysis[] = []

  for (const advogado of advogados) {
    const missingFields: string[] = []
    const issues: string[] = []

    // Verificar campos obrigatórios
    if (!advogado.oab || advogado.oab.trim() === '') {
      missingFields.push('OAB não preenchida')
    }

    if (!advogado.cidade || advogado.cidade.trim() === '') {
      missingFields.push('Cidade não preenchida')
    }

    if (!advogado.estado || advogado.estado.trim() === '') {
      missingFields.push('Estado não preenchido')
    }

    // Biografia não é mais obrigatória para completar onboarding
    // if (!advogado.bio || advogado.bio.trim() === '') {
    //   missingFields.push('Biografia não preenchida')
    // }

    if (advogado.advogado_especialidades.length === 0) {
      missingFields.push('Nenhuma especialidade cadastrada')
    }

    // Verificar status da conta (ACTIVE ou PRE_ACTIVE são aceitos)
    if (advogado.users.status !== 'ACTIVE' && advogado.users.status !== 'PRE_ACTIVE') {
      issues.push(`Conta não está ativa (status: ${advogado.users.status})`)
    }

    // Verificar se OAB foi verificada
    if (!advogado.oabVerificado && advogado.oab) {
      issues.push('OAB não verificada pelo admin')
    }

    // Verificar se foi aprovado pelo admin
    if (!advogado.aprovado) {
      issues.push('Não aprovado pelo admin')
    }

    // Verificar se pode completar onboarding
    // Biografia não é mais obrigatória
    const canComplete: boolean =
      Boolean(advogado.oab) &&
      Boolean(advogado.cidade) &&
      Boolean(advogado.estado) &&
      advogado.advogado_especialidades.length > 0 &&
      (advogado.users.status === 'ACTIVE' || advogado.users.status === 'PRE_ACTIVE')

    analyses.push({
      advogadoId: advogado.id,
      nome: advogado.users.name,
      email: advogado.users.email,
      onboardingCompleted: advogado.onboardingCompleted,
      userStatus: advogado.users.status,
      missingFields,
      issues,
      canComplete,
    })
  }

  // Separar por status
  const completed = analyses.filter((a) => a.onboardingCompleted)
  const incomplete = analyses.filter((a) => !a.onboardingCompleted)
  const canCompleteNow = incomplete.filter((a) => a.canComplete)

  console.log(`✅ Onboarding Completo: ${completed.length}`)
  console.log(`❌ Onboarding Incompleto: ${incomplete.length}`)
  console.log(`🔧 Pode Completar Agora: ${canCompleteNow.length}\n`)

  // Mostrar advogados com onboarding incompleto
  if (incomplete.length > 0) {
    console.log('='.repeat(80))
    console.log('📋 ADVOGADOS COM ONBOARDING INCOMPLETO\n')

    for (const analysis of incomplete) {
      console.log(`👤 ${analysis.nome} (${analysis.email})`)
      console.log(`   ID: ${analysis.advogadoId}`)
      console.log(`   Status da Conta: ${analysis.userStatus}`)
      console.log(`   Onboarding Completo: ${analysis.onboardingCompleted ? '✅ Sim' : '❌ Não'}`)

      if (analysis.missingFields.length > 0) {
        console.log(`   ⚠️  Campos Faltando:`)
        analysis.missingFields.forEach((field) => {
          console.log(`      - ${field}`)
        })
      }

      if (analysis.issues.length > 0) {
        console.log(`   ⚠️  Problemas:`)
        analysis.issues.forEach((issue) => {
          console.log(`      - ${issue}`)
        })
      }

      if (analysis.canComplete) {
        console.log(`   ✅ PODE COMPLETAR ONBOARDING AGORA!`)
        console.log(`      (Todos os campos obrigatórios estão preenchidos)`)
      } else {
        console.log(`   ❌ NÃO PODE COMPLETAR (faltam campos obrigatórios)`)
      }

      console.log('')
    }
  }

  // Mostrar advogados que podem completar agora
  if (canCompleteNow.length > 0) {
    console.log('='.repeat(80))
    console.log('🔧 ADVOGADOS QUE PODEM COMPLETAR ONBOARDING AGORA\n')

    for (const analysis of canCompleteNow) {
      console.log(`👤 ${analysis.nome} (${analysis.email})`)
      console.log(`   ID: ${analysis.advogadoId}`)
      console.log(`   Status: Todos os campos obrigatórios preenchidos`)
      
      if (analysis.issues.length > 0) {
        console.log(`   ⚠️  Observações:`)
        analysis.issues.forEach((issue) => {
          console.log(`      - ${issue}`)
        })
      }

      console.log(`   💡 Ação: Execute o comando abaixo para completar o onboarding:`)
      console.log(`      npx tsx scripts/complete-onboarding.ts ${analysis.advogadoId}\n`)
    }
  }

  // Estatísticas
  console.log('='.repeat(80))
  console.log('📊 ESTATÍSTICAS\n')

  const missingOAB = incomplete.filter((a) =>
    a.missingFields.some((f) => f.includes('OAB'))
  ).length
  const missingLocation = incomplete.filter((a) =>
    a.missingFields.some((f) => f.includes('Cidade') || f.includes('Estado'))
  ).length
  const missingBio = incomplete.filter((a) =>
    a.missingFields.some((f) => f.includes('Biografia'))
  ).length
  const missingSpecialties = incomplete.filter((a) =>
    a.missingFields.some((f) => f.includes('especialidade'))
  ).length
  const inactiveAccounts = incomplete.filter((a) => a.userStatus !== 'ACTIVE').length
  const unverifiedOAB = incomplete.filter((a) =>
    a.issues.some((i) => i.includes('OAB não verificada'))
  ).length
  const notApproved = incomplete.filter((a) =>
    a.issues.some((i) => i.includes('Não aprovado'))
  ).length

  console.log(`Campos Faltando:`)
  console.log(`   - OAB: ${missingOAB}`)
  console.log(`   - Localização (Cidade/Estado): ${missingLocation}`)
  console.log(`   - Biografia: ${missingBio}`)
  console.log(`   - Especialidades: ${missingSpecialties}`)
  console.log(`\nProblemas:`)
  console.log(`   - Contas não ativas: ${inactiveAccounts}`)
  console.log(`   - OAB não verificada: ${unverifiedOAB}`)
  console.log(`   - Não aprovado pelo admin: ${notApproved}`)

  console.log('\n' + '='.repeat(80))
  console.log('✅ Análise concluída!\n')
}

// Executar análise
analyzeOnboarding()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro ao analisar onboarding:', error)
    process.exit(1)
  })
