import { prisma } from '../src/lib/prisma'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function cleanDatabase() {
  console.log('⚠️  ATENÇÃO: LIMPEZA DO BANCO DE DADOS\n')
  console.log('Este script irá DELETAR dados do banco de dados.')
  console.log('Escolha o que deseja limpar:\n')

  console.log('1. 🧪 Limpar TUDO (reset completo)')
  console.log('2. 👨‍⚖️  Limpar apenas Advogados de teste')
  console.log('3. 📋 Limpar apenas Casos e Matches')
  console.log('4. 💬 Limpar apenas Sessões Anônimas')
  console.log('5. ⚙️  Limpar apenas Configurações')
  console.log('6. ❌ Cancelar\n')

  const choice = await question('Escolha uma opção (1-6): ')

  switch (choice.trim()) {
    case '1':
      await cleanAll()
      break
    case '2':
      await cleanLawyers()
      break
    case '3':
      await cleanCasosAndMatches()
      break
    case '4':
      await cleanAnonymousSessions()
      break
    case '5':
      await cleanConfigs()
      break
    case '6':
      console.log('❌ Operação cancelada')
      break
    default:
      console.log('❌ Opção inválida')
  }

  rl.close()
}

async function cleanAll() {
  const confirm = await question(
    '\n⚠️  Isso vai DELETAR TODOS OS DADOS! Tem certeza? (digite "SIM" para confirmar): '
  )

  if (confirm.trim().toUpperCase() !== 'SIM') {
    console.log('❌ Operação cancelada')
    return
  }

  console.log('\n🗑️  Limpando banco de dados...\n')

  try {
    // Ordem correta devido às foreign keys
    console.log('1. Deletando Mensagens...')
    const mensagens = await prisma.mensagens.deleteMany()
    console.log(`   ✅ ${mensagens.count} mensagens deletadas`)

    console.log('2. Deletando Avaliações...')
    const avaliacoes = await prisma.avaliacoes.deleteMany()
    console.log(`   ✅ ${avaliacoes.count} avaliações deletadas`)

    console.log('3. Deletando Matches...')
    const matches = await prisma.matches.deleteMany()
    console.log(`   ✅ ${matches.count} matches deletados`)

    console.log('4. Deletando Casos...')
    const casos = await prisma.casos.deleteMany()
    console.log(`   ✅ ${casos.count} casos deletados`)

    console.log('5. Deletando Sessões Anônimas...')
    const anonymousSessions = await prisma.anonymousSession.deleteMany()
    console.log(`   ✅ ${anonymousSessions.count} sessões anônimas deletadas`)

    console.log('6. Deletando Especialidades dos Advogados...')
    const advEsp = await prisma.advogado_especialidades.deleteMany()
    console.log(`   ✅ ${advEsp.count} relações deletadas`)

    console.log('7. Deletando Advogados...')
    const advogados = await prisma.advogados.deleteMany()
    console.log(`   ✅ ${advogados.count} advogados deletados`)

    console.log('8. Deletando Cidadãos...')
    const cidadaos = await prisma.cidadaos.deleteMany()
    console.log(`   ✅ ${cidadaos.count} cidadãos deletados`)

    console.log('9. Deletando Sessions (NextAuth)...')
    const sessions = await prisma.sessions.deleteMany()
    console.log(`   ✅ ${sessions.count} sessions deletadas`)

    console.log('10. Deletando Accounts (NextAuth)...')
    const accounts = await prisma.accounts.deleteMany()
    console.log(`   ✅ ${accounts.count} accounts deletadas`)

    console.log('11. Deletando Users...')
    const users = await prisma.users.deleteMany()
    console.log(`   ✅ ${users.count} users deletados`)

    console.log('12. Deletando Especialidades...')
    const especialidades = await prisma.especialidades.deleteMany()
    console.log(`   ✅ ${especialidades.count} especialidades deletadas`)

    console.log('13. Deletando Configurações...')
    const configs = await prisma.configuracoes.deleteMany()
    console.log(`   ✅ ${configs.count} configurações deletadas`)

    console.log('\n✅ Banco de dados limpo completamente!')
    console.log('\n💡 Próximos passos:')
    console.log('   npm run seed           # Popular dados novamente')
    console.log('   npm run db:studio      # Verificar no Prisma Studio')
  } catch (error) {
    console.error('\n❌ Erro ao limpar banco:', error)
  }
}

