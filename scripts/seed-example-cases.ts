#!/usr/bin/env tsx

/**
 * Script para criar casos de exemplo
 * 
 * Casos são marcados com:
 * - Prefixo "[EXEMPLO]" na descricao
 * - sessionId com padrão "EXAMPLE_..."
 * 
 * Uso:
 *   npm run seed:examples          # Cria 100 casos (padrão)
 *   CASOS=1 npm run seed:examples   # Cria 1 caso
 *   CASOS=10 npm run seed:examples  # Cria 10 casos
 * 
 * Para remover: npm run seed:remove-examples
 */

import { prisma } from '../src/lib/prisma'
import { nanoid } from 'nanoid'
import { hash } from 'bcryptjs'

const EXAMPLE_MARKER = '[EXEMPLO]'
const EXAMPLE_SESSION_PREFIX = 'EXAMPLE_'

// Templates de casos variados
const casoTemplates = [
  {
    descricao: 'Preciso de ajuda com um contrato de aluguel que está sendo questionado pelo proprietário',
    especialidade: 'Direito Imobiliário',
    urgencia: 'NORMAL' as const,
    complexidade: 2,
    status: 'ABERTO' as const,
  },
  {
    descricao: 'Tenho uma questão trabalhista sobre horas extras não pagas pelo empregador',
    especialidade: 'Direito Trabalhista',
    urgencia: 'ALTA' as const,
    complexidade: 3,
    status: 'ABERTO' as const,
  },
  {
    descricao: 'Preciso de orientação sobre divórcio consensual e partilha de bens',
    especialidade: 'Direito Civil',
    urgencia: 'NORMAL' as const,
    complexidade: 2,
    status: 'PENDENTE_ATIVACAO' as const,
  },
  {
    descricao: 'Recebi uma multa de trânsito que considero injusta e quero recorrer',
    especialidade: 'Direito Administrativo',
    urgencia: 'BAIXA' as const,
    complexidade: 1,
    status: 'ABERTO' as const,
  },
  {
    descricao: 'Problema com produto comprado online que veio com defeito e a loja não quer trocar',
    especialidade: 'Direito do Consumidor',
    urgencia: 'NORMAL' as const,
    complexidade: 1,
    status: 'EM_ANDAMENTO' as const,
  },
  {
    descricao: 'Questão sobre herança e inventário após falecimento de familiar',
    especialidade: 'Direito Civil',
    urgencia: 'NORMAL' as const,
    complexidade: 4,
    status: 'ABERTO' as const,
  },
  {
    descricao: 'Preciso de ajuda com processo de aposentadoria que está sendo negado',
    especialidade: 'Direito Previdenciário',
    urgencia: 'ALTA' as const,
    complexidade: 3,
    status: 'ABERTO' as const,
  },
  {
    descricao: 'Questão sobre pensão alimentícia que precisa ser revisada',
    especialidade: 'Direito de Família',
    urgencia: 'URGENTE' as const,
    complexidade: 2,
    status: 'ABERTO' as const,
  },
  {
    descricao: 'Problema com contrato de prestação de serviços que não foi cumprido',
    especialidade: 'Direito Civil',
    urgencia: 'NORMAL' as const,
    complexidade: 2,
    status: 'FECHADO' as const,
  },
  {
    descricao: 'Preciso de orientação sobre direitos do inquilino em caso de despejo',
    especialidade: 'Direito Imobiliário',
    urgencia: 'URGENTE' as const,
    complexidade: 3,
    status: 'ABERTO' as const,
  },
  {
    descricao: 'Questão sobre acidente de trabalho e direito a indenização',
    especialidade: 'Direito Trabalhista',
    urgencia: 'ALTA' as const,
    complexidade: 3,
    status: 'EM_ANDAMENTO' as const,
  },
  {
    descricao: 'Problema com plano de saúde que não está cobrindo tratamento necessário',
    especialidade: 'Direito do Consumidor',
    urgencia: 'URGENTE' as const,
    complexidade: 2,
    status: 'ABERTO' as const,
  },
  {
    descricao: 'Preciso de ajuda com processo de naturalização brasileira',
    especialidade: 'Direito Administrativo',
    urgencia: 'NORMAL' as const,
    complexidade: 4,
    status: 'PENDENTE_ATIVACAO' as const,
  },
  {
    descricao: 'Questão sobre direito autoral e uso indevido de conteúdo',
    especialidade: 'Direito Intelectual',
    urgencia: 'NORMAL' as const,
    complexidade: 3,
    status: 'ABERTO' as const,
  },
  {
    descricao: 'Problema com financiamento imobiliário e renegociação de dívida',
    especialidade: 'Direito Imobiliário',
    urgencia: 'ALTA' as const,
    complexidade: 4,
    status: 'ABERTO' as const,
  },
]

// Cidades e estados variados
const localizacoes = [
  { cidade: 'São Paulo', estado: 'SP' },
  { cidade: 'Rio de Janeiro', estado: 'RJ' },
  { cidade: 'Belo Horizonte', estado: 'MG' },
  { cidade: 'Brasília', estado: 'DF' },
  { cidade: 'Curitiba', estado: 'PR' },
  { cidade: 'Porto Alegre', estado: 'RS' },
  { cidade: 'Salvador', estado: 'BA' },
  { cidade: 'Recife', estado: 'PE' },
  { cidade: 'Fortaleza', estado: 'CE' },
  { cidade: 'Manaus', estado: 'AM' },
]

