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

if (!fs.existsSync(envFilePath)) {
  console.error(`❌ Arquivo ${envFile} não encontrado!`)
  console.log(`💡 Crie o arquivo ${envFile} baseado em ${envFile}.example`)
  process.exit(1)
}

try {
  fs.copyFileSync(envFilePath, targetFilePath)
  console.log(`✅ Arquivo ${envFile} copiado para ${targetFile}`)
  console.log(`📝 Ambiente: ${env === 'production' || env === 'prd' ? 'Produção' : 'Desenvolvimento'}`)
} catch (error) {
  console.error(`❌ Erro ao copiar arquivo:`, error.message)
  process.exit(1)
}
