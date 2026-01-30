const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testLogin() {
  console.log('\n🔍 Testando login...\n')

  const email = 'rafonseca@gmail.com'
  const password = '123456'

  console.log('Email:', email)
  console.log('Senha:', password)
  console.log('')

  // 1. Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      cidadao: true,
      advogado: true,
    },
  })

  if (!user) {
    console.log('❌ Usuário não encontrado')
    await prisma.$disconnect()
    return
  }

  console.log('✅ Usuário encontrado')
  console.log('   ID:', user.id)
  console.log('   Nome:', user.name)
  console.log('   Role:', user.role)
  console.log('   Tem senha?', user.password ? 'SIM' : 'NÃO')
  console.log('')

  // 2. Verificar senha
  if (!user.password) {
    console.log('❌ Usuário não tem senha cadastrada')
    await prisma.$disconnect()
    return
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    console.log('❌ Senha incorreta')
    await prisma.$disconnect()
    return
  }

  console.log('✅ Senha correta')
  console.log('')

  // 3. Simular retorno do NextAuth
  const authUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    cidadaoId: user.cidadao?.id,
    advogadoId: user.advogado?.id,
  }

  console.log('✅ Dados que seriam retornados:')
  console.log(JSON.stringify(authUser, null, 2))
  console.log('')
  console.log('🎉 Login deve funcionar!')

  await prisma.$disconnect()
}

testLogin().catch((error) => {
  console.error('❌ Erro:', error)
  process.exit(1)
})
