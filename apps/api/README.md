# LegalMatch API

Backend API para a plataforma LegalMatch - conectando clientes a advogados especialistas.

## Stack

- **NestJS** - Framework backend
- **Prisma** - ORM para PostgreSQL
- **Supabase** - Database, Auth e Storage
- **OpenAI** - GPT-4o-mini + Whisper para análise de casos

## Começando

### 1. Configurar variáveis de ambiente

Copie o arquivo `.env.example` na raiz do projeto e configure as variáveis:

```bash
cp ../../.env.example ../../.env
```

Preencha com suas credenciais:
- Supabase (DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- OpenAI (OPENAI_API_KEY)
- JWT_SECRET
- Para rodar sem Supabase em desenvolvimento, defina `USE_SUPABASE=false` (signup/signin funcionam só com email e guardam usuários no Postgres; upload de áudio fica indisponível).

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Executar migrations do Prisma

```bash
pnpm db:migrate
```

### 4. Iniciar servidor de desenvolvimento

```bash
pnpm dev
```

A API estará disponível em: `http://localhost:3000/api`

## Endpoints Principais

### Autenticação

#### POST /api/auth/signup
Criar nova conta (Cliente ou Advogado)

```json
{
  "email": "user@example.com",
  "password": "senha123",
  "name": "João Silva",
  "role": "CLIENT" // ou "LAWYER"
}
```

#### POST /api/auth/signin
Login

```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

Retorna:
```json
{
  "user": { ... },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Casos (Cases)

#### POST /api/cases
Criar novo caso (apenas CLIENT)

```json
{
  "rawText": "Fui demitido sem justa causa e não recebi minhas verbas rescisórias..."
  // OU
  "audioUrl": "https://storage.supabase.co/..."
}
```

A IA irá processar automaticamente e extrair:
- Categoria jurídica
- Subcategoria
- Resumo técnico anonimizado
- Nível de urgência
- Confiança da análise

#### GET /api/cases
Listar casos (com filtros opcionais)

Query params:
- `status` - PENDING_ANALYSIS, OPEN, MATCHED, CLOSED
- `category` - Filtrar por categoria
- `clientId` - Casos de um cliente específico

#### GET /api/cases/open
Listar casos disponíveis (apenas LAWYER) - dados anonimizados

Query params:
- `specialties` - Filtrar por especialidades (ex: "Trabalhista,Penal")

#### GET /api/cases/:id
Detalhes de um caso específico

### Advogados (Lawyers)

#### POST /api/lawyers
Criar perfil de advogado (apenas usuários com role LAWYER)

```json
{
  "oabNumber": "123456",
  "oabState": "SP",
  "bio": "Advogado especializado em...",
  "specialties": ["Direito do Trabalho", "Direito Civil"]
}
```

#### GET /api/lawyers
Listar advogados

Query params:
- `specialties` - Filtrar por especialidades

#### PUT /api/lawyers/:id
Atualizar perfil do advogado

#### POST /api/lawyers/:id/credits/add
Adicionar créditos (apenas LAWYER ou ADMIN)

```json
{
  "amount": 10
}
```

### Matches

#### POST /api/matches
Advogado aceita um caso (consome 1 crédito)

```json
{
  "caseId": "uuid-do-caso"
}
```

#### GET /api/matches
Listar matches

Query params:
- `lawyerId` - Matches de um advogado
- `caseId` - Matches de um caso

## Autenticação

Todas as rotas (exceto signup/signin) requerem JWT no header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Regras de Negócio

1. **Anonimização**: Casos disponíveis para advogados mostram apenas `technicalSummary` (anonimizado)
2. **Créditos**: Cada match consome 1 crédito do advogado
3. **Status do Caso**:
   - `PENDING_ANALYSIS` → Aguardando IA
   - `OPEN` → Disponível para advogados
   - `MATCHED` → Advogado aceitou
   - `CLOSED` → Finalizado

## Scripts úteis

```bash
# Gerar Prisma Client
pnpm db:generate

# Criar migration
pnpm db:migrate

# Abrir Prisma Studio (GUI para o banco)
pnpm db:studio

# Build para produção
pnpm build

# Executar testes
pnpm test
```

## Estrutura de Arquivos

```
src/
├── auth/           # Autenticação e guards
├── users/          # Gestão de usuários
├── lawyers/        # Perfis de advogados
├── cases/          # Casos jurídicos
├── matches/        # Relacionamento caso-advogado
├── ai/             # Integração OpenAI + Storage
├── prisma/         # Serviço Prisma
├── app.module.ts
└── main.ts
```
