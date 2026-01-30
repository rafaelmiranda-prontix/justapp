# Fluxo de Chat Anônimo - LegalConnect

## 🎯 Objetivo

Permitir que usuários anônimos comecem a descrever seu problema jurídico imediatamente, sem cadastro prévio, aumentando a taxa de conversão de visitantes para leads qualificados.

---

## 📊 Fluxo Completo

### Fase 1: Início da Conversa (Anônimo)

```
Visitante acessa homepage
    ↓
Clica em "Comece Agora" (ou "Conte seu Problema")
    ↓
Chat anônimo abre instantaneamente
    ↓
Sistema gera sessionId único
    ↓
Armazena em cookie/localStorage
    ↓
Visitante começa a digitar seu problema
    ↓
IA responde e faz perguntas qualificadoras
```

**Dados armazenados:**
- `sessionId`: Identificador único da sessão
- `mensagens[]`: Array de mensagens da conversa
- `timestamp`: Data/hora de início
- `userAgent`: Browser/dispositivo
- `ipAddress`: IP do visitante (para analytics)

### Fase 2: Qualificação via Chat

IA faz perguntas estratégicas para:
- Entender o problema
- Classificar especialidade
- Avaliar urgência
- Capturar localização (cidade/estado)
- Avaliar complexidade

**Exemplo de conversa:**
```
IA: Olá! Vou te ajudar a encontrar o advogado certo.
    Pode me contar resumidamente qual é o seu problema?

Usuário: Fui demitido e não recebi minhas verbas rescisórias

IA: Entendo, é uma situação trabalhista.
    Há quanto tempo você foi demitido?

Usuário: 3 meses

IA: E você tentou contato com a empresa?

Usuário: Sim, várias vezes mas eles não respondem

IA: Certo! Em qual cidade você mora?

Usuário: São Paulo, SP

IA: Perfeito! Tenho advogados especializados em direito
    trabalhista em São Paulo que podem te ajudar.

    Para conectar você com os melhores profissionais,
    preciso de algumas informações:
```

### Fase 3: Captura de Lead (Momento Crítico)

**Momento ideal:** Após 3-5 mensagens, quando usuário já está engajado.

**Gatilhos para solicitar dados:**
- Usuário fez 3+ mensagens
- IA identificou especialidade
- IA avaliou viabilidade do caso
- Usuário demonstrou interesse (continua respondendo)

**UI de captura:**
```
┌─────────────────────────────────────────┐
│ 🎯 Encontramos 5 advogados              │
│    especializados para seu caso!        │
│                                         │
│ Para conectar você com eles:           │
│                                         │
│ Nome: [____________]                    │
│ Email: [____________]                   │
│ Telefone: [____________] (opcional)     │
│                                         │
│ [Continuar]                             │
│                                         │
│ 🔒 Seus dados estão seguros            │
└─────────────────────────────────────────┘
```

### Fase 4: Criação de Usuário Pré-ativo

**Ao capturar nome + email:**

1. **Criar usuário no banco:**
   ```typescript
   {
     email: "usuario@email.com",
     name: "João Silva",
     phone: "11999999999", // opcional
     role: "CIDADAO",
     emailVerified: null, // ainda não verificou
     password: null, // será gerado após ativação
     status: "PRE_ACTIVE", // novo status
   }
   ```

2. **Criar cidadão associado:**
   ```typescript
   {
     userId: user.id,
     cidade: "São Paulo", // capturado no chat
     estado: "SP",
   }
   ```

3. **Criar caso com conversa:**
   ```typescript
   {
     cidadaoId: cidadao.id,
     descricao: "Transcrição da conversa do chat",
     descricaoIA: "Resumo gerado pela IA",
     especialidadeId: "trabalhista",
     urgencia: "ALTA",
     status: "PENDENTE_ATIVACAO", // novo status
     sessionId: "abc123", // referência da sessão anônima
   }
   ```

