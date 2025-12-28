#!/bin/bash

echo "🔄 Resetando banco de dados..."
echo ""

read -p "⚠️  Isso vai APAGAR todos os dados. Continuar? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Operação cancelada"
  exit 1
fi

echo ""
echo "🗑️  Removendo containers e volumes..."
docker-compose down -v

echo ""
echo "🐳 Recriando containers..."
docker-compose up -d

echo ""
echo "⏳ Aguardando PostgreSQL..."
until docker exec legalmatch-db pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

echo ""
echo "🗄️  Executando migrations..."
cd apps/api && pnpm db:migrate
cd ../..

echo ""
echo "✅ Banco de dados resetado!"
echo ""
