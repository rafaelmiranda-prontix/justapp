import { prisma } from '../src/lib/prisma'

async function updateCaseLocation() {
  console.log('📍 Atualizando localização do caso...\n')

  // Buscar o caso
  const caso = await prisma.casos.findFirst({
    where: {
      status: 'ABERTO',
    },
    include: {
      cidadaos: {
        include: {
          users: true,
        },
      },
    },
  })

  if (!caso) {
    console.log('❌ Nenhum caso ABERTO encontrado')
    return
  }

  console.log(`📌 Caso: ${caso.id}`)
  console.log(`   Cidadão: ${caso.cidadaos.users.name}`)
  console.log(`   Localização atual: ${caso.cidadaos.cidade || 'N/A'}, ${caso.cidadaos.estado || 'N/A'}`)

  // Atualizar cidadão com localização (São Paulo para ter match com os advogados)
  await prisma.cidadaos.update({
    where: { id: caso.cidadaos.id },
    data: {
      cidade: 'São Paulo',
      estado: 'SP',
      updatedAt: new Date(),
    },
  })

  console.log(`✅ Localização atualizada: São Paulo, SP`)
  console.log('   Isso permitirá match com advogados de SP')
}

updateCaseLocation()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
