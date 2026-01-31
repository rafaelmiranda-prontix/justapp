/**
 * Seed para criar usuário admin padrão
 *
 * Uso:
 *   npx prisma db seed
 *
 * Ou diretamente:
 *   npx ts-node prisma/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding admin user...\n')

  // Dados do admin padrão (ALTERE ISSO!)
  const adminData = {
    name: process.env.SEED_ADMIN_NAME || 'Administrador',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@legalmatch.com.br',
  }

  try {
    // Verificar se já existe
    const existing = await prisma.users.findUnique({
      where: { email: adminData.email },
    })

    if (existing) {
      console.log(`⚠️  Admin já existe: ${adminData.email}`)

      // Atualizar para garantir que é admin
      await prisma.users.update({
        where: { email: adminData.email },
        data: {
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: new Date(),
        },
      })

      console.log('✅ Usuário atualizado para ADMIN')
      return
    }

    // Criar novo admin
    const admin = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        name: adminData.name,
        email: adminData.email,
        emailVerified: new Date(),
        role: 'ADMIN',
        status: 'ACTIVE',
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    console.log('✅ Admin criado com sucesso!\n')
    console.log('📋 Detalhes:')
    console.log(`   Nome: ${admin.name}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Role: ${admin.role}\n`)

    console.log('⚠️  IMPORTANTE:')
    console.log('   Faça login via Google/GitHub ou use "Esqueci senha"')
    console.log('   para definir uma senha.\n')

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
