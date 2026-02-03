import { prisma } from '../src/lib/prisma'
import { CaseDistributionService } from '../src/lib/case-distribution.service'
import { ConfigService } from '../src/lib/config-service'

/**
 * Script de teste para validar redistribuição de casos órfãos e recusados
 *
 * Cenários:
 * 1. Caso é criado PRIMEIRO, advogado é cadastrado DEPOIS
 * 2. Caso foi recusado e precisa ser redistribuído
 */
async function testRedistribution() {
  console.log('🧪 Testando redistribuição de casos órfãos e recusados\n')

  // 1. Verificar casos ABERTOS sem matches ou apenas com matches RECUSADOS/EXPIRADOS
  const todosCasosAbertos = await prisma.casos.findMany({
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
      matches: {
        include: {
          advogados: {
            include: {
              users: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  })

  // Filtrar casos que precisam de redistribuição:
  // - Sem matches
  // - Apenas com matches RECUSADOS ou EXPIRADOS
  // - Com matches ativos mas ainda pode receber mais (dentro do limite)
  const maxRedistributions = await ConfigService.getMaxRedistributionsPerCase()
  const maxMatches = await ConfigService.get<number>('max_matches_per_caso', 5)

  const casosOrfaos = todosCasosAbertos.filter((caso) => {
    const matchesAtivos = caso.matches.filter(
      (m) =>
        (m.status === 'PENDENTE' ||
          m.status === 'VISUALIZADO' ||
          m.status === 'ACEITO' ||
          m.status === 'CONTRATADO') &&
        (!m.expiresAt || m.expiresAt > new Date())
    )
    const matchesRecusados = caso.matches.filter((m) => m.status === 'RECUSADO')
    const matchesAceitos = caso.matches.filter(
      (m) => m.status === 'ACEITO' || m.status === 'CONTRATADO'
    )

    // Caso precisa redistribuição se:
    // 1. Não tem matches ativos E (não tem matches ou só tem recusados)
    // 2. Tem matches ativos mas ainda pode receber mais (dentro do limite) E não tem aceitos
    const semMatchesAtivos = matchesAtivos.length === 0
    const soMatchesRecusados =
      caso.matches.length > 0 && matchesRecusados.length === caso.matches.length
    const podeReceberMais =
      matchesAtivos.length < maxMatches &&
      matchesAceitos.length === 0 &&
      caso.redistribuicoes < maxRedistributions

    return (
      (semMatchesAtivos && (caso.matches.length === 0 || soMatchesRecusados)) ||
      (podeReceberMais && matchesRecusados.length > 0)
    )
  })

  console.log(`📋 Casos ABERTOS que precisam redistribuição: ${casosOrfaos.length}`)

  if (casosOrfaos.length > 0) {
    console.log('\n📌 Casos que precisam redistribuição:')
    casosOrfaos.forEach((caso) => {
      const matchesAtivos = caso.matches.filter(
        (m) =>
          (m.status === 'PENDENTE' ||
            m.status === 'VISUALIZADO' ||
            m.status === 'ACEITO' ||
            m.status === 'CONTRATADO') &&
          (!m.expiresAt || m.expiresAt > new Date())
      )
      const matchesRecusados = caso.matches.filter((m) => m.status === 'RECUSADO')
      const matchesAceitos = caso.matches.filter(
        (m) => m.status === 'ACEITO' || m.status === 'CONTRATADO'
      )

      console.log(`   - ${caso.id.substring(0, 12)}...`)
      console.log(`     Cidadão: ${caso.cidadaos.users.name}`)
      console.log(`     Estado: ${caso.cidadaos.estado}`)
      console.log(`     Especialidade: ${caso.especialidades?.nome || 'Não definida'}`)
      console.log(`     Redistribuições: ${caso.redistribuicoes}/${maxRedistributions}`)
      console.log(`     Matches: ${caso.matches.length} total`)
      console.log(`       ✅ Ativos: ${matchesAtivos.length}`)
      console.log(`       ❌ Recusados: ${matchesRecusados.length}`)
      console.log(`       ✓ Aceitos: ${matchesAceitos.length}`)
      
      if (matchesRecusados.length > 0) {
        console.log(`     Advogados que recusaram:`)
        matchesRecusados.forEach((match) => {
          console.log(`       - ${match.advogados.users.name} (${match.advogados.users.email})`)
        })
      }
      console.log('')
    })
  }

  // 2. Verificar advogados disponíveis (apenas aprovados)
  const advogados = await prisma.advogados.findMany({
    where: {
      users: {
        status: 'ACTIVE',
      },
      onboardingCompleted: true,
      aprovado: true, // Apenas advogados aprovados
    },
    include: {
      users: true,
      matches: {
        where: { status: 'PENDENTE' },
      },
      advogado_especialidades: {
        include: {
          especialidades: true,
        },
      },
    },
  })

  console.log(`\n👨‍⚖️  Advogados ativos: ${advogados.length}`)

  if (advogados.length > 0) {
    console.log('\n📊 Advogados disponíveis:')
    advogados.forEach((adv) => {
      const pendentes = adv.matches.length
      const quota = `${adv.leadsRecebidosMes}/${adv.leadsLimiteMes}`
      const especialidades = adv.advogado_especialidades
        .map((e) => e.especialidades.nome)
        .join(', ')

      console.log(`   - ${adv.users.name}`)
      console.log(`     Estado: ${adv.estado}`)
      console.log(`     Plano: ${adv.plano}`)
      console.log(`     Leads: ${quota}`)
      console.log(`     Pendentes: ${pendentes}`)
      console.log(`     Especialidades: ${especialidades || 'Nenhuma'}`)
      console.log('')
    })
  }

  // 3. Testar redistribuição para cada advogado
  if (casosOrfaos.length > 0 && advogados.length > 0) {
    console.log('\n🔄 Testando redistribuição...\n')

    for (const advogado of advogados) {
      console.log(`📌 Advogado: ${advogado.users.name}`)

      const result = await CaseDistributionService.redistributeCasesForLawyer(advogado.id)

      console.log(`   ✅ Casos distribuídos: ${result.casosDistribuidos}`)
      console.log(`   ✅ Matches criados: ${result.matchesCriados}`)

      if (result.matchesCriados > 0) {
        // Buscar matches criados
        const matches = await prisma.matches.findMany({
          where: {
            advogadoId: advogado.id,
            status: 'PENDENTE',
          },
          include: {
            casos: {
              include: {
                cidadaos: {
                  include: {
                    users: true,
                  },
                },
                especialidades: true,
              },
            },
          },
          orderBy: {
            enviadoEm: 'desc',
          },
          take: 3,
        })

        console.log(`\n   📋 Últimos matches criados:`)
        matches.forEach((match) => {
          console.log(`      - ${match.casos.descricao.substring(0, 50)}...`)
          console.log(`        Score: ${match.score}%`)
          console.log(`        Cidadão: ${match.casos.cidadaos.users.name}`)
        })
      }
      console.log('')
    }
  }

  // 4. Status final - verificar casos que ainda precisam redistribuição
  const casosAindaPrecisam = await prisma.casos.findMany({
    where: {
      status: 'ABERTO',
    },
    include: {
      matches: true,
    },
  })

  const casosAindaOrfaos = casosAindaPrecisam.filter((caso) => {
    const matchesAtivos = caso.matches.filter(
      (m) =>
        (m.status === 'PENDENTE' ||
          m.status === 'VISUALIZADO' ||
          m.status === 'ACEITO' ||
          m.status === 'CONTRATADO') &&
        (!m.expiresAt || m.expiresAt > new Date())
    )
    const matchesRecusados = caso.matches.filter((m) => m.status === 'RECUSADO')
    const matchesAceitos = caso.matches.filter(
      (m) => m.status === 'ACEITO' || m.status === 'CONTRATADO'
    )

    const semMatchesAtivos = matchesAtivos.length === 0
    const soMatchesRecusados =
      caso.matches.length > 0 && matchesRecusados.length === caso.matches.length
    const podeReceberMais =
      matchesAtivos.length < maxMatches &&
      matchesAceitos.length === 0 &&
      caso.redistribuicoes < maxRedistributions

    return (
      (semMatchesAtivos && (caso.matches.length === 0 || soMatchesRecusados)) ||
      (podeReceberMais && matchesRecusados.length > 0)
    )
  })

  console.log('\n📊 Resultado final:')
  console.log(`   Casos que ainda precisam redistribuição: ${casosAindaOrfaos.length}`)

  if (casosAindaOrfaos.length > 0) {
    console.log(
      '\n⚠️  Ainda existem casos que precisam redistribuição. Possíveis motivos:'
    )
    console.log('   - Nenhum advogado no mesmo estado (e não aceita outros estados)')
    console.log('   - Todos os advogados atingiram limite de leads')
    console.log('   - Todos os advogados têm 2+ matches pendentes')
    console.log('   - Limite de redistribuições atingido')
    console.log('   - Todos os advogados compatíveis já recusaram o caso')
  } else if (casosOrfaos.length > 0) {
    console.log('\n✅ Todos os casos foram redistribuídos com sucesso!')
  } else {
    console.log('\n✅ Não havia casos que precisassem redistribuição')
  }
}

testRedistribution()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
