#!/usr/bin/env node

/**
 * Script para carregar o arquivo .env correto baseado no ambiente
 * Uso: node scripts/load-env.js [dev|prd]
 */

const fs = require('fs')
const path = require('path')

const env = process.argv[2] || process.env.NODE_ENV || 'dev'
const envFile = env === 'production' || env === 'prd' ? '.env.prd' : '.env.dev'
const targetFile = '.env'

const envFilePath = path.join(process.cwd(), envFile)
const targetFilePath = path.join(process.cwd(), targetFile)

// Em produção (Vercel), as variáveis vêm do painel, então não é erro fatal
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true'
const isCI = process.env.CI === 'true' || process.env.CI === '1'

if (!fs.existsSync(envFilePath)) {
  if (isVercel || isCI) {
    console.log(`ℹ️  Arquivo ${envFile} não encontrado, mas estamos em produção/CI. Usando variáveis do ambiente.`)
    process.exit(0)
  }
  console.error(`❌ Arquivo ${envFile} não encontrado!`)
  console.log(`💡 Crie o arquivo ${envFile} baseado em ${envFile}.example`)
  process.exit(1)
}

try {
  fs.copyFileSync(envFilePath, targetFilePath)
  if (!isVercel && !isCI) {
    console.log(`✅ Arquivo ${envFile} copiado para ${targetFile}`)
    console.log(`📝 Ambiente: ${env === 'production' || env === 'prd' ? 'Produção' : 'Desenvolvimento'}`)
  }
} catch (error) {
  // Em produção (Vercel), se não conseguir copiar, não é erro fatal
  if (isVercel || isCI) {
    console.log(`ℹ️  Não foi possível copiar ${envFile}, mas estamos em produção/CI. Continuando...`)
    process.exit(0)
  }
  console.error(`❌ Erro ao copiar arquivo:`, error.message)
  process.exit(1)
}