4. **Enviar email de ativação:**
   ```
   Assunto: Complete seu cadastro - LegalConnect

   Olá João!

   Recebemos sua solicitação e já identificamos advogados
   especializados para seu caso:

   📋 Seu problema: Questão trabalhista
   📍 Localização: São Paulo, SP
   ⚡ Urgência: Alta

   Para conectar você com os advogados, precisamos que
   você confirme seu email e crie uma senha:

   [Ativar Minha Conta]

   Este link expira em 48 horas.
   ```

### Fase 5: Ativação da Conta

**Usuário clica no link do email:**

1. Redireciona para `/ativar-conta?token=xxx`
2. Formulário simples:
   ```
   Bem-vindo de volta, João!

   Crie uma senha para acessar sua conta:

   Senha: [____________]
   Confirmar: [____________]

   [Ativar e Ver Advogados]
   ```

3. **Ao ativar:**
   - Atualiza `emailVerified = now()`
   - Cria hash da senha
   - Muda status: `PRE_ACTIVE` → `ACTIVE`
   - Muda caso: `PENDENTE_ATIVACAO` → `ABERTO`
   - Faz login automático
   - Redireciona para `/cidadao/dashboard`

### Fase 6: Distribuição de Matches

**Após ativação, sistema automaticamente:**

1. **Executa algoritmo de matching:**
   - Busca advogados por especialidade
   - Filtra por localização
   - Calcula score de compatibilidade
   - Respeita limites de leads
   - Cria até 5 matches

2. **Cria matches:**
   ```typescript
   {
     casoId: caso.id,
     advogadoId: advogado.id,
     score: 85,
     status: "PENDENTE",
     expiresAt: now() + 48h,
   }
   ```

3. **Notifica advogados:**
   - Email: "Novo caso compatível"
   - Push notification (se configurado)

4. **Cidadão vê no dashboard:**
   - "Seu caso foi enviado para 5 advogados especializados"
   - "Aguarde até 48h para respostas"
   - Pode ver status em tempo real

---

## 🗄️ Estrutura de Dados

### 1. Tabela `anonymous_sessions`

```prisma
model AnonymousSession {
  id        String   @id @default(cuid())
  sessionId String   @unique // Cookie/localStorage

  // Dados capturados
  mensagens Json[] // Array de {role, content, timestamp}
  userAgent String?
  ipAddress String?

  // Geolocalização estimada
  cidade    String?
  estado    String?

  // Status
  status    SessionStatus @default(ACTIVE)
  convertedToCasoId String? @unique

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  expiresAt DateTime // 7 dias

  @@index([sessionId])
  @@index([status])
  @@map("anonymous_sessions")
}

enum SessionStatus {
  ACTIVE      // Conversando
  CONVERTED   // Virou caso
  ABANDONED   // Abandonou (7 dias sem atividade)
  EXPIRED     // Expirou
}
```

### 2. Atualização em `User`

```prisma
model User {
  // ... campos existentes

  status UserStatus @default(ACTIVE)
  activationToken String? @unique
  activationExpires DateTime?

  @@map("users")
}

enum UserStatus {
  PRE_ACTIVE  // Criado mas não ativou
  ACTIVE      // Ativado e funcionando
  SUSPENDED   // Suspenso
  DELETED     // Deletado (soft delete)
}
```

### 3. Atualização em `Caso`

```prisma
model Caso {
  // ... campos existentes

  sessionId String? // Referência da sessão anônima

  @@index([sessionId])
  @@map("casos")
}

enum CasoStatus {
  PENDENTE_ATIVACAO // Esperando ativação do usuário
  ABERTO            // Ativo e distribuído
  EM_ANDAMENTO      // Advogado aceitou
  FECHADO           // Resolvido
  CANCELADO         // Cancelado
}
```

---

## 🎨 Componentes de UI

### 1. Homepage - CTA Principal

