import { prisma } from '../src/lib/prisma'

async function checkDistribution() {
  console.log('=== Diagnóstico de Distribuição de Casos ===\n')

  // 1. Verificar advogados disponíveis
  const advogados = await prisma.advogados.findMany({
    where: {
      users: {
        status: 'ACTIVE',
      },
      onboardingCompleted: true,
    },
    include: {
      users: true,
      advogado_especialidades: {
        include: {
          especialidades: true,
        },
      },
    },
  })

  console.log(`📊 Advogados ATIVOS e COM ONBOARDING:`, advogados.length)

  if (advogados.length === 0) {
    console.log('❌ PROBLEMA: Não há advogados ativos com onboarding completo!')
    console.log('   Solução: Crie pelo menos 1 advogado para receber casos\n')
  } else {
    console.log('\n✅ Advogados disponíveis:')
    for (const adv of advogados) {
      console.log(`   - ${adv.users.name} (${adv.users.email})`)
      console.log(`     Plano: ${adv.plano}`)
      console.log(`     Leads: ${adv.leadsRecebidosMes}/${adv.leadsLimiteMes}`)
      console.log(`     Cidade/Estado: ${adv.cidade}, ${adv.estado}`)
      console.log(`     Especialidades: ${adv.advogado_especialidades.map(e => e.especialidades.nome).join(', ') || 'Nenhuma'}`)

      // Verificar se tem capacidade
      if (adv.leadsRecebidosMes >= adv.leadsLimiteMes) {
        console.log(`     ⚠️  Limite de leads atingido!`)
      }
      console.log('')
    }
  }

  // 2. Verificar casos ABERTOS
  const casosAbertos = await prisma.casos.findMany({
    where: {
      status: 'ABERTO',
    },
    include: {
      cidadaos: {
        include: {
          users: true,
        },
      },
      especialidades: true,
      matches: true,
    },
  })

  console.log(`📋 Casos com status ABERTO:`, casosAbertos.length)

  if (casosAbertos.length === 0) {
    console.log('ℹ️  Não há casos com status ABERTO (podem estar PENDENTE_ATIVACAO)\n')
  } else {
    console.log('\nCasos ABERTOS:')
    for (const caso of casosAbertos) {
      console.log(`   - Caso ${caso.id}`)
      console.log(`     Cidadão: ${caso.cidadaos.users.name} (${caso.cidadaos.users.email})`)
      console.log(`     Especialidade: ${caso.especialidades?.nome || 'Não definida'}`)
      console.log(`     Cidade/Estado: ${caso.cidadaos.cidade || 'N/A'}, ${caso.cidadaos.estado || 'N/A'}`)
      console.log(`     Urgência: ${caso.urgencia}`)
      console.log(`     Matches criados: ${caso.matches.length}`)
      console.log('')
    }
  }

  // 3. Verificar casos PENDENTE_ATIVACAO
  const casosPendentes = await prisma.casos.findMany({
    where: {
      status: 'PENDENTE_ATIVACAO',
    },
    include: {
      cidadaos: {
        include: {
          users: true,
        },
      },
    },
  })

  console.log(`📋 Casos PENDENTE_ATIVACAO:`, casosPendentes.length)

  if (casosPendentes.length > 0) {
    console.log('\n⚠️  Casos aguardando ativação:')
    for (const caso of casosPendentes) {
      console.log(`   - Caso ${caso.id}`)
      console.log(`     Cidadão: ${caso.cidadaos.users.name} (${caso.cidadaos.users.email})`)
      console.log(`     Status usuário: ${caso.cidadaos.users.status}`)
      console.log('')
    }
  }

  // 4. Verificar matches criados
  const matches = await prisma.matches.findMany({
    include: {
      advogados: {
        include: {
          users: true,
        },
      },
      casos: true,
    },
    orderBy: {
      enviadoEm: 'desc',
    },
    take: 10,
  })

  console.log(`🤝 Total de Matches:`, matches.length)

  if (matches.length === 0) {
    console.log('❌ PROBLEMA: Nenhum match foi criado ainda!')
    console.log('   Isso significa que a distribuição não está funcionando\n')
  } else {
    console.log('\nÚltimos 10 matches:')
    for (const match of matches) {
      console.log(`   - Match ${match.id}`)
      console.log(`     Caso: ${match.casoId}`)
      console.log(`     Advogado: ${match.advogados.users.name}`)
      console.log(`     Score: ${match.score}`)
      console.log(`     Status: ${match.status}`)
      console.log(`     Criado em: ${match.enviadoEm.toLocaleString('pt-BR')}`)
      console.log('')
    }
  }

  // 5. Resumo de diagnóstico
  console.log('\n=== RESUMO DO DIAGNÓSTICO ===')
  console.log(`✓ Advogados ativos: ${advogados.length}`)
  console.log(`✓ Advogados com capacidade: ${advogados.filter(a => a.leadsRecebidosMes < a.leadsLimiteMes).length}`)
  console.log(`✓ Casos ABERTOS: ${casosAbertos.length}`)
  console.log(`✓ Casos PENDENTE_ATIVACAO: ${casosPendentes.length}`)
  console.log(`✓ Matches criados: ${matches.length}`)

  console.log('\n=== PROBLEMAS IDENTIFICADOS ===')

  if (advogados.length === 0) {
    console.log('❌ Não há advogados ativos com onboarding completo')
  }

  if (advogados.filter(a => a.leadsRecebidosMes < a.leadsLimiteMes).length === 0 && advogados.length > 0) {
    console.log('❌ Todos os advogados atingiram o limite de leads')
  }

  if (casosAbertos.length > 0 && matches.length === 0) {
    console.log('❌ Há casos ABERTOS mas nenhum match foi criado')
    console.log('   Verifique se o serviço de distribuição está sendo chamado')
  }

  if (casosPendentes.length > 0) {
    console.log(`⚠️  ${casosPendentes.length} caso(s) aguardando ativação do usuário`)
  }

  console.log('')
}

checkDistribution()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
