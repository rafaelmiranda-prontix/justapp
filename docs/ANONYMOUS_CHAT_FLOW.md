# Fluxo de Chat Anônimo - Lead Capture & Ativação

## 📋 Overview

Este documento descreve o **fluxo completo de chat anônimo** implementado conforme os Sprints 5 e 6 do plano original:

**Chat Anônimo → Lead Capture → Ativação por Email → Matching Automático**

Este fluxo permite que cidadãos comecem a conversar **sem cadastro prévio**, facilitando a conversão de visitantes em usuários qualificados.

---

## 🎯 Objetivo

Reduzir atrito na jornada do usuário ao:
1. Permitir conversa imediata (sem cadastro)
2. Qualificar leads durante a conversa
3. Capturar dados de contato no momento certo
4. Ativar conta por email
5. Distribuir automaticamente para advogados

---

## 🔄 Fluxo Completo

### **Etapa 1: Chat Anônimo na Homepage**

**Componentes:**
- [AnonymousChatButton](src/components/anonymous-chat/anonymous-chat-button.tsx) - Botão de CTA
- [AnonymousChatSheet](src/components/anonymous-chat/anonymous-chat-sheet.tsx) - Interface do chat
- [useAnonymousChat](src/hooks/use-anonymous-chat.ts) - Hook com lógica de estado

**API:**
- `POST /api/anonymous/session` - Cria nova sessão anônima

**Fluxo:**
1. Usuário clica em "Comece Agora - É Grátis" na homepage
2. **Analytics Event:** `anonymous_chat_opened`
3. Sistema cria sessão anônima com ID único
4. Sessão armazenada no `localStorage` (persiste entre recargas)
5. Bot envia mensagem de boas-vindas automática

**Dados da Sessão:**
```typescript
{
  sessionId: string        // Identificador único
  mensagens: Message[]     // Histórico completo
  status: 'ACTIVE'         // Status da sessão
  expiresAt: Date          // 7 dias de validade
  useAI: boolean           // false = pré-qualificação, true = IA
}
```

---

### **Etapa 2: Conversa e Pré-qualificação**

**Sistema Híbrido:**
- Usa **pré-qualificação sem IA** primeiro (economia de custos)
- Escalona para **IA** apenas se necessário
- Extrai especialidade, urgência e localização automaticamente

**API:**
- `POST /api/anonymous/message` - Envia mensagem e recebe resposta

**Fluxo:**
1. Usuário digita sua situação jurídica
2. **Analytics Event:** `anonymous_message_sent`
3. Sistema processa com [HybridChatService](src/lib/hybrid-chat.service.ts)
4. Bot responde e faz perguntas direcionadas
5. Extrai metadados: especialidade, cidade, estado, urgência

**Exemplo de Conversa:**
```
👤 User: Comprei um produto online que não chegou
🤖 Bot: Entendo. Para te ajudar melhor, em qual cidade você mora?
👤 User: Rio de Janeiro
🤖 Bot: Quando você fez a compra e quanto tempo se passou?
👤 User: Faz 30 dias e a loja não responde
🤖 Bot: [Detecta: Direito do Consumidor, Rio de Janeiro, Urgência Normal]
```

---

### **Etapa 3: Lead Capture**

**Quando Mostrar:**
- Após **3+ mensagens** do usuário
- Especialidade detectada
- Localização capturada

**Componente:**
- [LeadCaptureForm](src/components/anonymous-chat/lead-capture-form.tsx)

**API:**
- `POST /api/anonymous/convert` - Converte sessão em usuário

**Fluxo:**
1. Sistema detecta que lead está qualificado
2. **Analytics Event:** `lead_capture_shown`
3. Mostra formulário solicitando:
   - Nome completo
   - Email
   - Telefone (opcional)
4. Usuário preenche dados
5. **Analytics Event:** `lead_captured`
6. Sistema cria:
   - User (status: `PRE_ACTIVE`)
   - Cidadao (perfil)
   - Caso (status: `PENDENTE_ATIVACAO`)
7. Marca sessão como `CONVERTED`

**Validações:**
- Email não pode já estar cadastrado
- Nome deve ser completo (mínimo 2 palavras)
- Token de ativação válido por 48 horas

---

### **Etapa 4: Email de Ativação**

**Service:**
- [EmailService.sendActivationEmail()](src/lib/email.service.ts)

**Fluxo:**
1. Sistema gera `activationToken` único
2. **Analytics Event:** `activation_email_sent`
3. Envia email com link:
   ```
   https://seusite.com/auth/activate?token={TOKEN}
   ```
4. Email contém:
   - Resumo do caso
   - Link de ativação
   - Validade (48 horas)
5. Bot confirma: "📧 Enviamos um email para {email}"