```tsx
// src/app/(marketing)/page.tsx
<section className="hero">
  <h1>Encontre o Advogado Certo para seu Caso</h1>
  <p>Conte seu problema e conecte-se com especialistas em minutos</p>

  <button onClick={() => openAnonymousChat()}>
    Comece Agora - É Grátis
  </button>

  <div className="trust-badges">
    ✓ Sem cadastro inicial
    ✓ Resposta em minutos
    ✓ 100% gratuito para você
  </div>
</section>
```

### 2. Modal/Sheet de Chat Anônimo

```tsx
// src/components/anonymous-chat.tsx
<Sheet open={isOpen}>
  <SheetContent side="right" className="w-full sm:max-w-lg">
    <ChatHeader>
      <Avatar>🤖</Avatar>
      <div>
        <h3>Assistente Legal</h3>
        <span>Online agora</span>
      </div>
    </ChatHeader>

    <ChatMessages>
      {messages.map(msg => (
        <Message key={msg.id} role={msg.role}>
          {msg.content}
        </Message>
      ))}
    </ChatMessages>

    {showLeadCapture && (
      <LeadCaptureForm onSubmit={handleLeadCapture} />
    )}

    {!showLeadCapture && (
      <ChatInput onSend={handleSendMessage} />
    )}
  </SheetContent>
</Sheet>
```

### 3. Formulário de Captura de Lead

```tsx
// src/components/lead-capture-form.tsx
<form onSubmit={onSubmit}>
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
    <div className="flex items-center gap-3 mb-4">
      <CheckCircle className="text-green-500" />
      <div>
        <h3>Encontramos {matchCount} advogados especializados!</h3>
        <p className="text-sm text-muted-foreground">
          Para conectar você com eles:
        </p>
      </div>
    </div>

    <Input
      label="Seu nome"
      placeholder="João Silva"
      required
    />

    <Input
      label="Seu email"
      placeholder="joao@email.com"
      type="email"
      required
    />

    <Input
      label="Telefone (opcional)"
      placeholder="(11) 99999-9999"
    />

    <Button type="submit" className="w-full">
      Conectar com Advogados
    </Button>

    <p className="text-xs text-center text-muted-foreground mt-4">
      🔒 Seus dados estão seguros e não serão compartilhados
    </p>
  </div>
</form>
```

### 4. Página de Ativação

```tsx
// src/app/ativar-conta/page.tsx
<div className="min-h-screen flex items-center justify-center">
  <Card className="max-w-md w-full">
    <CardHeader>
      <Avatar className="mx-auto mb-4">
        <CheckCircle className="text-green-500" />
      </Avatar>
      <CardTitle>Bem-vindo de volta, {user.name}!</CardTitle>
      <CardDescription>
        Crie uma senha para acessar sua conta e conversar
        com os advogados especializados
      </CardDescription>
    </CardHeader>

    <CardContent>
      <form onSubmit={handleActivation}>
        <PasswordInput
          label="Crie uma senha"
          value={password}
          onChange={setPassword}
          minLength={6}
        />

        <PasswordInput
          label="Confirme a senha"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />

        <Button type="submit" className="w-full">
          Ativar e Ver Meus Advogados
        </Button>
      </form>
    </CardContent>
  </Card>
</div>
```

---

## 🔄 APIs Necessárias

### 1. POST `/api/anonymous/session`
Cria nova sessão anônima

**Request:**
```json
{}
```

**Response:**
```json
{
  "sessionId": "abc123",
  "expiresAt": "2026-02-06T12:00:00Z"
}
```

### 2. POST `/api/anonymous/message`
Envia mensagem no chat anônimo

**Request:**
```json
{
  "sessionId": "abc123",
  "message": "Fui demitido sem receber verbas"
}
```

**Response:**
```json
{
  "reply": "Entendo, é uma situação trabalhista. Há quanto tempo...",
  "shouldCaptureLeadData": false,
  "estimatedMatches": 0
}
```