async function seedExampleCases() {
  // Permite definir quantidade via variável de ambiente ou argumento
  const casosCount = process.env.CASOS 
    ? parseInt(process.env.CASOS, 10) 
    : process.argv[2] 
      ? parseInt(process.argv[2], 10)
      : 100

  if (isNaN(casosCount) || casosCount < 1) {
    console.log('❌ Quantidade inválida. Use um número maior que 0.')
    console.log('   Exemplo: CASOS=1 npm run seed:examples')
    process.exit(1)
  }

  console.log(`🌱 Criando ${casosCount} caso${casosCount > 1 ? 's' : ''} de exemplo...\n`)

  try {
    // Buscar especialidades existentes
    const especialidades = await prisma.especialidades.findMany()

    if (especialidades.length === 0) {
      console.log('❌ Nenhuma especialidade encontrada. Execute primeiro: npm run seed:especialidades')
      process.exit(1)
    }

    // Criar mapa de especialidades por nome
    const especialidadesMap = new Map(
      especialidades.map((esp) => [esp.nome, esp])
    )

    // Criar ou buscar cidadãos de exemplo (ajustar quantidade baseado em casosCount)
    const cidadaosNecessarios = casosCount <= 1 ? 1 : Math.min(20, Math.ceil(casosCount / 5))
    
    console.log(`👥 Criando/buscando ${cidadaosNecessarios} cidadão${cidadaosNecessarios > 1 ? 's' : ''} de exemplo...`)
    const cidadaosExemplo: string[] = []

    for (let i = 1; i <= cidadaosNecessarios; i++) {
      const email = `exemplo.cidadao${i}@example.com`
      const localizacao = localizacoes[i % localizacoes.length]

      let user = await prisma.users.findUnique({
        where: { email },
        include: { cidadaos: true },
      })

      if (!user) {
        const userId = nanoid()
        const cidadaoId = nanoid()
        const hashedPassword = await hash('senha123', 10)

        // Criar usuário primeiro
        await prisma.users.create({
          data: {
            id: userId,
            email,
            name: `Cidadão Exemplo ${i}`,
            password: hashedPassword,
            role: 'CIDADAO',
            status: 'ACTIVE',
            emailVerified: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })

        // Criar cidadão separadamente
        await prisma.cidadaos.create({
          data: {
            id: cidadaoId,
            userId,
            cidade: localizacao.cidade,
            estado: localizacao.estado,
            updatedAt: new Date(),
          },
        })

        // Buscar novamente após criar
        user = await prisma.users.findUnique({
          where: { email },
          include: { cidadaos: true },
        })
      }

      if (user?.cidadaos) {
        cidadaosExemplo.push(user.cidadaos.id)
      }
    }

    console.log(`✅ ${cidadaosExemplo.length} cidadãos de exemplo prontos\n`)

    // Criar casos
    console.log('📋 Criando casos de exemplo...')
    let created = 0
    let errors = 0

    for (let i = 1; i <= casosCount; i++) {
      try {
        // Selecionar template aleatório
        const template = casoTemplates[i % casoTemplates.length]
        const cidadaoId = cidadaosExemplo[i % cidadaosExemplo.length]
        const localizacao = localizacoes[i % localizacoes.length]

        // Buscar especialidade
        const especialidade = especialidadesMap.get(template.especialidade)
        const especialidadeId = especialidade?.id || especialidades[0].id

        // Criar caso
        const casoId = nanoid()
        const sessionId = `${EXAMPLE_SESSION_PREFIX}${casoId}`

        await prisma.casos.create({
          data: {
            id: casoId,
            cidadaoId,
            descricao: `${EXAMPLE_MARKER} ${template.descricao}`,
            descricaoIA: `Análise automática do caso de exemplo ${i}: ${template.descricao}`,
            especialidadeId,
            urgencia: template.urgencia,
            complexidade: template.complexidade,
            status: template.status,
            sessionId,
            conversaHistorico: [
              {
                role: 'user',
                content: template.descricao,
                timestamp: new Date().toISOString(),
              },
              {
                role: 'assistant',
                content: 'Entendi seu caso. Vou analisar e conectar você com advogados especializados.',
                timestamp: new Date().toISOString(),
              },
            ],
            updatedAt: new Date(),
          },
        })

        created++

        if (casosCount > 10 && i % 10 === 0) {
          console.log(`   ✅ ${i}/${casosCount} casos criados...`)
        } else if (casosCount <= 10) {
          console.log(`   ✅ Caso ${i}/${casosCount} criado`)
        }
      } catch (error) {
        console.error(`   ❌ Erro ao criar caso ${i}:`, error)
        errors++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMO')
    console.log('='.repeat(60))
    console.log(`✅ Casos criados: ${created}/${casosCount}`)
    console.log(`❌ Erros: ${errors}`)
    console.log(`\n📌 Casos marcados com: "${EXAMPLE_MARKER}" na descrição`)
    console.log(`📌 SessionIds com prefixo: "${EXAMPLE_SESSION_PREFIX}"`)
    console.log('\n🗑️  Para remover os casos de exemplo:')
    console.log('   npm run seed:remove-examples')
    console.log('\n🎉 Concluído!')
  } catch (error) {
    console.error('❌ Erro ao criar casos de exemplo:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedExampleCases()
