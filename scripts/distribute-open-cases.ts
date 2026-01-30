import { prisma } from '../src/lib/prisma'
import { CaseDistributionService } from '../src/lib/case-distribution.service'

async function distributeOpenCases() {
  console.log('🚀 Disparando distribuição para casos ABERTOS...\n')

  // Buscar casos ABERTOS sem matches
  const casos = await prisma.casos.findMany({
    where: {
      status: 'ABERTO',
    },
    include: {
      matches: true,
      cidadaos: {
        include: {
          users: true,
        },
      },
      especialidades: true,
    },
  })

  console.log(`📋 Casos ABERTOS encontrados: ${casos.length}\n`)

  if (casos.length === 0) {
    console.log('ℹ️  Nenhum caso ABERTO para distribuir')
    return
  }

  for (const caso of casos) {
    console.log(`📌 Caso: ${caso.id}`)
    console.log(`   Cidadão: ${caso.cidadaos.users.name}`)
    console.log(`   Especialidade: ${caso.especialidades?.nome || 'Não definida'}`)
    console.log(`   Matches existentes: ${caso.matches.length}`)

    if (caso.matches.length > 0) {
      console.log(`   ⏭️  Já possui matches, pulando...\n`)
      continue
    }

    try {
      console.log('   🔄 Disparando distribuição...')

      const result = await CaseDistributionService.distributeCase(caso.id)

      console.log(`   ✅ Distribuição concluída!`)
      console.log(`   📊 Matches criados: ${result.matchesCreated}`)
      console.log(`   👥 Advogados notificados: ${result.advogadosNotificados.length}`)
      console.log('')
    } catch (error: any) {
      console.error(`   ❌ Erro ao distribuir caso:`, error.message)
      console.log('')
    }
  }

  console.log('\n✅ Distribuição concluída!')
}

distributeOpenCases()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