**Template do Email:**
- Subject: "Ative sua conta no LegalConnect"
- Conteúdo: Resumo + CTA para ativar
- Link destacado e fácil de clicar

---

### **Etapa 5: Ativação da Conta**

**Página:**
- [/auth/activate](src/app/(auth)/auth/activate/page.tsx)

**API:**
- `POST /api/auth/activate` - Ativa conta e dispara matching

**Fluxo:**
1. Usuário clica no link do email
2. **Analytics Event:** `activation_email_opened`
3. Página solicita definição de senha
4. Usuário define senha (mín. 8 caracteres)
5. Sistema:
   - Atualiza User: `status = ACTIVE`, `emailVerified = now()`
   - Atualiza Caso: `status = ABERTO`
   - **Analytics Event:** `activation_completed`
6. **TRIGGER:** Dispara matching automático

---

### **Etapa 6: Matching Automático Pós-Ativação**

**Service:**
- [CaseDistributionService.distributeCase()](src/lib/case-distribution.service.ts)

**Fluxo:**
1. Após ativação bem-sucedida
2. **Analytics Event:** `activation_matching_triggered`
3. Sistema busca até 5 advogados compatíveis
4. Critérios de matching:
   - **Especialidade** (40 pontos)
   - **Localização** (30 pontos)
   - **Urgência** (10 pontos)
   - **Plano + Histórico** (20 pontos)
5. Cria Matches com status `PENDENTE`
6. Envia emails para advogados notificando novo lead
7. Caso muda para `EM_ANDAMENTO` quando primeiro advogado aceita

**Dados do Match:**
```typescript
{
  id: string
  casoId: string
  advogadoId: string
  score: number          // 0-100
  status: 'PENDENTE'
  distanciaKm: number    // Opcional
  enviadoEm: Date
  expiresAt: Date        // 48 horas
}
```

---

## 📊 Analytics e Funil de Conversão

### **Eventos Implementados**

Todos os eventos são disparados automaticamente:

| Evento | Quando | Dados |
|--------|--------|-------|
| `anonymous_chat_opened` | Chat aberto | - |
| `anonymous_message_sent` | Mensagem enviada | messageLength, messageNumber |
| `lead_capture_shown` | Formulário mostrado | messageCount, especialidade, score |
| `lead_captured` | Lead preenchido | email, hasPhone, especialidade, cidade, score |
| `activation_email_sent` | Email disparado | email |
| `activation_email_opened` | Link clicado | token |
| `activation_completed` | Conta ativada | userId, email, casosCount |
| `activation_matching_triggered` | Matching iniciado | userId, casoId, matchesCreated |

### **Dashboard de Conversão**

Acesse: [/admin/analytics](src/app/(admin)/admin/analytics/page.tsx)

**Métricas Disponíveis:**
- Total de sessões iniciadas
- Taxa de conversão (sessão → usuário)
- Média de mensagens antes da conversão
- Sessões abandonadas / expiradas
- Taxa de ativação de email

**API:**
- `GET /api/admin/analytics/conversion-funnel`

**Funil Visualizado:**
```
Chat Aberto → Lead Capturado → Email Enviado → Ativação → Matching
  100%            30%              30%           25%        25%
```

---

## 🗂️ Arquitetura de Arquivos

### **Serviços (Backend)**
```
src/lib/
├── anonymous-session.service.ts     # Gestão de sessões anônimas
├── hybrid-chat.service.ts           # Chat híbrido (pré-qual + IA)
├── pre-qualification/               # Sistema de pré-qualificação
├── case-distribution.service.ts     # Matching com advogados
├── email.service.ts                 # Envio de emails
├── notification.service.ts          # Notificações
└── analytics.ts                     # Eventos de analytics
```

### **APIs**
```
src/app/api/
├── anonymous/
│   ├── session/route.ts            # POST - Criar sessão
│   ├── message/route.ts            # POST - Enviar mensagem
│   └── convert/route.ts            # POST - Capturar lead
├── auth/
│   └── activate/route.ts           # POST - Ativar conta
└── admin/
    └── analytics/
        └── conversion-funnel/route.ts  # GET - Stats
```

### **Componentes (Frontend)**
```
src/components/anonymous-chat/
├── anonymous-chat-button.tsx       # Botão de CTA
├── anonymous-chat-sheet.tsx        # Interface do chat
├── chat-message.tsx                # Bolhas de mensagem
├── chat-input.tsx                  # Input de mensagem
├── lead-capture-form.tsx           # Formulário de captura
└── typing-indicator.tsx            # Indicador "digitando..."
```

### **Hooks**
```
src/hooks/
└── use-anonymous-chat.ts           # Lógica completa do chat
```

