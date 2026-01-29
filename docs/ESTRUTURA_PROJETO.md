# Estrutura do Projeto LegalMatch

```
legal-match/
│
├── 📄 Configuração Base
│   ├── package.json              # Dependências e scripts
│   ├── package-lock.json         # Lock de dependências
│   ├── tsconfig.json             # Config TypeScript
│   ├── next.config.js            # Config Next.js
│   ├── tailwind.config.ts        # Config Tailwind + Design System
│   ├── postcss.config.js         # Processamento CSS
│   ├── .eslintrc.json           # Regras ESLint
│   ├── .prettierrc              # Formatação Prettier
│   ├── .gitignore               # Arquivos ignorados
│   ├── .env.example             # Template variáveis ambiente
│   └── README.md                # Guia inicial
│
├── 📚 Documentação (docs/)
│   ├── FASE_0_COMPLETA.md       # Resumo da Fase 0
│   ├── ARCHITECTURE.md          # Arquitetura e padrões
│   ├── GOOGLE_OAUTH_SETUP.md    # Setup OAuth
│   ├── COMANDOS_UTEIS.md        # Comandos úteis
│   └── ESTRUTURA_PROJETO.md     # Este arquivo
│
├── 🗄️ Database (prisma/)
│   ├── schema.prisma            # Schema do banco
│   └── seed.ts                  # Dados iniciais
│
├── 🔧 Scripts (scripts/)
│   └── check-setup.sh           # Verificação do setup
│
└── 📦 Source (src/)
    │
    ├── 🎨 App (app/)
    │   ├── layout.tsx           # Layout raiz com providers
    │   ├── page.tsx             # Página inicial
    │   ├── globals.css          # Estilos globais + CSS Variables
    │   │
    │   └── api/                 # API Routes
    │       └── auth/
    │           └── [...nextauth]/
    │               └── route.ts # NextAuth endpoints
    │
    ├── 🧩 Componentes (components/)
    │   ├── providers.tsx        # React Query + NextAuth providers
    │   │
    │   └── ui/                  # Design System (shadcn/ui)
    │       ├── button.tsx       # Botão com variantes
    │       ├── input.tsx        # Input de formulário
    │       ├── label.tsx        # Label para inputs
    │       ├── card.tsx         # Card componentizado
    │       ├── toast.tsx        # Notificação toast
    │       └── toaster.tsx      # Container de toasts
    │
    ├── 🪝 Hooks (hooks/)
    │   ├── use-toast.ts         # Sistema de notificações
    │   ├── use-media-query.ts   # Queries de responsividade
    │   ├── use-debounce.ts      # Debounce de valores
    │   └── use-local-storage.ts # Persistência local
    │
    ├── 🛠️ Bibliotecas (lib/)
    │   ├── prisma.ts            # Cliente Prisma singleton
    │   ├── auth.ts              # Configuração NextAuth
    │   └── utils.ts             # Funções utilitárias
    │
    └── 📐 Types (types/)
        ├── index.ts             # Tipos principais
        └── next-auth.d.ts       # Extensões NextAuth

```

## Estatísticas

### Arquivos Criados
- **Total:** 35 arquivos
- **TypeScript/TSX:** 21 arquivos
- **Documentação:** 6 arquivos
- **Configuração:** 8 arquivos

### Linhas de Código
- **TypeScript/TSX:** ~2000 linhas
- **Documentação:** ~1500 linhas
- **Total:** ~3500 linhas

### Componentes
- **UI Base:** 6 componentes
- **Hooks:** 4 hooks customizados
- **Providers:** 1 provider principal

### Database
- **Modelos:** 9 modelos
- **Enums:** 5 enums
- **Relações:** 12 relações

## Próximas Adições (Fase 1)

