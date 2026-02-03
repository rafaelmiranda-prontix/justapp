import { prisma } from '../src/lib/prisma'
import { ConfigService } from '../src/lib/config-service'

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

      // Verificar se tem capacidade (trata -1 como ilimitado)
      if (
        adv.leadsLimiteMes !== -1 &&
        adv.leadsLimiteMes < 999 &&
        adv.leadsRecebidosMes >= adv.leadsLimiteMes
      ) {
        console.log(`     ⚠️  Limite de leads atingido!`)
      } else if (adv.leadsLimiteMes === -1 || adv.leadsLimiteMes >= 999) {
        console.log(`     ✅ Plano ilimitado`)
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
      matches: {
        include: {
          advogados: {
            include: {
              users: true,
            },
          },
        },
      },
    },
  })

  console.log(`📋 Casos com status ABERTO:`, casosAbertos.length)

  if (casosAbertos.length === 0) {
    console.log('ℹ️  Não há casos com status ABERTO (podem estar PENDENTE_ATIVACAO)\n')
  } else {
    console.log('\nCasos ABERTOS:')
    for (const caso of casosAbertos) {
      const matchesRecusados = caso.matches.filter((m) => m.status === 'RECUSADO')
      const matchesAtivos = caso.matches.filter(
        (m) => m.status === 'PENDENTE' || m.status === 'VISUALIZADO'
      )
      const matchesAceitos = caso.matches.filter((m) => m.status === 'ACEITO' || m.status === 'CONTRATADO')

      console.log(`   - Caso ${caso.id}`)
      console.log(`     Cidadão: ${caso.cidadaos.users.name} (${caso.cidadaos.users.email})`)
      console.log(`     Especialidade: ${caso.especialidades?.nome || 'Não definida'}`)
      console.log(`     Cidade/Estado: ${caso.cidadaos.cidade || 'N/A'}, ${caso.cidadaos.estado || 'N/A'}`)
      console.log(`     Urgência: ${caso.urgencia}`)
      console.log(`     Redistribuições: ${caso.redistribuicoes}`)
      console.log(`     Matches: ${caso.matches.length} total`)
      console.log(`       ✅ Aceitos/Contratados: ${matchesAceitos.length}`)
      console.log(`       ⏳ Pendentes/Visualizados: ${matchesAtivos.length}`)
      console.log(`       ❌ Recusados: ${matchesRecusados.length}`)
      
      if (matchesRecusados.length > 0) {
        console.log(`       Advogados que recusaram:`)
        for (const match of matchesRecusados) {
          console.log(`         - ${match.advogados.users.name} (${match.advogados.users.email})`)
        }
      }
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
  console.log(`✓ Advogados com capacidade: ${advogados.filter(a => {
    // Trata -1 e >= 999 como ilimitado
    if (a.leadsLimiteMes === -1 || a.leadsLimiteMes >= 999) return true
    return a.leadsRecebidosMes < a.leadsLimiteMes
  }).length}`)
  console.log(`✓ Casos ABERTOS: ${casosAbertos.length}`)
  console.log(`✓ Casos PENDENTE_ATIVACAO: ${casosPendentes.length}`)
  console.log(`✓ Matches criados: ${matches.length}`)

  console.log('\n=== PROBLEMAS IDENTIFICADOS ===')

  if (advogados.length === 0) {
    console.log('❌ Não há advogados ativos com onboarding completo')
  }

  const advogadosComCapacidade = advogados.filter(a => {
    // Trata -1 e >= 999 como ilimitado
    if (a.leadsLimiteMes === -1 || a.leadsLimiteMes >= 999) return true
    return a.leadsRecebidosMes < a.leadsLimiteMes
  })
  
  if (advogadosComCapacidade.length === 0 && advogados.length > 0) {
    console.log('❌ Todos os advogados atingiram o limite de leads')
  }

  if (casosAbertos.length > 0 && matches.length === 0) {
    console.log('❌ Há casos ABERTOS mas nenhum match foi criado')
    console.log('   Verifique se o serviço de distribuição está sendo chamado')
  }

  if (casosPendentes.length > 0) {
    console.log(`⚠️  ${casosPendentes.length} caso(s) aguardando ativação do usuário`)
  }

  // 6. Analisar casos recusados que precisam ser redistribuídos
  console.log('\n=== ANÁLISE DE CASOS RECUSADOS ===')
  
  const maxRedistributions = await ConfigService.getMaxRedistributionsPerCase()
  const maxMatches = await ConfigService.get<number>('max_matches_per_caso', 5)
  
  console.log(`📊 Configurações:`)
  console.log(`   - Máximo de redistribuições por caso: ${maxRedistributions}`)
  console.log(`   - Máximo de matches por caso: ${maxMatches}\n`)

  const casosComRecusas = casosAbertos.filter((caso) => {
    const matchesRecusados = caso.matches.filter((m) => m.status === 'RECUSADO')
    return matchesRecusados.length > 0
  })

  console.log(`📋 Casos ABERTOS com recusas: ${casosComRecusas.length}`)

  if (casosComRecusas.length === 0) {
    console.log('✅ Nenhum caso precisa ser redistribuído\n')
  } else {
    const casosPrecisamRedistribuicao: Array<{
      caso: typeof casosComRecusas[0]
      motivo: string
      podeRedistribuir: boolean
      advogadosRecusaram: string[]
      matchesAtivos: number
      slotsDisponiveis: number
    }> = []

    for (const caso of casosComRecusas) {
      const matchesRecusados = caso.matches.filter((m) => m.status === 'RECUSADO')
      const matchesAtivos = caso.matches.filter(
        (m) => m.status === 'PENDENTE' || m.status === 'VISUALIZADO'
      )
      const matchesAceitos = caso.matches.filter(
        (m) => m.status === 'ACEITO' || m.status === 'CONTRATADO'
      )

      // Verificar se pode ser redistribuído
      const podeRedistribuir =
        caso.redistribuicoes < maxRedistributions &&
        matchesAtivos.length < maxMatches &&
        matchesAceitos.length === 0

      const slotsDisponiveis = maxMatches - matchesAtivos.length
      const advogadosRecusaram = matchesRecusados.map((m) => m.advogados.id)

      let motivo = ''
      if (caso.redistribuicoes >= maxRedistributions) {
        motivo = `Limite de redistribuições atingido (${caso.redistribuicoes}/${maxRedistributions})`
      } else if (matchesAceitos.length > 0) {
        motivo = 'Caso já tem advogado aceito/contratado'
      } else if (matchesAtivos.length >= maxMatches) {
        motivo = `Limite de matches ativos atingido (${matchesAtivos.length}/${maxMatches})`
      } else {
        motivo = 'Pode ser redistribuído'
      }

      casosPrecisamRedistribuicao.push({
        caso,
        motivo,
        podeRedistribuir,
        advogadosRecusaram,
        matchesAtivos: matchesAtivos.length,
        slotsDisponiveis,
      })
    }

    console.log(`\n📊 Casos que precisam de redistribuição: ${casosPrecisamRedistribuicao.filter((c) => c.podeRedistribuir).length}`)
    console.log(`📊 Casos que não podem ser redistribuídos: ${casosPrecisamRedistribuicao.filter((c) => !c.podeRedistribuir).length}\n`)

    for (const item of casosPrecisamRedistribuicao) {
      const { caso, motivo, podeRedistribuir, advogadosRecusaram, matchesAtivos, slotsDisponiveis } = item
      
      console.log(`   ${podeRedistribuir ? '🟡' : '🔴'} Caso ${caso.id.substring(0, 8)}...`)
      console.log(`      Cidadão: ${caso.cidadaos.users.name}`)
      console.log(`      Especialidade: ${caso.especialidades?.nome || 'Não definida'}`)
      console.log(`      Localização: ${caso.cidadaos.cidade || 'N/A'}, ${caso.cidadaos.estado || 'N/A'}`)
      console.log(`      Redistribuições: ${caso.redistribuicoes}/${maxRedistributions}`)
      console.log(`      Matches ativos: ${matchesAtivos}/${maxMatches}`)
      console.log(`      Slots disponíveis: ${slotsDisponiveis}`)
      console.log(`      Advogados que recusaram: ${advogadosRecusaram.length}`)
      
      if (advogadosRecusaram.length > 0) {
        const advogadosRecusaramInfo = await prisma.advogados.findMany({
          where: { id: { in: advogadosRecusaram } },
          include: { users: { select: { name: true, email: true } } },
        })
        for (const adv of advogadosRecusaramInfo) {
          console.log(`         - ${adv.users.name} (${adv.users.email})`)
        }
      }
      
      console.log(`      Status: ${podeRedistribuir ? '✅ PODE SER REDISTRIBUÍDO' : `❌ ${motivo}`}`)
      console.log('')
    }

    // Verificar se há advogados disponíveis para redistribuição
    const casosQuePodemRedistribuir = casosPrecisamRedistribuicao.filter((c) => c.podeRedistribuir)
    
    if (casosQuePodemRedistribuir.length > 0) {
      console.log('\n🔍 Verificando advogados disponíveis para redistribuição...\n')
      
      for (const item of casosQuePodemRedistribuir) {
        const { caso, advogadosRecusaram } = item
        
        // Buscar advogados aprovados e ativos
        const advogadosDisponiveis = await prisma.advogados.findMany({
          where: {
            users: {
              status: 'ACTIVE',
            },
            onboardingCompleted: true,
            aprovado: true,
            id: {
              notIn: advogadosRecusaram, // Excluir advogados que recusaram
            },
            // Verificar se já tem match com este caso
            matches: {
              none: {
                casoId: caso.id,
              },
            },
          },
          include: {
            users: { select: { name: true, email: true } },
            advogado_especialidades: {
              include: {
                especialidades: true,
              },
            },
          },
        })

        // Filtrar por capacidade (leads)
        const advogadosComCapacidade = advogadosDisponiveis.filter((adv) => {
          if (adv.leadsLimiteMes === -1 || adv.leadsLimiteMes >= 999) return true
          return adv.leadsRecebidosMes < adv.leadsLimiteMes
        })

        // Filtrar por especialidade (se o caso tem especialidade)
        let advogadosComEspecialidade = advogadosComCapacidade
        if (caso.especialidadeId) {
          advogadosComEspecialidade = advogadosComCapacidade.filter((adv) =>
            adv.advogado_especialidades.some(
              (ae) => ae.especialidadeId === caso.especialidadeId
            )
          )
        }

        // Filtrar por localização (mesmo estado ou aceita outros estados)
        const advogadosComLocalizacao = advogadosComEspecialidade.filter((adv) => {
          if (!caso.cidadaos.estado) return true // Se não tem estado, aceita todos
          if (adv.aceitaOutrosEstados) return true
          return adv.estado === caso.cidadaos.estado
        })

        console.log(`   📋 Caso ${caso.id.substring(0, 8)}...`)
        console.log(`      Advogados disponíveis (total): ${advogadosDisponiveis.length}`)
        console.log(`      Com capacidade: ${advogadosComCapacidade.length}`)
        console.log(`      Com especialidade: ${advogadosComEspecialidade.length}`)
        console.log(`      Com localização compatível: ${advogadosComLocalizacao.length}`)
        
        if (advogadosComLocalizacao.length === 0) {
          console.log(`      ⚠️  Nenhum advogado disponível para redistribuição deste caso`)
        } else {
          console.log(`      ✅ ${advogadosComLocalizacao.length} advogado(s) disponível(is) para redistribuição`)
          if (advogadosComLocalizacao.length > 0 && advogadosComLocalizacao.length <= 5) {
            console.log(`      Advogados candidatos:`)
            for (const adv of advogadosComLocalizacao.slice(0, 5)) {
              console.log(`         - ${adv.users.name} (${adv.users.email})`)
              console.log(`           ${adv.cidade}, ${adv.estado} | Plano: ${adv.plano}`)
            }
          }
        }
        console.log('')
      }
    }
  }

  console.log('')
}

checkDistribution()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
