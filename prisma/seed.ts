import { PrismaClient, ConfiguracaoTipo } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Criar especialidades iniciais
  const especialidades = [
    {
      nome: 'Direito do Consumidor',
      slug: 'consumidor',
      descricao:
        'Casos relacionados a produtos defeituosos, serviços mal prestados, cobranças indevidas, entre outros.',
      palavrasChave: [
        'consumidor',
        'produto',
        'defeito',
        'serviço',
        'cobrança',
        'indevida',
        'compra',
        'venda',
        'garantia',
        'troca',
        'devolução',
        'loja',
        'empresa',
        'atendimento',
        'sac',
      ],
    },
    {
      nome: 'Direito Trabalhista',
      slug: 'trabalhista',
      descricao:
        'Questões relacionadas a contratos de trabalho, demissões, verbas rescisórias, horas extras, etc.',
      palavrasChave: [
        'trabalho',
        'emprego',
        'demissão',
        'rescisão',
        'salário',
        'horas extras',
        'férias',
        'justa causa',
        'clt',
        'carteira',
        'empresa',
        'patrão',
      ],
    },
    {
      nome: 'Direito de Família',
      slug: 'familia',
      descricao: 'Divórcio, pensão alimentícia, guarda de filhos, partilha de bens, etc.',
      palavrasChave: [
        'divórcio',
        'separação',
        'pensão',
        'alimentos',
        'guarda',
        'filho',
        'partilha',
        'bens',
        'casamento',
        'união estável',
      ],
    },
    {
      nome: 'Direito Imobiliário',
      slug: 'imobiliario',
      descricao: 'Compra e venda de imóveis, locações, financiamentos, usucapião, etc.',
      palavrasChave: [
        'imóvel',
        'casa',
        'apartamento',
        'aluguel',
        'locação',
        'compra',
        'venda',
        'financiamento',
        'despejo',
        'proprietário',
        'inquilino',
      ],
    },
  ]

  for (const esp of especialidades) {
    await prisma.especialidades.upsert({
      where: { slug: esp.slug },
      update: {
        ...esp,
        updatedAt: new Date(),
      },
      create: {
        id: nanoid(),
        ...esp,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    console.log(`✅ Especialidade criada: ${esp.nome}`)
  }

  // Criar configurações padrão
  console.log('\n📋 Criando configurações padrão...')

  const configuracoesPadrao = [
    // MATCHING
    {
      chave: 'match_expiration_hours',
      valor: '48',
      tipo: 'NUMBER',
      descricao: 'Tempo em horas para o advogado aceitar ou recusar um match antes de expirar',
      categoria: 'matching',
    },
    {
      chave: 'max_matches_per_caso',
      valor: '5',
      tipo: 'NUMBER',
      descricao: 'Número máximo de advogados que recebem cada caso',
      categoria: 'matching',
    },
    {
      chave: 'min_match_score',
      valor: '60',
      tipo: 'NUMBER',
      descricao: 'Score mínimo para criar um match (0-100)',
      categoria: 'matching',
    },
    {
      chave: 'auto_expire_matches',
      valor: 'true',
      tipo: 'BOOLEAN',
      descricao: 'Se deve expirar automaticamente matches não respondidos',
      categoria: 'matching',
    },

    // LIMITES DE PLANOS
    // REMOVIDO: Agora os limites são gerenciados pela tabela 'planos'
    // Os planos (FREE, BASIC, PREMIUM, UNLIMITED) são configurados via scripts/seed-all-plans.ts

    // NOTIFICAÇÕES
    {
      chave: 'notify_match_created',
      valor: 'true',
      tipo: 'BOOLEAN',
      descricao: 'Enviar email quando um novo match é criado',
      categoria: 'notificacao',
    },
    {
      chave: 'notify_match_accepted',
      valor: 'true',
      tipo: 'BOOLEAN',
      descricao: 'Enviar email quando um match é aceito',
      categoria: 'notificacao',
    },
    {
      chave: 'notify_match_expiring_hours',
      valor: '6',
      tipo: 'NUMBER',
      descricao: 'Enviar lembrete X horas antes do match expirar',
      categoria: 'notificacao',
    },

    // CHAT
    {
      chave: 'chat_only_after_accept',
      valor: 'true',
      tipo: 'BOOLEAN',
      descricao: 'Cidadão só pode enviar mensagem após advogado aceitar o match',
      categoria: 'chat',
    },
    {
      chave: 'max_attachment_size_mb',
      valor: '20',
      tipo: 'NUMBER',
      descricao: 'Tamanho máximo de anexo em MB',
      categoria: 'chat',
    },

    // AVALIAÇÕES
    {
      chave: 'allow_reviews_after_days',
      valor: '1',
      tipo: 'NUMBER',
      descricao: 'Número de dias após aceitar para permitir avaliação',
      categoria: 'avaliacoes',
    },
    {
      chave: 'require_review_comment',
      valor: 'false',
      tipo: 'BOOLEAN',
      descricao: 'Tornar comentário obrigatório nas avaliações',
      categoria: 'avaliacoes',
    },

    // GERAL
    {
      chave: 'maintenance_mode',
      valor: 'false',
      tipo: 'BOOLEAN',
      descricao: 'Ativar modo de manutenção',
      categoria: 'geral',
    },
    {
      chave: 'beta_mode',
      valor: 'true',
      tipo: 'BOOLEAN',
      descricao: 'Ativar modo beta (requer código de convite)',
      categoria: 'geral',
    },
    {
      chave: 'audiencias_diligencias_enabled',
      valor: 'true',
      tipo: 'BOOLEAN',
      descricao:
        'Ativar módulo Audiências e diligências para advogados (menu, páginas e APIs). O painel administrativo de gestão permanece disponível.',
      categoria: 'funcionalidades',
    },
  ]

  for (const config of configuracoesPadrao) {
    await prisma.configuracoes.upsert({
      where: { chave: config.chave },
      update: {
        valor: config.valor,
        tipo: config.tipo as ConfiguracaoTipo,
        descricao: config.descricao,
        categoria: config.categoria,
        updatedAt: new Date(),
      },
      create: {
        id: nanoid(),
        chave: config.chave,
        valor: config.valor,
        tipo: config.tipo as ConfiguracaoTipo,
        descricao: config.descricao,
        categoria: config.categoria,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    console.log(`✅ Configuração criada: ${config.chave} = ${config.valor}`)
  }

  console.log('✨ Seed completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
