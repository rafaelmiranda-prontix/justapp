# Setup de Desenvolvimento Local - LegalMatch

## 🐳 Usando Docker (Recomendado)

### Pré-requisitos
- Docker Desktop instalado e rodando
- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Setup Automático (Mais Fácil)

```bash
# Execute o script de setup
./scripts/dev-setup.sh
```

Este script vai:
1. ✅ Verificar se Docker está rodando
2. ✅ Criar arquivo `.env` (se não existir)
3. ✅ Iniciar PostgreSQL + Redis no Docker
4. ✅ Instalar dependências
5. ✅ Gerar Prisma Client
6. ✅ Executar migrations

### Depois do Setup

1. **Adicione sua OpenAI API Key** no arquivo `.env`:
   ```env
   OPENAI_API_KEY="sk-proj-sua-key-aqui"
   ```

2. **Inicie o servidor**:
   ```bash
   pnpm dev
   ```

3. **Acesse**:
   - API: http://localhost:3000/api
   - Health: http://localhost:3000/api/health

---

## 📝 Setup Manual

### 1. Criar arquivo .env

```bash
cp .env.local.example .env
```

### 2. Editar .env

Adicione sua `OPENAI_API_KEY`:
```env
OPENAI_API_KEY="sk-proj-..."
```

### 3. Iniciar containers Docker

```bash
docker-compose up -d
```

Isso vai criar:
- **PostgreSQL** na porta 5432
- **Redis** na porta 6379

### 4. Instalar dependências

```bash
pnpm install
```

### 5. Gerar Prisma Client

```bash
cd apps/api
pnpm db:generate
```

### 6. Executar migrations

```bash
pnpm db:migrate
cd ../..
```

### 7. Iniciar servidor

```bash
pnpm dev
```

---

## 🛠️ Comandos Úteis

### Desenvolvimento

```bash
# Iniciar tudo
pnpm dev

# Apenas backend
pnpm --filter api dev

# Apenas mobile (em outro terminal)
cd apps/mobile
flutter run
```

### Docker

```bash
# Ver status dos containers
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down

# Parar e remover volumes (reseta DB)
docker-compose down -v

# Reiniciar containers
docker-compose restart
```

### Scripts de Desenvolvimento

```bash
# Setup inicial
./scripts/dev-setup.sh

# Parar containers
./scripts/dev-stop.sh

# Resetar banco de dados
./scripts/dev-reset.sh
```

### Prisma

```bash
cd apps/api

# Gerar Client
pnpm db:generate

# Criar migration
pnpm db:migrate

# Abrir Prisma Studio
pnpm db:studio

# Reset database
npx prisma migrate reset
```

---

## 🧪 Testando a API

### Health Check

```bash
curl http://localhost:3000/api/health
```

### Criar usuário

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "senha123",
    "name": "Test User",
    "role": "CLIENT"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "senha123"
  }'
```

---

## 🔍 Conectar ao PostgreSQL

### Via CLI

```bash
docker exec -it legalmatch-db psql -U postgres -d legalmatch
```

### Via GUI (DBeaver, TablePlus, etc)

```
Host: localhost
Port: 5432
Database: legalmatch
User: postgres
Password: postgres
```

---

## 🐛 Troubleshooting

### Porta 5432 já está em uso

Se você tem PostgreSQL rodando localmente:

```bash
# macOS/Linux
sudo lsof -i :5432

# Parar PostgreSQL local
brew services stop postgresql@14  # macOS
sudo systemctl stop postgresql    # Linux
```

Ou mude a porta no `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Usar porta 5433 no host
```

E atualize o `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/legalmatch"
```

### Docker não inicia

```bash
# Verificar se Docker está rodando
docker info

# Verificar logs
docker-compose logs

# Recriar containers
docker-compose down
docker-compose up -d
```

### Erro de migrations

```bash
# Reset completo
./scripts/dev-reset.sh

# Ou manual
docker-compose down -v
docker-compose up -d
cd apps/api
pnpm db:migrate
```

### Prisma Client não encontrado

```bash
cd apps/api
pnpm db:generate
```

---

## 🎯 Diferença: Local vs Supabase

| Feature | Local (Docker) | Supabase |
|---------|---------------|----------|
| PostgreSQL | ✅ Sim | ✅ Sim |
| Auth | ❌ Não | ✅ Sim |
| Storage | 📁 Local (`./uploads`) | ☁️ Cloud |
| Setup | Rápido | Requer conta |
| Custo | Grátis | Grátis (com limites) |

**Para desenvolvimento:** Use Docker
**Para produção:** Use Supabase

---

## 🚀 Próximos Passos

Depois do setup:

1. ✅ Teste a API com cURL
2. ✅ Configure o Flutter app
3. ✅ Crie alguns casos de teste
4. ✅ Teste o fluxo completo

Consulte [QUICKSTART.md](QUICKSTART.md) para mais detalhes!