```
src/app/
├── (auth)/                      # 🔐 Autenticação
│   ├── signin/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── error/
│       └── page.tsx
│
├── (cidadao)/                   # 👤 Área do Cidadão
│   ├── dashboard/
│   │   └── page.tsx
│   ├── novo-caso/
│   │   └── page.tsx
│   └── casos/
│       └── [id]/
│           └── page.tsx
│
├── (advogado)/                  # ⚖️ Área do Advogado
│   ├── dashboard/
│   │   └── page.tsx
│   ├── perfil/
│   │   └── page.tsx
│   └── leads/
│       └── [id]/
│           └── page.tsx
│
└── api/                         # 🔌 API Routes
    ├── users/
    │   └── route.ts
    ├── casos/
    │   └── route.ts
    └── matches/
        └── route.ts
```

## Tecnologias por Camada

### Frontend
```
Next.js 16.1.6
├── React 18.2
├── TypeScript 5
└── Tailwind CSS 3
    ├── shadcn/ui
    ├── Radix UI
    └── Lucide Icons
```

### Backend
```
Next.js API Routes
├── NextAuth.js 4.24.5
├── Prisma 5.9.1
└── PostgreSQL
```

### State Management
```
Client State
├── Zustand 4.5.0
└── React Query 5.20.1
```

### Forms & Validation
```
React Hook Form 7.50.1
├── Zod 3.22.4
└── @hookform/resolvers 3.3.4
```

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────┐
│                   Client (Browser)                   │
├─────────────────────────────────────────────────────┤
│  React Components  →  Hooks  →  React Query         │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│              Next.js API Routes (Server)             │
├─────────────────────────────────────────────────────┤
│  Route Handlers  →  Business Logic  →  Validation   │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│                 Prisma Client (ORM)                  │
├─────────────────────────────────────────────────────┤
│  Query Builder  →  Type Safety  →  Migrations       │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│                  PostgreSQL Database                 │
└─────────────────────────────────────────────────────┘
```

## Convenções de Nomenclatura

### Arquivos
```
ComponentName.tsx       # Componentes
use-custom-hook.ts      # Hooks
route.ts                # API Routes
layout.tsx              # Layouts
page.tsx                # Páginas
```

### Pastas
```
(grupo)/                # Route groups (não afeta URL)
[param]/                # Parâmetros dinâmicos
[...slug]/              # Catch-all routes
```

### Código
```typescript
// Componentes
export function UserCard() {}

// Hooks
export function useUser() {}

// Utilitários
export function formatDate() {}

// Tipos
export type UserWithRole = {}
```

## Path Aliases

Configurados no `tsconfig.json`:

```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import type { User } from '@/types'
```

Benefícios:
- ✅ Imports mais limpos
- ✅ Refatoração mais fácil
- ✅ Menos erros de path relativo

## Design System Tokens

### Cores (CSS Variables)
```css
--primary: #2563eb       /* Azul confiança */
--secondary: #64748b     /* Cinza neutro */
--accent: #10b981        /* Verde sucesso */
--destructive: #ef4444   /* Vermelho erro */
--muted: #f1f5f9         /* Cinza claro */
```

### Espaçamento (Tailwind)
```
spacing: {
  px: '1px',
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  ...
}
```

### Tipografia
```
fontFamily: {
  sans: ['Inter', 'sans-serif']
}
```

## Status do Projeto

### ✅ Completo (Fase 0)
- Configuração base
- Database schema
- Autenticação
- Design System
- Documentação

### 🚧 Em Desenvolvimento (Fase 1)
- Cadastros
- Perfis
- Autenticação social

### 📋 Planejado
- Chat
- Matching
- Pagamentos
- Dashboard
- Analytics

## Links Úteis

- [README.md](../README.md) - Guia de início
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura detalhada
- [COMANDOS_UTEIS.md](./COMANDOS_UTEIS.md) - Comandos do dia a dia
- [PRD.md](../PRD.md) - Product Requirements
- [CONTEXT.md](../CONTEXT.md) - Contexto técnico
