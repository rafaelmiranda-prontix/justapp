/**
 * Script para aplicar a migration de security_logs diretamente via SQL
 * Útil quando há problemas com pool de conexões
 */

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Usar DIRECT_URL se disponível (não usa pool), senão usar DATABASE_URL
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

async function main() {
  console.log('📋 Aplicando migration de security_logs...\n')

  const migrationPath = path.join(
    __dirname,
    '../prisma/migrations/20260204124947_add_security_logs/migration.sql'
  )

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Arquivo de migration não encontrado:', migrationPath)
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8')

  try {
    // Verificar se a tabela já existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'security_logs'
      );
    `

    if (tableExists[0]?.exists) {
      console.log('✅ Tabela security_logs já existe. Pulando criação...')
      return
    }

    // Aplicar migration
    console.log('🔨 Criando tabela security_logs...')
    await prisma.$executeRawUnsafe(sql)
    console.log('✅ Migration aplicada com sucesso!')
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ Tabela ou índices já existem. Migration já foi aplicada.')
    } else {
      console.error('❌ Erro ao aplicar migration:', error.message)
      throw error
    }
  }
}

main()
  .catch((error) => {
    console.error('❌ Erro:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
