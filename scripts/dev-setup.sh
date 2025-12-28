#!/bin/bash

echo "🚀 Configurando ambiente de desenvolvimento LegalMatch..."
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
  exit 1
fi

echo "✅ Docker está rodando"
echo ""

# Criar .env se não existir
if [ ! -f .env ]; then
  echo "📝 Criando arquivo .env..."
  cp .env.local.example .env
  echo "✅ Arquivo .env criado!"
  echo ""
  echo "⚠️  IMPORTANTE: Edite o arquivo .env e adicione sua OPENAI_API_KEY"
  echo ""
else
  echo "✅ Arquivo .env já existe"
  echo ""
fi

# Iniciar containers Docker
echo "🐳 Iniciando containers Docker (PostgreSQL + Redis)..."
docker-compose up -d

# Aguardar PostgreSQL estar pronto
echo ""
echo "⏳ Aguardando PostgreSQL estar pronto..."
until docker exec legalmatch-db pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done
echo "✅ PostgreSQL pronto!"
echo ""

# Instalar dependências
echo "📦 Instalando dependências..."
pnpm install
echo "✅ Dependências instaladas!"
echo ""

# Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
cd apps/api && pnpm db:generate
cd ../..
echo "✅ Prisma Client gerado!"
echo ""

# Rodar migrations
echo "🗄️  Executando migrations..."
cd apps/api && pnpm db:migrate
cd ../..
echo "✅ Migrations executadas!"
echo ""

echo "🎉 Setup completo!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite o arquivo .env e adicione sua OPENAI_API_KEY"
echo "2. Execute: pnpm dev"
echo ""
echo "🔗 URLs úteis:"
echo "   - API: http://localhost:3000/api"
echo "   - Health: http://localhost:3000/api/health"
echo "   - PostgreSQL: localhost:5432"
echo ""
echo "💡 Comandos úteis:"
echo "   - Parar containers: docker-compose down"
echo "   - Ver logs: docker-compose logs -f"
echo "   - Resetar DB: docker-compose down -v && ./scripts/dev-setup.sh"
echo ""
