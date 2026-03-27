# Arquitetura do Projeto LegalConnect

## Visão Geral

O LegalConnect / JustApp é construído com **Next.js** (App Router), TypeScript e Prisma, com APIs em `src/app/api/` e painéis por perfil em `src/app/(cidadao)`, `(advogado)` e `(admin)`. O catálogo funcional atual está em [FUNCIONALIDADES.md](FUNCIONALIDADES.md).

## Princípios Arquiteturais

### 1. Separação de Responsabilidades

- **Apresentação:** Componentes React (`src/components/`)
- **Lógica de Negócio:** Hooks customizados (`src/hooks/`)
- **Acesso a Dados:** Prisma Client (`src/lib/prisma.ts`)
- **Rotas API:** Next.js API Routes (`src/app/api/`)

### 2. Composição de Componentes

Utilizamos o padrão de composição com shadcn/ui, permitindo:
- Reusabilidade máxima
- Customização fácil
- Código limpo e legível

### 3. Type Safety

- TypeScript strict mode habilitado
- Tipos derivados do Prisma Schema
- Validação com Zod nos formulários

## Estrutura de Pastas

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Grupo de rotas de autenticação
│   ├── (cidadao)/           # Área do cidadão
│   ├── (advogado)/          # Área do advogado
│   ├── (admin)/             # Painel administrativo
│   ├── api/                 # API Routes (auth, casos, chat, n8n, suporte, stripe…)
│   │   └── auth/            # NextAuth endpoints
│   ├── layout.tsx           # Layout raiz
│   ├── page.tsx             # Página inicial
│   └── globals.css          # Estilos globais
│
├── components/              # Componentes React
│   ├── ui/                  # Componentes base (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── forms/               # Componentes de formulário
│   ├── layout/              # Componentes de layout
│   └── providers.tsx        # Context providers
│
├── hooks/                   # Custom hooks
│   ├── use-toast.ts
│   ├── use-media-query.ts
│   ├── use-debounce.ts
│   └── use-local-storage.ts
│
├── lib/                     # Utilitários e configurações
│   ├── prisma.ts            # Cliente Prisma
│   ├── auth.ts              # Configuração NextAuth
│   ├── integration-auth.ts # Chave + JWT para /api/suporte/*
│   ├── n8n-auth.ts         # Chave para /api/n8n/*
│   ├── support/             # Normalização e identify-user (suporte)
│   └── utils.ts             # Funções utilitárias
│
└── types/                   # Definições de tipos
    ├── index.ts             # Tipos principais
    └── next-auth.d.ts       # Extensões NextAuth
```

## Padrões de Código

### Componentes

```typescript
// ✅ BOM: Componente funcional com tipos explícitos
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
}

export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  return (
    <button className={cn('btn', `btn-${variant}`)} onClick={onClick}>
      {children}
    </button>
  )
}

