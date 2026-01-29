# LegalMatch - MVP

> "Uber dos Processos" — Conectando pessoas com problemas jurídicos a advogados especializados.

## Stack Técnica

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (Google OAuth)
- **UI Components:** shadcn/ui + Radix UI
- **State Management:** Zustand + React Query
- **Forms:** React Hook Form + Zod
- **Styling:** Tailwind CSS + CVA

## Pré-requisitos

- Node.js 20+
- PostgreSQL 14+
- npm ou pnpm

## Setup Inicial

### 1. Instalar dependências

```bash
npm install
# ou
pnpm install
```

### 2. Configurar banco de dados

Crie um banco PostgreSQL local:

```bash
createdb legalmatch
```

### 3. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/legalmatch?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-aqui"
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"
```

### 4. Gerar cliente Prisma e executar migrations

```bash
npm run db:generate
npm run db:push
```

### 5. Popular banco de dados (seed)

```bash
npm run db:seed
```

### 6. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm start` - Inicia servidor de produção
- `npm run lint` - Executa ESLint
- `npm run type-check` - Verifica tipos TypeScript
- `npm run format` - Formata código com Prettier
- `npm run db:generate` - Gera cliente Prisma
- `npm run db:push` - Sincroniza schema com banco
- `npm run db:migrate` - Cria migration
- `npm run db:studio` - Abre Prisma Studio
- `npm run db:seed` - Popula banco com dados iniciais

## Estrutura do Projeto

```
legal-match/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (cidadao)/
│   │   ├── (advogado)/
│   │   ├── (admin)/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   └── providers.tsx
│   ├── hooks/
│   │   ├── use-toast.ts
│   │   ├── use-media-query.ts
│   │   ├── use-debounce.ts
│   │   └── use-local-storage.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── public/
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Próximos Passos

Consulte o [PRD.md](./PRD.md) e [CONTEXT.md](./CONTEXT.md) para detalhes sobre o roadmap de desenvolvimento.

## Fase Atual: Setup Inicial ✅

- [x] Configurar Next.js 14 com TypeScript
- [x] Configurar Tailwind CSS
- [x] Configurar Prisma com PostgreSQL
- [x] Configurar NextAuth
- [x] Configurar shadcn/ui
- [x] Criar estrutura de pastas
- [x] Criar hooks personalizados
- [x] Criar tipos TypeScript

## Licença

Privado - Todos os direitos reservados
