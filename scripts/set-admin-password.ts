/**
 * Script para definir senha de um usuário admin
 *
 * Uso:
 * 1. Via argumentos:
 *    npx tsx scripts/set-admin-password.ts "admin@email.com" "novaSenha123"
 *
 * 2. Interativo:
 *    npx tsx scripts/set-admin-password.ts
 */

import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close()
      resolve(answer)
    })
  )
}

async function setPassword(email: string, password: string) {
  try {
    console.log('\n🔧 Definindo senha do usuário...\n')

    // Verificar se usuário existe
    const user = await prisma.users.findUnique({
      where: { email },
    })

    if (!user) {
      console.error('❌ Usuário não encontrado!')
      process.exit(1)
    }

    if (user.role !== 'ADMIN') {
      console.error('⚠️  Este usuário não é ADMIN!')
      const proceed = await question('Deseja continuar mesmo assim? (s/n): ')
      if (proceed.toLowerCase() !== 's' && proceed.toLowerCase() !== 'sim') {
        console.log('❌ Operação cancelada.')
        process.exit(0)
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Atualizar senha no campo password do users
    await prisma.users.update({
      where: { email },
      data: {
        password: hashedPassword,
        emailVerified: new Date(), // Garantir que email está verificado
      },
    })

    console.log('✅ Senha definida com sucesso!\n')
    console.log('📋 Detalhes:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Nome: ${user.name}`)
    console.log(`   Role: ${user.role}\n`)
    console.log('🔐 Agora você pode fazer login:')
    console.log(`   URL: http://localhost:3000/auth/signin`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Senha: (a senha que você definiu)`)

  } catch (error) {
    console.error('❌ Erro ao definir senha:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  console.log('🔐 Script para Definir/Alterar Senha\n')

  let email: string
  let password: string

  // Tentar pegar dos argumentos
  if (process.argv.length >= 4) {
    [, , email, password] = process.argv
    console.log('📝 Usando argumentos da linha de comando...\n')
  } else {
    console.log('📝 Modo interativo\n')
    email = await question('Email do usuário: ')
    password = await question('Nova senha (mínimo 6 caracteres): ')
    const confirmPassword = await question('Confirme a senha: ')

    if (password !== confirmPassword) {
      console.error('❌ Senhas não coincidem!')
      process.exit(1)
    }
  }

  // Validações
  if (!email || !password) {
    console.error('❌ Email e senha são obrigatórios!')
    process.exit(1)
  }

  if (!email.includes('@')) {
    console.error('❌ Email inválido!')
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('❌ Senha deve ter no mínimo 6 caracteres!')
    process.exit(1)
  }

  await setPassword(email, password)
}

main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })
