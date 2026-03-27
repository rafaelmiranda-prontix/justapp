# CONTEXT.md — Contexto de Desenvolvimento

> Use este arquivo como referência ao desenvolver ou pedir ajuda com código.

---

## 📋 Resumo do Projeto

**Nome:** LegalConnect  
**Conceito:** Plataforma jurídica inteligente — marketplace que conecta cidadãos com problemas jurídicos a advogados especializados  
**Estágio:** MVP em desenvolvimento  
**Desenvolvedor:** Solo (Rafa)

**Catálogo do que já existe no código (cidadão, advogado, admin, chat, casos, N8N, suporte WhatsApp, APIs):** [FUNCIONALIDADES.md](./FUNCIONALIDADES.md).

---

## 🎯 Objetivo do MVP

Validar se advogados pagam por leads qualificados e se cidadãos usam a plataforma para encontrar advogados.

**Foco inicial:** Rio de Janeiro — Direito do Consumidor

**Escopo mínimo (custo baixo):**
1. Cidadão descreve problema (chat texto ou áudio) → sistema categoriza
2. Sistema sugere advogados compatíveis
3. Cidadão solicita contato
4. Advogado recebe lead e aceita/recusa
5. Comunicação entre as partes dentro da plataforma

---

## 🛠️ Stack Técnica

```
Frontend:     Next.js 14 (App Router) + TypeScript + Tailwind CSS
Backend:      Next.js API Routes (MVP) ou Fastify isolado
Database:     PostgreSQL + Prisma ORM
Auth:         NextAuth (custo zero inicial) ou Clerk (se necessário) + social signup
Pagamentos:   Stripe (ou Pagar.me para BR) — fase 2
Deploy:       VPS com Kubernetes (single cluster) + ingress + SSL
AI:           OpenAI/Claude API para análise de texto (com fallback rule-based)
Maps:         OpenStreetMap + Nominatim (MVP) ou Google Maps (se necessário)
```

---

## 📁 Estrutura de Pastas (sugestão)

```
legal-connect/
├── apps/
│   ├── web/                 # Next.js app (web + API)
│   │   ├── app/
│   │   │   ├── (auth)/      # Rotas de autenticação
│   │   │   ├── (cidadao)/   # Área do cidadão
│   │   │   ├── (advogado)/  # Área do advogado
│   │   │   ├── (admin)/     # Painel admin
│   │   │   └── api/         # API routes
│   │   ├── components/
│   │   ├── lib/
│   │   └── ...
│   └── mobile/              # React Native (fase 2)
├── packages/
│   ├── database/            # Prisma schema + migrations
│   ├── shared/              # Types, utils compartilhados
│   └── ai/                  # Lógica de análise jurídica
├── docs/
│   ├── PRD.md
│   └── CONTEXT.md
└── package.json             # Monorepo com pnpm/turborepo (opcional)
```

---

## 🗄️ Modelo de Dados (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== USUÁRIOS ====================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  phone         String?
  role          UserRole
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  cidadao       Cidadao?
  advogado      Advogado?
}

enum UserRole {
  CIDADAO
  ADVOGADO
  ADMIN
}

