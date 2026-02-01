# Regras de Negócio - LegalConnect

## 📋 Índice
- [🚀 Fluxo de Aquisição (Novo)](#-fluxo-de-aquisição-novo)
- [Fluxo de Matching](#fluxo-de-matching)
- [Permissões de Usuários](#permissões-de-usuários)
- [Expiração de Matches](#expiração-de-matches)
- [Sistema de Chat](#sistema-de-chat)
- [Avaliações](#avaliações)
- [Planos e Limites](#planos-e-limites)

---

## 🚀 Fluxo de Aquisição (Novo)

### Princípio: Zero Fricção Inicial

**Usuários começam conversando ANTES de se cadastrar, aumentando drasticamente a conversão.**

### Jornada do Visitante ao Lead Qualificado

#### Fase 1: Início Anônimo (0 fricção)

1. **Visitante acessa a homepage**
   - Vê CTA claro: "Comece Agora - É Grátis" ou "Conte seu Problema"
   - Não precisa criar conta

2. **Clica e inicia conversa**
   - Chat abre instantaneamente (modal/sheet)
   - Sistema gera `sessionId` único
   - Armazena em cookie/localStorage
   - Status: `ACTIVE`

3. **Conversa com IA**
   - Visitante descreve o problema livremente
   - IA responde e faz perguntas qualificadoras:
     - Entende o problema
     - Classifica especialidade
     - Avalia urgência e complexidade
     - Captura localização (cidade/estado)
   - Tudo armazenado em `AnonymousSession.mensagens[]`

#### Fase 2: Qualificação e Captura (3-5 mensagens)

4. **IA detecta momento ideal**
   - Usuário enviou 3+ mensagens
   - Problema bem entendido
   - Especialidade identificada
   - Localização capturada
   - Matches potenciais estimados

5. **Solicita dados de contato**
   ```
   "Encontrei 5 advogados especializados em [área]
    na região de [cidade]!

    Para conectar você com eles, preciso de:

    📧 Seu email
    📱 Nome completo
    📞 Telefone (opcional)"
   ```

#### Fase 3: Conversão de Lead

6. **Visitante fornece dados**
   - Sistema valida email (formato real)
   - Cria usuário com `status = PRE_ACTIVE`:
     ```typescript
     {
       email: "usuario@email.com",
       name: "João Silva",
       phone: "11999999999",
       role: "CIDADAO",
       status: "PRE_ACTIVE",
       password: null, // ainda não tem
       emailVerified: null,
       activationToken: "token_único",
       activationExpires: now() + 48h
     }
     ```

7. **Cria caso automaticamente**
   ```typescript
   {
     cidadaoId: cidadao.id,
     descricao: "Transcrição completa do chat",
     descricaoIA: "Resumo gerado pela IA",
     especialidadeId: "detectada_pela_ia",
     urgencia: "ALTA/NORMAL/BAIXA",
     status: "PENDENTE_ATIVACAO", // novo status
     sessionId: "abc123" // referência da sessão
   }
   ```

8. **Atualiza sessão anônima**
   ```typescript
   {
     status: "CONVERTED",
     convertedToUserId: user.id,
     convertedToCasoId: caso.id
   }
   ```

#### Fase 4: Ativação via Email

9. **Sistema envia email de ativação**
   ```
   Assunto: Complete seu cadastro - LegalConnect

   Olá João!

   Identificamos 5 advogados especializados em
   [área] na região de [cidade] para seu caso:

   📋 Seu problema: [resumo]
   ⚡ Urgência: Alta

   Para conectar você com os advogados, confirme
   seu email e crie uma senha:

   [Ativar Minha Conta] ← link com token

   Este link expira em 48 horas.
   ```

10. **Usuário clica no link**
    - Redireciona para `/ativar-conta?token=xxx`
    - Mostra formulário:
      ```
      Bem-vindo, João!

      Crie uma senha para sua conta:

      Senha: [________]
      Confirmar: [________]

      [Ativar e Ver Advogados]
      ```

11. **Usuário ativa a conta**
    - Valida token (não expirado, um uso só)
    - Cria hash da senha com bcrypt
    - Atualiza usuário:
      ```typescript
      {
        status: "ACTIVE",
        emailVerified: now(),
        password: hash(senha),
        activationToken: null
      }
      ```
    - Atualiza caso:
      ```typescript
      {
        status: "ABERTO" // agora pode distribuir
      }
      ```
    - Faz login automático (cria sessão NextAuth)
    - Redireciona para `/cidadao/dashboard`

#### Fase 5: Distribuição Automática

12. **Sistema executa matching**
    - Busca advogados compatíveis
    - Cria até 5 matches
    - Notifica advogados
    - Cidadão vê no dashboard: "Seu caso foi enviado!"

### Diagrama de Fluxo

```
VISITANTE (anônimo)
    ↓
Clica "Comece Agora"
    ↓
CHAT ANÔNIMO ABRE
    ↓
Conversa com IA (3-5 msgs)
    ↓
IA detecta momento ideal
    ↓
SOLICITA EMAIL + NOME
    ↓
Visitante fornece dados
    ↓
┌─────────────────────────────┐
│ Sistema cria:               │
│ • User (PRE_ACTIVE)         │
│ • Cidadao                   │
│ • Caso (PENDENTE_ATIVACAO)  │
└─────────────────────────────┘
    ↓
EMAIL DE ATIVAÇÃO ENVIADO
    ↓
Usuário clica no link
    ↓
CRIA SENHA
    ↓
┌─────────────────────────────┐
│ Sistema atualiza:           │
│ • User (ACTIVE)             │
│ • Caso (ABERTO)             │
│ • Login automático          │
└─────────────────────────────┘
    ↓
DASHBOARD DO CIDADÃO
    ↓
Sistema distribui matches
    ↓
ADVOGADOS RECEBEM
```

### Estados da Sessão Anônima

```
AnonymousSession.status:

ACTIVE      → Conversando ativamente
CONVERTED   → Virou usuário + caso
ABANDONED   → 7 dias sem atividade
EXPIRED     → Passou do prazo (7 dias)
```

### Estados do Usuário

```
User.status:

PRE_ACTIVE  → Criado, aguardando ativação
ACTIVE      → Email verificado, funcionando
SUSPENDED   → Suspenso por admin
DELETED     → Deletado (soft delete)
```

### Estados do Caso

```
Caso.status:

PENDENTE_ATIVACAO → Aguardando ativação do usuário (NOVO)
ABERTO            → Ativo e sendo distribuído
EM_ANDAMENTO      → Advogado aceitou
FECHADO           → Resolvido
CANCELADO         → Cancelado
```

### Vantagens deste Fluxo

**Para o Usuário:**
- ✅ Zero fricção - começa conversando
- ✅ Não precisa entender categorias jurídicas
- ✅ IA guia e qualifica automaticamente
- ✅ Só fornece dados quando engajado (3-5 msgs)
- ✅ Email de ativação evita spam/bots

**Para o Negócio:**
- ✅ Taxa de conversão 3-5x maior
- ✅ Leads mais qualificados (já conversaram)
- ✅ Menos abandono no cadastro
- ✅ Dados ricos sobre o problema
- ✅ Email verificado garantido

**Para os Advogados:**
- ✅ Recebem casos com contexto completo
- ✅ Histórico da conversa disponível
- ✅ Leads já qualificados e engajados
- ✅ Maior taxa de conversão em clientes

---

## 🎯 Fluxo de Matching

### Regra Principal
**Os casos são distribuídos AUTOMATICAMENTE para os advogados. Apenas os advogados podem aceitar ou recusar.**

### Processo Detalhado

1. **Caso fica ABERTO** (após ativação do cidadão)
   - IA já analisou e classificou durante chat anônimo
   - Status: `ABERTO`

2. **Sistema cria matches automaticamente**
   - Busca advogados compatíveis baseado em:
     - Especialidade
     - Localização (raio de atuação)
     - Disponibilidade (não excedeu limite mensal de leads)
     - Score de compatibilidade (mínimo configurável)
   - Cria até N matches (configurável: `max_matches_per_caso`)
   - Cada match tem status inicial: `PENDENTE`
   - Define data de expiração: `expiresAt = now() + match_expiration_hours`

3. **Advogado recebe notificação**
   - Email/Push informando novo caso compatível
   - Visualiza detalhes do caso no dashboard
   - Ao abrir, status muda para: `VISUALIZADO`

4. **Advogado decide**
   - ✅ **ACEITAR**: Match vira `ACEITO`, caso vira `EM_ANDAMENTO`
     - Cidadão é notificado
     - Chat é liberado para ambos
     - Outros matches pendentes do mesmo caso continuam ativos
   - ❌ **RECUSAR**: Match vira `RECUSADO`
     - Match é arquivado
     - Cidadão não é notificado da recusa
   - ⏰ **Não responder**: Após X horas (configurável), match vira `EXPIRADO`
     - Sistema pode criar novo match com outro advogado

### Diagrama de Estados do Match

```
PENDENTE → VISUALIZADO → ACEITO → CONTRATADO
    ↓           ↓           ↓
    └────→ RECUSADO    (fim do processo)
    ↓           ↓
    └────→ EXPIRADO
```

---

## 👥 Permissões de Usuários

### Cidadão NÃO PODE:
- ❌ Escolher advogados diretamente
- ❌ Enviar mensagem antes do advogado aceitar o match
- ❌ Ver advogados que recusaram ou não responderam
- ❌ Cancelar matches pendentes

### Cidadão PODE:
- ✅ Criar casos descrevendo seu problema
- ✅ Ver quais advogados aceitaram seu caso
- ✅ Conversar via chat após aceitação
- ✅ Escolher com qual advogado aceito deseja seguir (marcar como `CONTRATADO`)
- ✅ Avaliar advogados que aceitaram

### Advogado NÃO PODE:
- ❌ Ver casos antes de receber o match
- ❌ Aceitar casos que excedem seu limite mensal
- ❌ Responder após expiração do match

### Advogado PODE:
- ✅ Ver todos os matches recebidos (pendentes, aceitos, recusados)
- ✅ Aceitar ou recusar dentro do prazo
- ✅ Conversar via chat após aceitar
- ✅ Ver histórico de casos aceitos
- ✅ Ver avaliações recebidas

---

## ⏰ Expiração de Matches

### Configurações
- `match_expiration_hours`: Tempo para responder (padrão: 48h)
- `auto_expire_matches`: Se deve expirar automaticamente (padrão: true)
- `notify_match_expiring_hours`: Lembrete antes de expirar (padrão: 6h)

### Comportamento

1. **Quando um match é criado:**
   ```typescript
   expiresAt = enviadoEm + match_expiration_hours
   ```

2. **Sistema verifica periodicamente (cron job):**
   - Matches com `status = PENDENTE` ou `VISUALIZADO`
   - Onde `now() > expiresAt`
   - Muda status para `EXPIRADO`

3. **Lembrete antes de expirar:**
   - X horas antes de expirar (`notify_match_expiring_hours`)
   - Email para advogado: "Você tem X horas para responder"

4. **Após expiração:**
   - Match não pode mais ser aceito
   - Sistema pode criar novo match com outro advogado (se configurado)
   - Caso continua `ABERTO` se não tiver nenhum `ACEITO`

---

## 💬 Sistema de Chat

### Regra de Acesso
**Cidadão só pode enviar mensagem após advogado ACEITAR o match.**

### Configurações
- `chat_only_after_accept`: Bloquear chat antes de aceitar (padrão: true)
- `max_attachment_size_mb`: Tamanho máximo de anexo (padrão: 20 MB)

### Fluxo

1. **Antes da Aceitação (Match = PENDENTE ou VISUALIZADO)**
   - Cidadão vê: "Aguardando resposta do advogado"
   - Input de chat bloqueado
   - Advogado pode enviar mensagem inicial (opcional)

2. **Após Aceitação (Match = ACEITO)**
   - Ambos podem enviar mensagens livremente
   - Notificações em tempo real
   - Suporte a anexos (documentos, fotos)

3. **Após Contratação (Match = CONTRATADO)**
   - Chat continua ativo
   - Marcador especial de "Cliente"
   - Pode continuar comunicação até caso ser `FECHADO`

---

## ⭐ Avaliações

### Regras

1. **Quando cidadão pode avaliar:**
   - Apenas advogados que aceitaram o match (`status = ACEITO` ou `CONTRATADO`)
   - Após X dias da aceitação (`allow_reviews_after_days`, padrão: 1 dia)
   - Uma avaliação por advogado/caso

2. **Avaliação contém:**
   - Nota de 1 a 5 estrelas (obrigatório)
   - Comentário (opcional, configurável: `require_review_comment`)

3. **Impacto das avaliações:**
   - Afeta score de compatibilidade em futuros matches
   - Exibida no perfil público do advogado
   - Usada no algoritmo de ranking

---

## 💳 Planos e Limites

### Planos Disponíveis

| Plano | Leads/Mês | Preço | Recursos |
|-------|-----------|-------|----------|
| **FREE** | 3 | R$ 0 | Básico |
| **BASIC** | 10 | R$ 97 | + Destaque |
| **PREMIUM** | 50 | R$ 297 | + Prioridade + Estatísticas |

### Configurações de Limites
⚠️ **ATUALIZAÇÃO**: Limites agora são gerenciados pela tabela `planos` no banco de dados.
- FREE: 3 leads/mês (ACTIVE)
- BASIC: 10 leads/mês (COMING_SOON)
- PREMIUM: 50 leads/mês (COMING_SOON)
- UNLIMITED: ilimitado (HIDDEN)

Para atualizar: `npx tsx scripts/seed-all-plans.ts`

### Controle de Leads

```typescript
// Ao criar match, sistema verifica:
if (advogado.leadsRecebidosMes >= advogado.leadsLimiteMes) {
  // Não cria match para este advogado
  continue
}

// Incrementa contador
advogado.leadsRecebidosMes++
```

### Reset Mensal
- Campo `ultimoResetLeads` armazena última vez que resetou
- Cron job mensal reseta `leadsRecebidosMes = 0`

---

## 🔧 Configurações Importantes

### Matching
| Chave | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `match_expiration_hours` | NUMBER | 48 | Horas para responder |
| `max_matches_per_caso` | NUMBER | 5 | Máximo de advogados por caso |
| `min_match_score` | NUMBER | 60 | Score mínimo para match |
| `auto_expire_matches` | BOOLEAN | true | Expirar automaticamente |

### Notificações
| Chave | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `notify_match_created` | BOOLEAN | true | Email ao criar match |
| `notify_match_accepted` | BOOLEAN | true | Email ao aceitar |
| `notify_match_expiring_hours` | NUMBER | 6 | Lembrete antes de expirar |

### Chat
| Chave | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `chat_only_after_accept` | BOOLEAN | true | Bloquear antes de aceitar |
| `max_attachment_size_mb` | NUMBER | 20 | Tamanho máximo de anexo |

### Geral
| Chave | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `maintenance_mode` | BOOLEAN | false | Modo manutenção |
| `beta_mode` | BOOLEAN | true | Requer convite |

---

## 🔄 Fluxo Completo - Exemplo

### Cenário: João tem problema trabalhista

1. **João (cidadão) cria caso**
   - "Fui demitido sem receber minhas verbas rescisórias"
   - IA classifica: Trabalhista, Urgência ALTA

2. **Sistema cria 5 matches**
   - Busca advogados trabalhistas em SP
   - Cria matches com score >= 60
   - Define `expiresAt = now() + 48h`
   - Status: `PENDENTE`

3. **Advogados recebem notificação**
   - Maria, José, Ana, Carlos, Paula
   - Email: "Novo caso compatível com seu perfil"

4. **Maria abre o caso em 2h**
   - Status muda: `PENDENTE` → `VISUALIZADO`
   - Avalia detalhes do caso
   - Decide ACEITAR
   - Status muda: `VISUALIZADO` → `ACEITO`

5. **João é notificado**
   - "A advogada Maria aceitou seu caso!"
   - Chat liberado
   - Pode conversar com Maria

6. **José abre em 10h**
   - Decide ACEITAR também
   - João agora tem 2 advogados
   - Pode conversar com ambos

7. **Ana, Carlos e Paula**
   - Não respondem em 48h
   - Após 48h: Status → `EXPIRADO`
   - João não é notificado das expirações

8. **João escolhe Maria**
   - Marca match com Maria como `CONTRATADO`
   - Match com José continua `ACEITO` (backup)
   - Caso muda para `EM_ANDAMENTO`

9. **Após resolver o problema**
   - João marca caso como `FECHADO`
   - Pode avaliar Maria e José
   - Avaliações aparecem nos perfis

---

## 📊 Métricas e KPIs

### Para o Sistema
- Taxa de aceitação de matches
- Tempo médio de resposta dos advogados
- Taxa de expiração
- Conversão de `ACEITO` para `CONTRATADO`

### Para Advogados
- Leads recebidos vs aceitos
- Taxa de conversão (aceitos → contratados)
- Média de avaliações
- Tempo médio de resposta

### Para Cidadãos
- Tempo até primeiro aceite
- Número médio de aceites por caso
- Taxa de resolução

---

**Última atualização:** 30/01/2026
**Versão:** 1.0
