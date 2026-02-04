# 🛠️ Scripts de Manutenção

Este diretório contém scripts utilitários para gerenciar o banco de dados e testar funcionalidades.

## 📦 Seed (Popular Banco de Dados)

### Popular Tudo de Uma Vez
```bash
npm run seed
# ou
npx tsx scripts/seed-all.ts
```

Executa todos os seeds em ordem:
1. ✅ Configurações padrão (21 configs)
2. ✅ Especialidades jurídicas (15 áreas)
3. ✅ Advogados de teste (4 advogados)

### Seeds Individuais

#### Configurações Padrão
```bash
npm run seed:configs
```

Cria **21 configurações** do sistema:
- **Matching**: max_matches_per_caso, min_match_score, match_expiration_hours
- **Planos**: Limites de leads (FREE: 3, BASIC: 10, PREMIUM: 50)
- **Notificações**: Configurações de emails e alertas
- **Chat**: Regras de chat e anexos
- **Avaliações**: Regras de reviews
- **Sistema**: Modo beta, manutenção
- **Chat Anônimo**: Configurações do fluxo anônimo
- **Email**: Expiração de ativação

#### Especialidades Jurídicas
```bash
npm run seed:especialidades
```

Cria **15 especialidades** com palavras-chave para matching:
- Direito Civil (13 palavras-chave)
- Direito Trabalhista (14 palavras-chave)
- Direito Penal (14 palavras-chave)
- Direito do Consumidor (14 palavras-chave)
- Direito Imobiliário (14 palavras-chave)
- Direito Previdenciário (12 palavras-chave)
- Direito de Família (12 palavras-chave)
- Direito Tributário (14 palavras-chave)
- Direito Empresarial (12 palavras-chave)
- Direito Digital (12 palavras-chave)
- Direito Médico e da Saúde (12 palavras-chave)
- Direito Administrativo (9 palavras-chave)
- Direito Ambiental (10 palavras-chave)
- Direito Bancário (10 palavras-chave)
- Direito de Trânsito (11 palavras-chave)

**Palavras-chave**: Usadas para detectar especialidade no chat anônimo

#### Advogados de Teste
```bash
npm run seed:lawyers
```

Cria 4 advogados com diferentes planos:
- Dr. João Silva (PREMIUM) - São Paulo, SP - Direito Civil e Imobiliário
- Dra. Maria Santos (BASIC) - Rio de Janeiro, RJ - Direito Trabalhista e do Consumidor
- Dr. Carlos Oliveira (BASIC) - Campinas, SP - Direito Penal
- Dra. Ana Costa (FREE) - Belo Horizonte, MG - Direito Civil

**Login**: `[email acima] / senha123`

---

## 🗑️ Limpeza do Banco de Dados

### Limpar Dados (Interativo)
```bash
npm run clean
# ou
npx tsx scripts/clean-database.ts
```

**Menu Interativo**:
1. 🧪 Limpar TUDO (reset completo)
2. 👨‍⚖️  Limpar apenas Advogados de teste
3. 📋 Limpar apenas Casos e Matches
4. 💬 Limpar apenas Sessões Anônimas
5. ⚙️  Limpar apenas Configurações
6. ❌ Cancelar

**Segurança**:
- ⚠️ Requer confirmação digitando "SIM"
- Respeita ordem de foreign keys
- Mostra estatísticas do que foi deletado
- Não pode ser desfeito!

**Exemplo de Uso**:
```bash
$ npm run clean

⚠️  ATENÇÃO: LIMPEZA DO BANCO DE DADOS

Escolha o que deseja limpar:
1. 🧪 Limpar TUDO (reset completo)
2. 👨‍⚖️  Limpar apenas Advogados de teste
...

Escolha uma opção (1-6): 2

⚠️  Deletar todos os advogados e seus dados? (digite "SIM" para confirmar): SIM

✅ 4 advogados deletados
✅ 1 matches deletados
```

---

## 🔍 Diagnóstico

### Verificar Distribuição de Casos
```bash
npm run check:distribution
# ou
npx tsx scripts/check-distribution.ts
```

**Mostra**:
- ✅ Advogados ativos e com capacidade
- 📋 Casos abertos aguardando distribuição
- 🤝 Matches criados
- ⚠️ Problemas identificados

