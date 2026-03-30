#!/usr/bin/env tsx

/**
 * Script para popular banco de dados com dados iniciais
 *
 * Executa os seguintes seeds em ordem:
 * 1. Configurações
 * 2. Planos
 * 3. Especialidades
 * 4. Advogados de teste
 * 5. Casos de exemplo (quantidade: env CASOS, padrão 25)
 */

import { execSync } from 'child_process'

type SeedScript = {
  name: string
  file: string
  description: string
  env?: NodeJS.ProcessEnv
}

const defaultCasosSeed = process.env.CASOS ?? '25'

const scripts: SeedScript[] = [
  {
    name: 'Configurações',
    file: 'seed-configs.ts',
    description: 'Configurações do sistema (matching, notificações)',
  },
  {
    name: 'Planos',
    file: 'seed-planos.ts',
    description: 'Catálogo de planos de assinatura (FREE, BASIC, PREMIUM)',
  },
  {
    name: 'Especialidades',
    file: 'seed-especialidades.ts',
    description: 'Especialidades jurídicas (15 áreas do direito)',
  },
  {
    name: 'Advogados',
    file: 'seed-lawyers.ts',
    description: 'Advogados de teste com diferentes planos',
  },
  {
    name: 'Casos de exemplo',
    file: 'seed-example-cases.ts',
    description: `Casos marcados "[EXEMPLO]" para testes (CASOS=${defaultCasosSeed})`,
    env: { ...process.env, CASOS: defaultCasosSeed },
  },
]

console.log('🌱 Iniciando seed completo do banco de dados...\n')

let success = 0
let failed = 0

for (const script of scripts) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📦 ${script.name}`)
  console.log(`   ${script.description}`)
  console.log('='.repeat(60))

  try {
    execSync(`npx tsx scripts/${script.file}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: script.env ?? process.env,
    })
    success++
  } catch (error) {
    console.error(`\n❌ Erro ao executar ${script.file}`)
    failed++
  }
}

console.log('\n' + '='.repeat(60))
console.log('📊 RESUMO FINAL')
console.log('='.repeat(60))
console.log(`✅ Sucesso: ${success}/${scripts.length}`)
console.log(`❌ Falhas: ${failed}/${scripts.length}`)

if (failed === 0) {
  console.log('\n🎉 Banco de dados populado com sucesso!')
  console.log('\n📋 Próximos passos:')
  console.log('   1. Execute: npx tsx scripts/check-distribution.ts')
  console.log('   2. Verifique advogados e casos "[EXEMPLO]" no app ou Studio')
  console.log('   3. Teste o fluxo de distribuição')
  console.log(`\n📌 Casos de exemplo: ${defaultCasosSeed} (alterar com CASOS=50 npm run seed)`)
  console.log('\n🔑 Login dos advogados:')
  console.log('   Email: joao.silva@advogado.com (ou outros)')
  console.log('   Senha: senha123')
  console.log("\n🔑 Cidadãos de exemplo: exemplo.cidadao1@example.com — senha123")
} else {
  console.log('\n⚠️  Alguns scripts falharam. Verifique os erros acima.')
  process.exit(1)
}
