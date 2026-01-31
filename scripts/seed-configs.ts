import { prisma } from '../src/lib/prisma'
import { nanoid } from 'nanoid'

async function seedConfigs() {
  console.log('🔧 Criando configurações padrão...\n')

  const configs = [
    // === MATCHING / DISTRIBUIÇÃO ===
    {
      chave: 'max_matches_per_caso',
      valor: '5',
      tipo: 'NUMBER' as const,
      descricao: 'Número máximo de matches criados por caso',
      categoria: 'matching',
    },
    {
      chave: 'min_match_score',
      valor: '60',
      tipo: 'NUMBER' as const,
      descricao: 'Score mínimo (0-100) para criar um match',
      categoria: 'matching',
    },
    {
      chave: 'match_expiration_hours',
      valor: '48',
      tipo: 'NUMBER' as const,
      descricao: 'Horas até um match expirar se não for respondido',
      categoria: 'matching',
    },
    {
      chave: 'auto_expire_matches',
      valor: 'true',
      tipo: 'BOOLEAN' as const,
      descricao: 'Expirar matches automaticamente via cron job',
      categoria: 'matching',
    },

    // === PLANOS / LEADS ===
    {
      chave: 'free_plan_monthly_leads',
      valor: '3',
      tipo: 'NUMBER' as const,
      descricao: 'Limite mensal de leads para plano FREE',
      categoria: 'planos',
    },
    {
      chave: 'basic_plan_monthly_leads',
      valor: '10',
      tipo: 'NUMBER' as const,
      descricao: 'Limite mensal de leads para plano BASIC',
      categoria: 'planos',
    },
    {
      chave: 'premium_plan_monthly_leads',
      valor: '50',
      tipo: 'NUMBER' as const,
      descricao: 'Limite mensal de leads para plano PREMIUM',
      categoria: 'planos',
    },

    // === NOTIFICAÇÕES ===
    {
      chave: 'notify_match_created',
      valor: 'true',
      tipo: 'BOOLEAN' as const,
      descricao: 'Enviar notificação quando novo match é criado',
      categoria: 'notificacoes',
    },
    {
      chave: 'notify_match_accepted',
      valor: 'true',
      tipo: 'BOOLEAN' as const,
      descricao: 'Enviar notificação quando match é aceito',
      categoria: 'notificacoes',
    },
    {
      chave: 'notify_match_expiring_hours',
      valor: '6',
      tipo: 'NUMBER' as const,
      descricao: 'Horas antes da expiração para enviar lembrete',
      categoria: 'notificacoes',
    },

    // === CHAT ===
    {
      chave: 'chat_only_after_accept',
      valor: 'true',
      tipo: 'BOOLEAN' as const,
      descricao: 'Chat só funciona após advogado aceitar o match',
      categoria: 'chat',
    },
    {
      chave: 'max_attachment_size_mb',
      valor: '20',
      tipo: 'NUMBER' as const,
      descricao: 'Tamanho máximo de anexo em MB',
      categoria: 'chat',
    },

    // === AVALIAÇÕES ===
    {
      chave: 'allow_reviews_after_days',
      valor: '1',
      tipo: 'NUMBER' as const,
      descricao: 'Dias necessários após aceitar para permitir avaliação',
      categoria: 'avaliacoes',
    },
    {
      chave: 'require_review_comment',
      valor: 'false',
      tipo: 'BOOLEAN' as const,
      descricao: 'Comentário é obrigatório nas avaliações',
      categoria: 'avaliacoes',
    },

    // === SISTEMA ===
    {
      chave: 'maintenance_mode',
      valor: 'false',
      tipo: 'BOOLEAN' as const,
      descricao: 'Modo de manutenção ativo',
      categoria: 'sistema',
    },
    {
      chave: 'beta_mode',
      valor: 'true',
      tipo: 'BOOLEAN' as const,
      descricao: 'Modo beta ativo (requer código de convite)',
      categoria: 'sistema',
    },

    // === CHAT ANÔNIMO ===
    {
      chave: 'anonymous_chat_enabled',
      valor: 'true',
      tipo: 'BOOLEAN' as const,
      descricao: 'Chat anônimo habilitado na homepage',
      categoria: 'anonymous',
    },
    {
      chave: 'anonymous_session_expiration_hours',
      valor: '24',
      tipo: 'NUMBER' as const,
      descricao: 'Horas até sessão anônima expirar',
      categoria: 'anonymous',
    },
    {
      chave: 'anonymous_use_ai',
      valor: 'false',
      tipo: 'BOOLEAN' as const,
      descricao: 'Usar IA para chat anônimo (senão usa pre-qualification)',
      categoria: 'anonymous',
    },
    {
      chave: 'anonymous_min_messages_for_capture',
      valor: '3',
      tipo: 'NUMBER' as const,
      descricao: 'Mínimo de mensagens antes de mostrar formulário de captura',
      categoria: 'anonymous',
    },

    // === EMAIL ===
    {
      chave: 'activation_email_expiration_hours',
      valor: '48',
      tipo: 'NUMBER' as const,
      descricao: 'Horas até link de ativação expirar',
      categoria: 'email',
    },
  ]

  let created = 0
  let updated = 0
  let skipped = 0

  for (const config of configs) {
    try {
      // Verificar se já existe
      const existing = await prisma.configuracoes.findUnique({
        where: { chave: config.chave },
      })

      if (existing) {
        // Atualizar apenas descrição e categoria (não mudar valor)
        await prisma.configuracoes.update({
          where: { chave: config.chave },
          data: {
            descricao: config.descricao,
            categoria: config.categoria,
            tipo: config.tipo,
            updatedAt: new Date(),
          },
        })
        console.log(`✏️  Atualizado: ${config.chave} (manteve valor: ${existing.valor})`)
        updated++
      } else {
        // Criar novo
        await prisma.configuracoes.create({
          data: {
            id: nanoid(),
            chave: config.chave,
            valor: config.valor,
            tipo: config.tipo,
            descricao: config.descricao,
            categoria: config.categoria,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
        console.log(`✅ Criado: ${config.chave} = ${config.valor}`)
        created++
      }
    } catch (error: any) {
      console.error(`❌ Erro ao processar ${config.chave}:`, error.message)
      skipped++
    }
  }

  console.log('\n📊 Resumo:')
  console.log(`   ✅ Criadas: ${created}`)
  console.log(`   ✏️  Atualizadas: ${updated}`)
  console.log(`   ❌ Erros: ${skipped}`)
  console.log(`   📝 Total: ${configs.length}`)

  console.log('\n🎯 Categorias criadas:')
  const categorias = new Set(configs.map((c) => c.categoria))
  categorias.forEach((cat) => {
    const count = configs.filter((c) => c.categoria === cat).length
    console.log(`   - ${cat}: ${count} configurações`)
  })

  console.log('\n✅ Configurações padrão criadas com sucesso!')
  console.log('💡 Para alterar valores, use o painel admin ou UPDATE direto no banco')
}

seedConfigs()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
