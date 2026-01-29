# Arquitetura do Projeto LegalMatch

## Visão Geral

O LegalMatch é construído com Next.js 14 usando o App Router, seguindo princípios de Clean Architecture e melhores práticas de desenvolvimento React/TypeScript.

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
│   ├── api/                 # API Routes
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

1. Implementar autenticação completa
2. Criar componentes de formulário
3. Desenvolver área do cidadão
4. Desenvolver área do advogado
5. Implementar matching e chat
