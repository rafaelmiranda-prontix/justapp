# LegalConnect / JustApp - MVP

> Plataforma jurídica inteligente — Conectando pessoas com problemas jurídicos a advogados especializados.

## Documentação do produto e do sistema

O **catálogo atualizado de funcionalidades** (cidadão, advogado, admin, chat, casos, N8N, suporte WhatsApp, APIs e banco) está em **[docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md)**.

## Stack Técnica

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes (`src/app/api/`)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (credenciais + Google OAuth)
- **UI Components:** shadcn/ui + Radix UI
- **State Management:** Zustand + React Query
- **Forms:** React Hook Form + Zod
- **Styling:** Tailwind CSS + CVA
- **Integrações:** N8N (pré-aprovação de advogados); API de suporte WhatsApp (bot / Evolution); Stripe; e-mail (Resend); opcional Pusher para chat em tempo real

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

Base técnica pronta para desenvolvimento contínuo. O escopo funcional evolui conforme o roadmap; veja o que já está disponível em **[docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md)**.

- Next.js + Prisma + PostgreSQL
- Autenticação NextAuth (Google + e-mail/senha)
- Áreas cidadão, advogado e admin
- Chat anônimo com IA, casos, matches, notificações, planos (Stripe)
- Integração N8N (pré-aprovação) e **suporte WhatsApp** (`/api/suporte/*`, admin `/admin/suporte`)

Detalhes de ambiente e primeiros passos: **[docs/SETUP_COMPLETO.md](docs/SETUP_COMPLETO.md)**

Deploy de **homologação na Vercel** (branch `staging`, segundo projeto, banco isolado): **[docs/DEPLOY_VERCEL_STAGING.md](docs/DEPLOY_VERCEL_STAGING.md)**.

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
legal-connect/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (cidadao)/
│   │   ├── (advogado)/
│   │   ├── (admin)/
│   │   ├── api/          # REST: auth, casos, chat, n8n, suporte, stripe, etc.
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

## Próximos passos e contexto

- **[docs/PRD.md](docs/PRD.md)** — visão de produto  
- **[docs/CONTEXT.md](docs/CONTEXT.md)** — contexto de desenvolvimento  
- **[docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md)** — lista do que o sistema oferece hoje

## Roadmap histórico (setup base)

- [x] Next.js + TypeScript + Tailwind
- [x] Prisma + PostgreSQL
- [x] NextAuth + áreas por perfil
- [x] Design system (shadcn/ui) e área admin
- [x] Casos, chat, notificações, planos e integrações (ver catálogo)

## Licença

Privado - Todos os direitos reservados
