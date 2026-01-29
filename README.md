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

## 🚀 Quick Start

### Opção 1: Script Automático (Recomendado)

```bash
./scripts/quick-start.sh
```

Este script irá:
1. Verificar e criar `.env` se necessário
2. Instalar dependências
3. Configurar Prisma
4. Sincronizar banco de dados
5. Popular dados iniciais
6. Iniciar servidor de desenvolvimento

### Opção 2: Setup Manual

#### 1. Instalar dependências

```bash
npm install
```

#### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais (especialmente `DATABASE_URL`)

#### 3. Configurar banco de dados

```bash
npm run db:generate    # Gerar Prisma Client
npm run db:push        # Sincronizar schema
npm run db:seed        # Popular dados iniciais
```

#### 4. Iniciar desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## ✅ Status do Setup

O projeto está **100% configurado** e pronto para desenvolvimento!

- ✅ Next.js 16.1.6 (sem vulnerabilidades)
- ✅ Database schema aplicado (9 modelos)
- ✅ 4 especialidades pré-cadastradas
- ✅ Design System completo (6 componentes)
- ✅ Autenticação configurada (NextAuth)
- ✅ Documentação completa

Veja detalhes em [SETUP_COMPLETO.md](SETUP_COMPLETO.md)

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