async function cleanLawyers() {
  const confirm = await question(
    '\n⚠️  Deletar todos os advogados e seus dados? (digite "SIM" para confirmar): '
  )

  if (confirm.trim().toUpperCase() !== 'SIM') {
    console.log('❌ Operação cancelada')
    return
  }

  console.log('\n🗑️  Limpando advogados...\n')

  try {
    // Buscar advogados primeiro para deletar users depois
    const advogados = await prisma.advogados.findMany({
      include: { users: true },
    })

    console.log(`📊 Encontrados ${advogados.length} advogados`)

    // Deletar mensagens dos matches desses advogados
    console.log('1. Deletando Mensagens de Matches...')
    const deletedMessages = await prisma.mensagens.deleteMany({
      where: {
        matches: {
          advogadoId: {
            in: advogados.map((a) => a.id),
          },
        },
      },
    })
    console.log(`   ✅ ${deletedMessages.count} mensagens deletadas`)

    console.log('2. Deletando Avaliações...')
    const deletedAvaliacoes = await prisma.avaliacoes.deleteMany({
      where: {
        advogadoId: {
          in: advogados.map((a) => a.id),
        },
      },
    })
    console.log(`   ✅ ${deletedAvaliacoes.count} avaliações deletadas`)

    console.log('3. Deletando Matches...')
    const deletedMatches = await prisma.matches.deleteMany({
      where: {
        advogadoId: {
          in: advogados.map((a) => a.id),
        },
      },
    })
    console.log(`   ✅ ${deletedMatches.count} matches deletados`)

    console.log('4. Deletando Especialidades...')
    const deletedEsp = await prisma.advogado_especialidades.deleteMany({
      where: {
        advogadoId: {
          in: advogados.map((a) => a.id),
        },
      },
    })
    console.log(`   ✅ ${deletedEsp.count} especialidades deletadas`)

    console.log('5. Deletando Advogados...')
    const deletedAdvogados = await prisma.advogados.deleteMany()
    console.log(`   ✅ ${deletedAdvogados.count} advogados deletados`)

    console.log('6. Deletando Users (role ADVOGADO)...')
    const deletedUsers = await prisma.users.deleteMany({
      where: {
        id: {
          in: advogados.map((a) => a.userId),
        },
      },
    })
    console.log(`   ✅ ${deletedUsers.count} users deletados`)

    console.log('\n✅ Advogados removidos com sucesso!')
    console.log('\n💡 Para criar novos advogados:')
    console.log('   npm run seed:lawyers')
  } catch (error) {
    console.error('\n❌ Erro ao limpar advogados:', error)
  }
}

async function cleanCasosAndMatches() {
  const confirm = await question(
    '\n⚠️  Deletar todos os casos e matches? (digite "SIM" para confirmar): '
  )

  if (confirm.trim().toUpperCase() !== 'SIM') {
    console.log('❌ Operação cancelada')
    return
  }

  console.log('\n🗑️  Limpando casos e matches...\n')

  try {
    console.log('1. Deletando Mensagens...')
    const mensagens = await prisma.mensagens.deleteMany()
    console.log(`   ✅ ${mensagens.count} mensagens deletadas`)

    console.log('2. Deletando Avaliações...')
    const avaliacoes = await prisma.avaliacoes.deleteMany()
    console.log(`   ✅ ${avaliacoes.count} avaliações deletadas`)

    console.log('3. Deletando Matches...')
    const matches = await prisma.matches.deleteMany()
    console.log(`   ✅ ${matches.count} matches deletados`)

    console.log('4. Deletando Casos...')
    const casos = await prisma.casos.deleteMany()
    console.log(`   ✅ ${casos.count} casos deletados`)

    console.log('\n✅ Casos e matches removidos com sucesso!')
  } catch (error) {
    console.error('\n❌ Erro ao limpar casos:', error)
  }
}

async function cleanAnonymousSessions() {
  const confirm = await question(
    '\n⚠️  Deletar todas as sessões anônimas? (digite "SIM" para confirmar): '
  )

  if (confirm.trim().toUpperCase() !== 'SIM') {
    console.log('❌ Operação cancelada')
    return
  }

  console.log('\n🗑️  Limpando sessões anônimas...\n')

  try {
    const sessions = await prisma.anonymousSession.deleteMany()
    console.log(`✅ ${sessions.count} sessões anônimas deletadas`)

    console.log('\n✅ Sessões anônimas removidas com sucesso!')
  } catch (error) {
    console.error('\n❌ Erro ao limpar sessões:', error)
  }
}

async function cleanConfigs() {
  const confirm = await question(
    '\n⚠️  Deletar todas as configurações? (digite "SIM" para confirmar): '
  )

  if (confirm.trim().toUpperCase() !== 'SIM') {
    console.log('❌ Operação cancelada')
    return
  }

  console.log('\n🗑️  Limpando configurações...\n')

  try {
    const configs = await prisma.configuracoes.deleteMany()
    console.log(`✅ ${configs.count} configurações deletadas`)

    console.log('\n✅ Configurações removidas com sucesso!')
    console.log('\n💡 Para recriar configurações:')
    console.log('   npm run seed:configs')
  } catch (error) {
    console.error('\n❌ Erro ao limpar configurações:', error)
  }
}

cleanDatabase()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect()
    process.exit(0)
  })