**Exemplo de Saída**:
```
=== Diagnóstico de Distribuição de Casos ===

📊 Advogados ATIVOS e COM ONBOARDING: 4
✅ Advogados disponíveis:
   - Dr. João Silva (PREMIUM, 1/50 leads)

📋 Casos ABERTOS: 1
🤝 Total de Matches: 1

=== PROBLEMAS IDENTIFICADOS ===
✓ Nenhum problema encontrado
```

### Verificar Onboarding de Advogados
```bash
npm run check:onboarding
# ou
npx tsx scripts/check-onboarding.ts
```

**Mostra**:
- ✅ Advogados com onboarding completo
- ❌ Advogados com onboarding incompleto
- 🔧 Advogados que podem completar agora
- 📊 Estatísticas de campos faltando
- ⚠️ Problemas identificados (OAB não verificada, não aprovado, etc.)

**Exemplo de Saída**:
```
=== Análise de Onboarding de Advogados ===

📊 Total de advogados: 10

✅ Onboarding Completo: 5
❌ Onboarding Incompleto: 5
🔧 Pode Completar Agora: 2

📋 ADVOGADOS COM ONBOARDING INCOMPLETO

👤 Dr. João Silva (joao@example.com)
   ID: abc123
   Status da Conta: ACTIVE
   Onboarding Completo: ❌ Não
   ⚠️  Campos Faltando:
      - Biografia não preenchida
   ✅ PODE COMPLETAR ONBOARDING AGORA!

📊 ESTATÍSTICAS
Campos Faltando:
   - OAB: 1
   - Localização (Cidade/Estado): 2
   - Biografia: 3
   - Especialidades: 1
```

### Completar Onboarding Manualmente
```bash
npx tsx scripts/complete-onboarding.ts <advogadoId>
```

**Quando usar**:
- Após identificar que um advogado pode completar o onboarding
- Para forçar a conclusão do onboarding quando todos os campos estão preenchidos
- Em casos onde o flag não foi atualizado automaticamente

**Exemplo**:
```bash
# 1. Verificar quais advogados podem completar
npm run check:onboarding

# 2. Completar onboarding de um advogado específico
npx tsx scripts/complete-onboarding.ts abc123
```

**O que faz**:
- ✅ Valida se todos os campos obrigatórios estão preenchidos
- ✅ Atualiza `onboardingCompleted = true`
- ✅ Mostra resumo do que foi verificado

---

## 🚀 Manutenção

### Distribuir Casos Manualmente
```bash
npx tsx scripts/distribute-open-cases.ts
```

Dispara distribuição para todos os casos com status ABERTO que ainda não têm matches.

**Quando usar**:
- Após criar novos advogados
- Para reprocessar casos que não foram distribuídos
- Em ambiente de desenvolvimento para testes

---

### Atualizar Localização de Casos
```bash
npx tsx scripts/update-case-location.ts
```

Atualiza casos sem cidade/estado para São Paulo, SP.

**Quando usar**:
- Casos criados sem localização
- Para permitir matching com advogados de SP

---

## 📚 Estrutura dos Scripts

```
scripts/
├── README.md                      # Este arquivo
├── seed-all.ts                    # Executa todos os seeds
├── seed-configs.ts                # Cria 21 configurações
├── seed-especialidades.ts         # Cria 15 especialidades jurídicas
├── seed-lawyers.ts                # Cria 4 advogados de teste
├── check-distribution.ts          # Diagnóstico de distribuição
├── check-onboarding.ts            # Análise de onboarding
├── complete-onboarding.ts         # Completar onboarding manualmente
├── distribute-open-cases.ts       # Distribuição manual
├── update-case-location.ts        # Atualizar localização
└── clean-database.ts              # Limpar banco (interativo)
```

---

## 🎯 Fluxo Recomendado

### 1. Setup Inicial (Primeiro Deploy)
```bash
# 1. Gerar Prisma Client
npm run db:generate

# 2. Popular banco de dados
npm run seed

# 3. Verificar se tudo está ok
npm run check:distribution
```

### 2. Desenvolvimento Local
```bash
# Resetar e recriar dados de teste
npm run seed:lawyers

# Verificar distribuição
npm run check:distribution
```