model Cidadao {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  
  // Localização
  cidade        String?
  estado        String?
  latitude      Float?
  longitude     Float?
  
  casos         Caso[]
  avaliacoes    Avaliacao[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Advogado {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id])
  
  // Profissional
  oab           String    @unique          // Ex: "SP123456"
  oabVerificado Boolean   @default(false)
  bio           String?
  fotoUrl       String?
  
  // Localização
  cidade        String
  estado        String
  latitude      Float?
  longitude     Float?
  raioAtuacao   Int       @default(50)     // km
  
  // Configurações
  especialidades AdvogadoEspecialidade[]
  precoConsulta  Float?
  aceitaOnline   Boolean  @default(true)
  
  // Assinatura
  plano         Plano     @default(FREE)
  planoExpira   DateTime?
  
  // Relacionamentos
  matches       Match[]
  avaliacoes    Avaliacao[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Plano {
  FREE
  BASIC
  PREMIUM
}

// ==================== ESPECIALIDADES ====================

model Especialidade {
  id            String    @id @default(cuid())
  nome          String    @unique           // "Direito do Consumidor"
  slug          String    @unique           // "consumidor"
  descricao     String?
  palavrasChave String[]                    // Para matching
  
  advogados     AdvogadoEspecialidade[]
  casos         Caso[]
}

model AdvogadoEspecialidade {
  advogadoId      String
  especialidadeId String
  advogado        Advogado      @relation(fields: [advogadoId], references: [id])
  especialidade   Especialidade @relation(fields: [especialidadeId], references: [id])
  
  @@id([advogadoId, especialidadeId])
}

// ==================== CASOS ====================

model Caso {
  id              String    @id @default(cuid())
  cidadaoId       String
  cidadao         Cidadao   @relation(fields: [cidadaoId], references: [id])
  
  // Descrição do problema
  descricao       String                    // Texto livre do usuário
  descricaoIA     String?                   // Resumo gerado por IA
  
  // Classificação (por IA)
  especialidadeId String?
  especialidade   Especialidade? @relation(fields: [especialidadeId], references: [id])
  urgencia        Urgencia  @default(NORMAL)
  complexidade    Int       @default(1)     // 1-5
  
  // Status
  status          CasoStatus @default(ABERTO)
  
  // Matches
  matches         Match[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum Urgencia {
  BAIXA
  NORMAL
  ALTA
  URGENTE
}

enum CasoStatus {
  ABERTO
  EM_ANDAMENTO
  FECHADO
  CANCELADO
}

// ==================== MATCHING ====================

model Match {
  id            String    @id @default(cuid())
  casoId        String
  caso          Caso      @relation(fields: [casoId], references: [id])
  advogadoId    String
  advogado      Advogado  @relation(fields: [advogadoId], references: [id])
  
  // Score de compatibilidade (0-100)
  score         Int
  distanciaKm   Float?
  
  // Status do match
  status        MatchStatus @default(PENDENTE)
  
  // Timestamps
  enviadoEm     DateTime  @default(now())
  visualizadoEm DateTime?
  respondidoEm  DateTime?
  
  mensagens     Mensagem[]
  
  @@unique([casoId, advogadoId])
}

enum MatchStatus {
  PENDENTE      // Aguardando advogado ver
  VISUALIZADO   // Advogado viu
  ACEITO        // Advogado aceitou
  RECUSADO      // Advogado recusou
  CONTRATADO    // Virou cliente
  EXPIRADO      // Tempo esgotado
}

// ==================== MENSAGENS ====================

model Mensagem {
  id          String    @id @default(cuid())
  matchId     String
  match       Match     @relation(fields: [matchId], references: [id])
  
  remetenteId String    // UserId
  conteudo    String
  lida        Boolean   @default(false)
  
  createdAt   DateTime  @default(now())
}

// ==================== AVALIAÇÕES ====================

model Avaliacao {
  id          String    @id @default(cuid())
  cidadaoId   String
  cidadao     Cidadao   @relation(fields: [cidadaoId], references: [id])
  advogadoId  String
  advogado    Advogado  @relation(fields: [advogadoId], references: [id])
  
  nota        Int                           // 1-5
  comentario  String?
  
  createdAt   DateTime  @default(now())
  
  @@unique([cidadaoId, advogadoId])
}
```

---

## 🔌 APIs Externas

### 1. Análise de Texto (IA)
```typescript
// Classificar problema jurídico
async function analisarProblema(descricao: string): Promise<{
  especialidade: string;
  resumo: string;
  urgencia: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  complexidade: number;
  perguntasAdicionais?: string[];
}> {
// Usar Claude/GPT com prompt específico
}
```

### 2. Geolocalização
```typescript
// Calcular distância e buscar advogados próximos
async function buscarAdvogadosProximos(
  latitude: number,
  longitude: number,
  especialidadeId: string,
  raioKm: number
): Promise<Advogado[]> {
// Query com PostGIS ou cálculo de Haversine
}
```

---

## 💸 Custos e Decisões de MVP

- **Infra inicial:** VPS com Kubernetes já disponível
- **Objetivo:** reduzir custos fixos, priorizando serviços gratuitos/open source
- **Preferências de custo:** OSM/Nominatim, e-mail transacional barato, auth open source
- **Chat in-app:** obrigatório para comunicação entre cidadão e advogado
- **Analytics:** PostHog (self-host) ou Plausible (phase 2)

---

## 📍 Foco Inicial

- **Cidade:** Rio de Janeiro
- **Especialidade principal:** Direito do Consumidor

---

## 🧭 Fluxo de Entrada (Cidadão)

- **Formato:** chat (texto ou áudio)
- **Perguntas mínimas:** coletar apenas o essencial para triagem
- **Identificação:** nome + e-mail ou telefone
- **Social signup:** permitido
- **Roteiro base:** 3 perguntas objetivas + confirmação de envio
- **Regras de direcionamento:** relação de consumo + fato + data; fora do RJ não encaminha
- **Social signup:** Google (MVP); Apple se necessário; OTP SMS/magic link como fallback

---

## 🎤 Áudio (MVP)

- **Upload:** direto para a VPS (API)
- **Formato:** `ogg/opus` 24–32 kbps
- **Compressão:** `opus` com bitrate baixo
- **Limites:** duração curta (60–90s) e tamanho máximo
- **Transcrição:** via recurso do navegador (ex.: plugin do Chrome/Web Speech API) no PWA; se indisponível, pedir resumo em texto

---

## 💬 Chat In-App (MVP)

- **Abertura:** somente após advogado aceitar o caso
- **Mensagens:** texto + anexos (imagem/PDF)
- **Limites:** 2.000 caracteres por mensagem; 20MB por arquivo; 10 mensagens/minuto

---

## 👤 Perfil Público do Advogado (MVP)

- **Campos exibidos:** foto, nome, especialidade, cidade

---

## 🎨 Design System (Sugestão)

- **UI Library:** shadcn/ui (componentes copiáveis, Tailwind-based)
- **Icons:** Lucide React
- **Cores:**
  ```css
  --primary: #2563eb;      /* Azul confiança */
  --secondary: #64748b;    /* Cinza neutro */
  --accent: #10b981;       /* Verde sucesso */
  --destructive: #ef4444;  /* Vermelho erro */
  ```
- **Tipografia:** Inter (clean, profissional)

---

## 🚀 Setup Inicial

```bash
# Criar projeto
npx create-next-app@latest legal-connect --typescript --tailwind --app

# Dependências principais
pnpm add @prisma/client @clerk/nextjs
pnpm add -D prisma

# Iniciar Prisma
npx prisma init

# UI
pnpm dlx shadcn-ui@latest init
```

---

## 📝 Convenções de Código

- **Linguagem:** TypeScript strict mode
- **Formatação:** Prettier + ESLint
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **Branches:** `main` → `develop` → `feature/xxx`
- **Testes:** Vitest + Testing Library (quando aplicável)

---

## 🔐 Variáveis de Ambiente

```env
# .env.example

# Database
DATABASE_URL="postgresql://..."

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# AI
OPENAI_API_KEY=sk-...
# ou
ANTHROPIC_API_KEY=sk-ant-...

# Maps
GOOGLE_MAPS_API_KEY=...

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_SUPPORT=5511999999999
```

---

## ❓ Perguntas para Desenvolvimento

Ao pedir ajuda com código, inclua:

1. **Qual feature/componente** está trabalhando?
2. **Código atual** (se houver)
3. **Erro ou comportamento** inesperado
4. **O que já tentou**

---

*Atualizar conforme o projeto evolui.*

**Última atualização:** 2026-01-29