// ❌ RUIM: Sem tipos, props implícitas
export function Button(props) {
  return <button {...props} />
}
```

### Hooks Customizados

```typescript
// ✅ BOM: Hook com tipo de retorno explícito
export function useUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // lógica...
  }, [])

  return { user, loading }
}
```

### API Routes

Rotas REST ficam em `src/app/api/**/route.ts`. Domínios principais:

- **Auth / usuários:** NextAuth, cadastro, ativação.
- **Casos e mediação:** CRUD e mensagens admin/cidadão.
- **Chat:** mensagens por `matchId`, anexos quando configurados.
- **N8N:** listagem de pré-aprovados e confirmação de aprovação (`n8n-auth`).
- **Suporte WhatsApp:** `POST /api/suporte/identify-user`, `contacts`, `messages` (`integration-auth`); leitura admin em `/api/admin/suporte/*`.
- **Pagamentos / cron / notificações:** conforme módulos em `api/`.

```typescript
// ✅ BOM: Type-safe API route com validação
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const user = await prisma.user.create({ data })

    return Response.json({ success: true, data: user })
  } catch (error) {
    return Response.json({ success: false, error: 'Invalid data' }, { status: 400 })
  }
}
```

### Prisma Queries

```typescript
// ✅ BOM: Queries tipadas e reutilizáveis
export async function getAdvogadoPublico(id: string): Promise<AdvogadoPublic> {
  const advogado = await prisma.advogado.findUnique({
    where: { id },
    include: {
      user: true,
      especialidades: { include: { especialidade: true } },
      avaliacoes: true,
    },
  })

  if (!advogado) throw new Error('Advogado não encontrado')

  return {
    id: advogado.id,
    nome: advogado.user.name,
    foto: advogado.fotoUrl,
    cidade: advogado.cidade,
    // ...
  }
}
```

## Design System

### Cores

Definidas no `globals.css` usando CSS variables:

- `--primary`: Azul confiança (#2563eb)
- `--secondary`: Cinza neutro
- `--accent`: Verde sucesso (#10b981)
- `--destructive`: Vermelho erro

### Componentes Base

Todos os componentes UI seguem o padrão shadcn/ui:
- Baseados em Radix UI
- Estilizados com Tailwind CSS
- Variantes com `class-variance-authority`
- Totalmente customizáveis

### Tipografia

Fonte: **Inter** (clean, profissional)

## State Management

### Client State

- **Local:** `useState`, `useReducer`
- **Global:** Zustand para estados complexos
- **Server Cache:** React Query

### Server State

- **Fetching:** React Query com hooks customizados
- **Mutations:** React Query mutations
- **Optimistic Updates:** Quando aplicável

## Boas Práticas

### 1. Nomenclatura

- Componentes: `PascalCase` (ex: `UserCard.tsx`)
- Hooks: `camelCase` com prefixo `use` (ex: `useUser.ts`)
- Utilitários: `camelCase` (ex: `formatDate`)
- Tipos: `PascalCase` (ex: `UserWithRole`)

### 2. Imports

```typescript
// Ordem de imports
import { useState } from 'react' // 1. React
import { useQuery } from '@tanstack/react-query' // 2. Libs externas
import { Button } from '@/components/ui/button' // 3. Componentes
import { cn } from '@/lib/utils' // 4. Utilitários
import type { User } from '@/types' // 5. Tipos
```

### 3. Error Handling

```typescript
// ✅ BOM: Try-catch com mensagens claras
try {
  await createUser(data)
  toast({ title: 'Sucesso', description: 'Usuário criado!' })
} catch (error) {
  toast({
    title: 'Erro',
    description: error instanceof Error ? error.message : 'Erro desconhecido',
    variant: 'destructive',
  })
}
```

### 4. Performance

- Lazy loading de componentes pesados
- Memoização com `useMemo` e `useCallback` quando necessário
- React Query para cache de dados do servidor
- Debounce em inputs de busca

## Segurança

### Autenticação

- NextAuth.js com sessões no banco
- Google OAuth como provider principal
- Tokens JWT para API

### Autorização

```typescript
// Middleware para proteger rotas
export async function requireAuth(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session
}
```

### Validação

- Sempre validar dados no servidor com Zod
- Sanitizar inputs do usuário
- Validar permissões antes de operações sensíveis

## Integrações externas

| Integração | Uso | Autenticação |
|------------|-----|----------------|
| **N8N** | Workflow pré-aprovação de advogados; pode estender para outros fluxos | `N8N_API_KEY` em header ([workflow-n8n-pre-aprovacao.md](workflow-n8n-pre-aprovacao.md)) |
| **Bot / Evolution (WhatsApp)** | Webhook n8n chama APIs de suporte para registrar conversa | `N8N_API_KEY` ou `INTEGRATION_API_KEY`; opcional JWT com `INTEGRATION_JWT_SECRET` ([suporte-whatsapp-api.md](suporte-whatsapp-api.md), [n8n-workflow-suporte-whatsapp-evolution.json](n8n-workflow-suporte-whatsapp-evolution.json)) |
| **Stripe** | Assinaturas de advogados | Segredo e webhooks no servidor |
| **Resend (e-mail)** | Transacional, contato, notificações | `RESEND_API_KEY` |
| **Pusher** | Chat em tempo real (modo opcional) | Chaves `NEXT_PUBLIC_*` e servidor |

O **middleware** (`src/middleware.ts`) marca rotas públicas ou por perfil; `/api/suporte` e `/api/n8n` são públicas no sentido HTTP, porém **protegidas por chave** nas próprias rotas.

## Testing (Futuro)

- **Unit:** Vitest + Testing Library
- **Integration:** Playwright
- **E2E:** Playwright

## Deploy

- **Plataforma:** VPS com Kubernetes
- **CI/CD:** GitHub Actions (futuro)
- **Database:** PostgreSQL no Supabase ou servidor próprio
- **Storage:** VPS local ou MinIO

## Próximos Passos

Evolução contínua conforme [PRD.md](PRD.md) e [FUNCIONALIDADES.md](FUNCIONALIDADES.md). A arquitetura acima cobre extensão de APIs, novos jobs e integrações sem alterar o núcleo App Router + Prisma.