### 3. Troubleshooting
```bash
# Diagnóstico completo
npm run check:distribution

# Distribuir casos manualmente
npx tsx scripts/distribute-open-cases.ts

# Popular configs se estiver faltando
npm run seed:configs
```

---

## ⚙️ Configurações Criadas

| Chave | Valor Padrão | Descrição |
|-------|--------------|-----------|
| `max_matches_per_caso` | 5 | Matches criados por caso |
| `min_match_score` | 60 | Score mínimo (0-100) |
| `match_expiration_hours` | 48 | Horas até expirar |
| ~~`free_plan_monthly_leads`~~ | ~~3~~ | ⚠️ **REMOVIDO** - Use tabela `planos` |
| ~~`basic_plan_monthly_leads`~~ | ~~10~~ | ⚠️ **REMOVIDO** - Use tabela `planos` |
| ~~`premium_plan_monthly_leads`~~ | ~~50~~ | ⚠️ **REMOVIDO** - Use tabela `planos` |
| `anonymous_chat_enabled` | true | Chat anônimo ativo |
| `beta_mode` | true | Modo beta (requer convite) |

**Planos agora são gerenciados via:**
- Tabela `planos` no banco de dados
- Script: `npx tsx scripts/seed-all-plans.ts`
- 4 planos: FREE, BASIC, PREMIUM, UNLIMITED

Ver lista completa em: [seed-configs.ts](seed-configs.ts)

---

## 👥 Gerenciamento de Planos de Usuários

### Listar Advogados e Seus Planos
```bash
# Listar todos os advogados
npx tsx scripts/list-users-plans.ts

# Filtrar por plano específico
npx tsx scripts/list-users-plans.ts FREE
npx tsx scripts/list-users-plans.ts PREMIUM
npx tsx scripts/list-users-plans.ts UNLIMITED
```

**O que mostra:**
- Nome, email, OAB
- Plano atual e limites de leads
- Uso atual (leads recebidos/limite)
- Data de expiração (se aplicável)
- Status do onboarding
- Stripe Customer ID (se houver)
- Estatísticas por plano

### Alterar Plano de um Advogado
```bash
# Sintaxe
npx tsx scripts/change-user-plan.ts <email-do-advogado> <novo-plano>

# Exemplos
npx tsx scripts/change-user-plan.ts advogado@example.com PREMIUM
npx tsx scripts/change-user-plan.ts advogado@example.com UNLIMITED
npx tsx scripts/change-user-plan.ts advogado@example.com FREE
```

**Planos válidos:** FREE, BASIC, PREMIUM, UNLIMITED

**O que faz:**
- ✅ Valida se o usuário é advogado
- ✅ Mostra informações atuais do advogado
- ✅ Atualiza o plano usando `updateAdvogadoPlan()`
- ✅ Atualiza limite de leads automaticamente
- ✅ Registra no histórico de assinaturas
- ✅ Mostra situação atualizada

---

## 🔧 Comandos Úteis

```bash
# Abrir Prisma Studio (visualizar banco)
npm run db:studio

# Gerar Prisma Client após mudanças no schema
npm run db:generate

# Push schema para banco (dev)
npm run db:push

# Criar migration
npm run db:migrate

# Limpar banco de dados (interativo)
npm run clean

# Executar qualquer script
npx tsx scripts/[nome-do-script].ts
```

### 🔄 Workflows Comuns

**Reset Completo (Desenvolvimento)**:
```bash
npm run clean          # Escolher opção 1 (Limpar TUDO)
npm run seed           # Popular novamente
npm run check:distribution
```

**Recriar Apenas Advogados**:
```bash
npm run clean          # Escolher opção 2 (Limpar advogados)
npm run seed:lawyers   # Criar novamente
```

**Limpar Sessões Antigas**:
```bash
npm run clean          # Escolher opção 4 (Limpar sessões anônimas)
```

---

## 📝 Notas

- **Todos os scripts são idempotentes**: Executar múltiplas vezes não cria duplicatas
- **Seeds atualizam descrições**: Se config já existe, atualiza descrição mas mantém valor
- **Advogados de teste**: Senhas são sempre `senha123`
- **Logs detalhados**: Todos os scripts mostram progresso e erros