### 3. POST `/api/anonymous/convert`
Converte sessão anônima em usuário + caso

**Request:**
```json
{
  "sessionId": "abc123",
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Enviamos um email para joao@email.com",
  "userId": "user_123"
}
```

### 4. POST `/api/auth/activate`
Ativa conta com token do email

**Request:**
```json
{
  "token": "activation_token_123",
  "password": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "joao@email.com",
    "name": "João Silva"
  }
}
```

---

## 📈 Métricas e Analytics

### KPIs Importantes

1. **Taxa de Início de Conversa**
   - % de visitantes que clicam "Comece Agora"
   - Meta: > 20%

2. **Taxa de Engajamento**
   - % que enviam 3+ mensagens
   - Meta: > 60%

3. **Taxa de Conversão (Lead)**
   - % que fornecem email
   - Meta: > 40%

4. **Taxa de Ativação**
   - % que clicam no email e ativam
   - Meta: > 70%

5. **Tempo Médio até Lead**
   - Minutos do início até fornecer email
   - Meta: < 5 minutos

6. **Taxa de Abandono**
   - % que abandonam sem converter
   - Meta: < 40%

### Eventos para Trackear

```typescript
// Analytics events
trackEvent('anonymous_chat_opened')
trackEvent('anonymous_message_sent', { messageCount: 1 })
trackEvent('lead_capture_shown')
trackEvent('lead_captured', { source: 'anonymous_chat' })
trackEvent('activation_email_sent')
trackEvent('activation_completed')
trackEvent('first_match_created')
```

---

## 🎯 Vantagens deste Fluxo

### Para o Usuário:
✅ Zero fricção inicial - começa conversando
✅ Não precisa entender categorias legais
✅ IA guia e qualifica automaticamente
✅ Só fornece dados quando já está engajado
✅ Email de ativação evita spam

### Para o Negócio:
✅ Maior taxa de conversão (3-5x)
✅ Leads mais qualificados
✅ Menos abandono no cadastro
✅ Dados ricos sobre o problema
✅ Email verificado garantido
✅ Usuários mais engajados

### Para os Advogados:
✅ Recebem casos com contexto completo
✅ Leads já qualificados e interessados
✅ Histórico da conversa disponível
✅ Maior taxa de conversão em clientes

---

## 🔐 Segurança e Privacidade

### Dados Anônimos
- Sessões expiram em 7 dias
- Armazenar mínimo necessário
- Não associar IP permanentemente
- LGPD compliant

### Email de Ativação
- Token único e seguro
- Expira em 48 horas
- Um uso apenas
- Hash bcrypt após ativação

### Proteção contra Spam
- Rate limiting: 10 mensagens/minuto
- Captcha após 5 mensagens (se suspeito)
- Validação de email real
- Blacklist de domínios temporários

---

## 📅 Plano de Implementação

### Sprint 1: Fundação (Semana 1)
- [ ] Criar schema do banco (AnonymousSession)
- [ ] API de sessão anônima
- [ ] API de mensagens
- [ ] Componente de chat básico

### Sprint 2: IA e Qualificação (Semana 2)
- [ ] Integrar IA para respostas
- [ ] Lógica de qualificação
- [ ] Detectar momento de captura
- [ ] Estimar número de matches

### Sprint 3: Conversão (Semana 3)
- [ ] Formulário de captura
- [ ] API de conversão
- [ ] Sistema de email de ativação
- [ ] Página de ativação

### Sprint 4: Integração (Semana 4)
- [ ] Conectar com sistema de matching
- [ ] Dashboard do cidadão
- [ ] Notificações para advogados
- [ ] Testes end-to-end

### Sprint 5: Analytics e Otimização (Semana 5)
- [ ] Implementar tracking
- [ ] A/B tests
- [ ] Otimizar taxa de conversão
- [ ] Documentação final

---

**Próximos Passos:** Implementar Sprint 1 - Fundação
