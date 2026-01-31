import { prisma } from '../src/lib/prisma'
import { CaseDistributionService } from '../src/lib/case-distribution.service'

/**
 * Script de teste para validar redistribuição de casos órfãos
 *
 * Cenário:
 * 1. Caso é criado PRIMEIRO
 * 2. Advogado é cadastrado DEPOIS
 * 3. Sistema deve distribuir o caso quando advogado logar
 */
async function testRedistribution() {
  console.log('🧪 Testando redistribuição de casos órfãos\n')

  // 1. Verificar casos ABERTOS sem matches
  const casosOrfaos = await prisma.casos.findMany({
    where: {
      status: 'ABERTO',
      matches: {
        none: {},
      },
    },
    include: {
      cidadaos: {
        include: {
          users: true,
        },
      },
      especialidades: true,
    },
  })

  console.log(`📋 Casos ABERTOS sem matches: ${casosOrfaos.length}`)

  if (casosOrfaos.length > 0) {
    console.log('\n📌 Casos órfãos encontrados:')
    casosOrfaos.forEach((caso) => {
      console.log(`   - ${caso.id}`)
      console.log(`     Cidadão: ${caso.cidadaos.users.name}`)
      console.log(`     Estado: ${caso.cidadaos.estado}`)
      console.log(`     Especialidade: ${caso.especialidades?.nome || 'Não definida'}`)
      console.log('')
    })
  }

  // 2. Verificar advogados disponíveis
  const advogados = await prisma.advogados.findMany({
    where: {
      users: {
        status: 'ACTIVE',
      },
      onboardingCompleted: true,
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

  // 4. Status final
  const casosAindaOrfaos = await prisma.casos.count({
    where: {
      status: 'ABERTO',
      matches: {
        none: {},
      },
    },
  })

  console.log('\n📊 Resultado final:')
  console.log(`   Casos ainda sem matches: ${casosAindaOrfaos}`)

  if (casosAindaOrfaos > 0) {
    console.log(
      '\n⚠️  Ainda existem casos sem matches. Possíveis motivos:'
    )
    console.log('   - Nenhum advogado no mesmo estado')
    console.log('   - Todos os advogados atingiram limite de leads')
    console.log('   - Todos os advogados têm 2+ matches pendentes')
  } else if (casosOrfaos.length > 0) {
    console.log('\n✅ Todos os casos órfãos foram distribuídos com sucesso!')
  } else {
    console.log('\n✅ Não havia casos órfãos para distribuir')
  }
}

testRedistribution()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