### **Páginas**
```
src/app/
├── (marketing)/
│   └── page.tsx                    # Homepage com chat
├── (auth)/
│   └── auth/activate/page.tsx      # Página de ativação
└── (admin)/
    └── admin/analytics/page.tsx    # Dashboard de conversão
```

---

## 🔐 Segurança e Validações

### **Sessões Anônimas**
- ✅ SessionId único (UUID)
- ✅ Expiração de 7 dias
- ✅ Rate limiting: 10 mensagens/minuto
- ✅ Armazenamento em localStorage (client-side)
- ✅ Limpeza automática de sessões expiradas

### **Lead Capture**
- ✅ Email único (verifica duplicatas)
- ✅ Nome completo obrigatório
- ✅ Token de ativação expira em 48h
- ✅ Senha mínima de 8 caracteres
- ✅ Transações atômicas (User + Cidadao + Caso)

### **Ativação**
- ✅ Token único e criptograficamente seguro
- ✅ Verificação de expiração
- ✅ Verificação de status (não permite re-ativação)
- ✅ Matching disparado apenas após ativação

---

## 📈 Otimizações Implementadas

### **Performance**
- ✅ Pré-qualificação sem IA (economia de custos)
- ✅ Lazy loading do chat
- ✅ Caching de sessões ativas
- ✅ Matching em background (não bloqueia ativação)
- ✅ Emails assíncronos

### **Conversão**
- ✅ Timing otimizado da captura (após 3 mensagens)
- ✅ Formulário simples (mínimo de campos)
- ✅ Mensagem de confirmação imediata
- ✅ Email com resumo do caso

### **UX**
- ✅ Sem cadastro inicial
- ✅ Conversa natural com bot
- ✅ Indicadores visuais (typing, loading)
- ✅ Persistência entre recargas
- ✅ Mobile-first design

---

## 🧪 Testando o Fluxo

### **1. Chat Anônimo**
```bash
# Abrir homepage
http://localhost:3000

# Clicar em "Comece Agora - É Grátis"
# Digitar mensagens de teste
# Verificar extração de dados
```

### **2. Lead Capture**
```bash
# Após 3 mensagens, formulário aparece
# Preencher: nome, email, telefone
# Verificar criação em banco:
SELECT * FROM users WHERE status = 'PRE_ACTIVE';
SELECT * FROM anonymous_sessions WHERE status = 'CONVERTED';
```

### **3. Ativação**
```bash
# Buscar link no log (ou email se configurado):
# Exemplo: http://localhost:3000/auth/activate?token=abc123...

# Abrir link
# Definir senha
# Verificar ativação e matching
```

### **4. Analytics**
```bash
# Acesso admin
http://localhost:3000/admin/analytics

# Verificar funil de conversão
# Conferir métricas
```

---

## 📝 Próximas Melhorias (Backlog)

### **Sprint 7 - WebSocket e Real-time**
- [ ] Substituir polling por WebSocket
- [ ] Notificações push em tempo real
- [ ] Status "online" dos advogados

### **Sprint 8 - A/B Testing**
- [ ] Variar timing da captura (3 vs 5 mensagens)
- [ ] Testar diferentes CTAs na homepage
- [ ] Testar formatos do formulário

### **Melhorias Futuras**
- [ ] Áudio/voz no chat anônimo
- [ ] Preview do email antes de enviar
- [ ] Reminder automático se não ativar em 24h
- [ ] Chat recovery (retomar conversa antiga)
- [ ] Integração com Google Analytics/PostHog

---

## 🎯 Métricas de Sucesso

### **Taxa de Conversão Ideal**
- **15-30%** sessões → usuários cadastrados
- **60-80%** emails abertos (ativação)
- **40-60%** ativações completadas
- **Média de 3-7 mensagens** antes da captura

### **Benchmarks Atuais**
Execute a query para ver suas métricas:

```sql
SELECT
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END) as converted,
  ROUND(COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END) * 100.0 / COUNT(*), 2) as conversion_rate
FROM anonymous_sessions;
```

---

## 📚 Referências

- [Sprint 4 - Case Distribution](./SPRINT_4_SUMMARY.md)
- [Sprint 5 - Chat System](./SPRINT_5_SUMMARY.md)
- [Sprint 6 - Dashboard Integration](./SPRINT_6_SUMMARY.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [PRD](./PRD.md)

---

**Status**: ✅ **COMPLETO** - Fluxo de chat anônimo totalmente implementado e documentado.

**Sprints Concluídos:**
- ✅ Sprint 5: Integração com Matching
- ✅ Sprint 6: Analytics e Otimização

**Próximo Passo:** Testar em produção e coletar métricas reais de conversão.
