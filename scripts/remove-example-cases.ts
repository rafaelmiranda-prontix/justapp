#!/usr/bin/env tsx

/**
 * Script para remover todos os casos de exemplo
 * 
 * Remove casos marcados com:
 * - Prefixo "[EXEMPLO]" na descricao
 * - sessionId com padrão "EXAMPLE_..."
 * 
 * Também remove os cidadãos de exemplo criados (opcional)
 */

import { prisma } from '../src/lib/prisma'

const EXAMPLE_MARKER = '[EXEMPLO]'
const EXAMPLE_SESSION_PREFIX = 'EXAMPLE_'
const EXAMPLE_EMAIL_PREFIX = 'exemplo.cidadao'

async function removeExampleCases() {
  console.log('🗑️  Removendo casos de exemplo...\n')

  try {
    // Buscar casos de exemplo
    const casosExemplo = await prisma.casos.findMany({
      where: {
        OR: [
          { descricao: { startsWith: EXAMPLE_MARKER } },
          { sessionId: { startsWith: EXAMPLE_SESSION_PREFIX } },
        ],
      },
      include: {
        matches: true,
      },
    })

    console.log(`📋 Encontrados ${casosExemplo.length} casos de exemplo`)

    if (casosExemplo.length === 0) {
      console.log('✅ Nenhum caso de exemplo encontrado')
      return
    }

    // Contar matches associados
    let totalMatches = 0
    const matchIds: string[] = []

    for (const caso of casosExemplo) {
      totalMatches += caso.matches.length
      matchIds.push(...caso.matches.map((m) => m.id))
    }

    // Contar mensagens associadas aos matches
    let totalMensagens = 0
    if (matchIds.length > 0) {
      totalMensagens = await prisma.mensagens.count({
        where: { matchId: { in: matchIds } },
      })
    }

    console.log(`📊 Estatísticas:`)
    console.log(`   - Casos: ${casosExemplo.length}`)
    console.log(`   - Matches associados: ${totalMatches}`)
    console.log(`   - Mensagens associadas: ${totalMensagens}`)

    // Remover em transação
    console.log('\n🗑️  Removendo...')

    await prisma.$transaction(async (tx) => {
      // Coletar todos os matchIds e casoIds primeiro
      const matchIds: string[] = []
      const casoIds: string[] = []
      
      for (const caso of casosExemplo) {
        casoIds.push(caso.id)
        matchIds.push(...caso.matches.map((m) => m.id))
      }

      // Remover mensagens primeiro (devido a foreign keys)
      if (matchIds.length > 0) {
        await tx.mensagens.deleteMany({
          where: { matchId: { in: matchIds } },
        })
      }

      // Remover todos os matches de uma vez
      if (casoIds.length > 0) {
        await tx.matches.deleteMany({
          where: { casoId: { in: casoIds } },
        })
      }

      // Remover casos
      await tx.casos.deleteMany({
        where: {
          OR: [
            { descricao: { startsWith: EXAMPLE_MARKER } },
            { sessionId: { startsWith: EXAMPLE_SESSION_PREFIX } },
          ],
        },
      })
    })

    console.log(`✅ ${casosExemplo.length} casos removidos com sucesso`)

    // Perguntar se quer remover cidadãos de exemplo também
    const cidadaosExemplo = await prisma.cidadaos.findMany({
      where: {
        users: {
          email: { startsWith: EXAMPLE_EMAIL_PREFIX },
        },
      },
      include: {
        casos: true,
      },
    })

    const cidadaosSemCasos = cidadaosExemplo.filter((c) => c.casos.length === 0)

    if (cidadaosSemCasos.length > 0) {
      console.log(`\n👥 Encontrados ${cidadaosSemCasos.length} cidadãos de exemplo sem casos`)
      console.log('   (Cidadãos com casos não serão removidos)')

      const userIds = cidadaosSemCasos.map((c) => c.userId)

      await prisma.$transaction(async (tx) => {
        // Remover cidadãos primeiro (devido a foreign keys)
        await tx.cidadaos.deleteMany({
          where: { userId: { in: userIds } },
        })

        // Remover usuários
        await tx.users.deleteMany({
          where: { id: { in: userIds } },
        })
      })

      console.log(`✅ ${cidadaosSemCasos.length} cidadãos de exemplo removidos`)
    }

    console.log('\n🎉 Limpeza concluída!')
  } catch (error) {
    console.error('❌ Erro ao remover casos de exemplo:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

removeExampleCases()
