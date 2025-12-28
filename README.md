# LegalMatch - Uber Jurídico

Plataforma mobile-first que conecta pessoas com problemas jurídicos a advogados especialistas usando IA Generativa.

## Stack Tecnológica

- **Frontend Mobile:** Flutter + Riverpod
- **Backend:** NestJS + Prisma + Supabase
- **IA:** OpenAI (GPT-4o-mini + Whisper)
- **Monorepo:** Turborepo

## Estrutura do Projeto

```
├── apps/
│   ├── api/          # Backend NestJS
│   └── mobile/       # App Flutter
├── packages/         # Bibliotecas compartilhadas
└── turbo.json        # Configuração Turborepo
```

## Começando

### Pré-requisitos

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Flutter SDK >= 3.16.0
- Docker (opcional, para desenvolvimento local)

### Instalação

1. Clone o repositório
2. Copie `.env.example` para `.env` e configure as variáveis
3. Instale as dependências:

```bash
pnpm install
```

### Desenvolvimento

```bash
# Iniciar todos os projetos em modo dev
pnpm dev

# Apenas o backend
pnpm --filter api dev

# Apenas o mobile
pnpm --filter mobile dev
```

### Build

```bash
# Build de todos os projetos
pnpm build
```

## Regras de Negócio

1. **Proibição de Split de Pagamento:** Cliente paga direto ao advogado
2. **Anonimização:** Dados sensíveis são removidos pela IA
3. **Sem Leilão:** Preços não são públicos

## Documentação

Veja [PROJET_CONTEXT.md](PROJET_CONTEXT.md) para detalhes completos do projeto.
