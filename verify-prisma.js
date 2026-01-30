const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verify() {
  console.log('\n🔍 Verificando Prisma Client...\n')

  // Tentar buscar um usuário para ver quais campos são retornados
  const user = await prisma.user.findFirst({
    select: {
      id: true,
      email: true,
      password: true, // Tentar selecionar password
    },
  })

  if (!user) {
    console.log('⚠️  Nenhum usuário encontrado no banco')
    await prisma.$disconnect()
    return
  }

  console.log('✅ Prisma Client consegue acessar o campo password')
  console.log('   Email:', user.email)
  console.log('   Tem password:', user.password ? 'SIM' : 'NÃO')

  if (user.password) {
    console.log('   Hash:', user.password.substring(0, 20) + '...')
  }

  console.log('\n✅ Prisma Client está atualizado!\n')

  await prisma.$disconnect()
}

verify().catch((error) => {
  console.error('\n❌ Erro ao verificar Prisma Client:')
  console.error(error.message)
  console.log('\n💡 Execute: npx prisma generate\n')
  process.exit(1)
})
