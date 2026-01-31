/**
 * Script para criar usuário administrador
 *
 * Uso:
 * 1. Via argumentos:
 *    npx tsx scripts/create-admin.ts "Nome Admin" "admin@email.com" "senha123"
 *
 * 2. Via variáveis de ambiente:
 *    ADMIN_NAME="Nome Admin" ADMIN_EMAIL="admin@email.com" ADMIN_PASSWORD="senha123" npx tsx scripts/create-admin.ts
 *
 * 3. Interativo (pede inputs):
 *    npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'
import * as crypto from 'crypto'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Interface para ler input do usuário
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

async function createAdmin(name: string, email: string, password: string) {
  try {
    console.log('\n🔧 Criando usuário administrador...\n')

    // Verificar se já existe
    const existingUser = await prisma.users.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log('⚠️  Usuário já existe!')

      // Perguntar se quer atualizar para admin
      const update = await question('Deseja tornar este usuário ADMIN e atualizar senha? (s/n): ')

      if (update.toLowerCase() === 's' || update.toLowerCase() === 'sim') {
        const updateData: any = {
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: new Date(),
        }

        // Se tem senha, atualizar
        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10)
          updateData.password = hashedPassword
        }

        await prisma.users.update({
          where: { email },
          data: updateData,
        })

        console.log('✅ Usuário atualizado para ADMIN com sucesso!')
        if (password) {
          console.log('✅ Senha definida com sucesso!')
        }
      } else {
        console.log('❌ Operação cancelada.')
      }
      return
    }

    // Preparar dados do usuário
    const userData: any = {
      id: crypto.randomUUID(),
      name,
      email,
      emailVerified: new Date(), // Email já verificado
      role: 'ADMIN',
      status: 'ACTIVE',
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Se tem senha, fazer hash
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      userData.password = hashedPassword
    }

    // Criar novo usuário admin
    const user = await prisma.users.create({
      data: userData,
    })

    console.log('✅ Usuário ADMIN criado com sucesso!\n')
    console.log('📋 Detalhes:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Nome: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Status: ${user.status}`)
    console.log(`   Senha: ${password ? '✅ Definida' : '❌ Não definida'}`)

    if (!password) {
      console.log('\n⚠️  IMPORTANTE: Sem senha definida!')
      console.log('   Para definir a senha, use:\n')
      console.log('   npm run admin:password\n')
      console.log('   Ou faça login via Google/GitHub')
    } else {
      console.log('\n✅ Pronto para usar!')
      console.log(`   Acesse: http://localhost:3000/auth/signin`)
      console.log(`   Email: ${email}`)
      console.log(`   Senha: (a senha que você definiu)`)
    }

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  console.log('🔐 Script de Criação de Administrador\n')

  let name: string
  let email: string
  let password: string

  // Tentar pegar dos argumentos da linha de comando
  if (process.argv.length >= 4) {
    [, , name, email, password] = process.argv
    console.log('📝 Usando argumentos da linha de comando...\n')
  }
  // Tentar pegar das variáveis de ambiente
  else if (process.env.ADMIN_NAME && process.env.ADMIN_EMAIL) {
    name = process.env.ADMIN_NAME
    email = process.env.ADMIN_EMAIL
    password = process.env.ADMIN_PASSWORD || ''
    console.log('📝 Usando variáveis de ambiente...\n')
  }
  // Modo interativo
  else {
    console.log('📝 Modo interativo - preencha os dados abaixo:\n')
    name = await question('Nome completo do admin: ')
    email = await question('Email do admin: ')
    password = await question('Senha (mínimo 6 caracteres, ou deixe vazio): ')

    if (password && password.length < 6) {
      console.error('❌ Senha deve ter no mínimo 6 caracteres!')
      process.exit(1)
    }
  }

  // Validações
  if (!name || !email) {
    console.error('❌ Nome e email são obrigatórios!')
    process.exit(1)
  }

  if (!email.includes('@')) {
    console.error('❌ Email inválido!')
    process.exit(1)
  }

  if (password && password.length < 6) {
    console.error('❌ Senha deve ter no mínimo 6 caracteres!')
    process.exit(1)
  }

  // Criar admin
  await createAdmin(name, email, password)
}

main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })
