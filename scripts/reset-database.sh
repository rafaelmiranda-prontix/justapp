#!/bin/bash
# Reset completo: schema = só migrations (igual produção na Vercel).
# NUNCA aponte DATABASE_URL para produção ao rodar isto.

set -e

echo "🗑️  Resetando banco de dados..."
echo ""
echo "⚠️  ATENÇÃO: Isso irá APAGAR TODOS OS DADOS e recriar o schema via prisma/migrations!"
echo ""
read -p "Tem certeza? Digite 'SIM' para confirmar: " confirm

if [ "$confirm" != "SIM" ]; then
  echo "❌ Operação cancelada."
  exit 0
fi

echo ""
echo "📊 Executando reset..."

echo "1. Gerando Prisma Client..."
npm run db:generate

echo ""
echo "2. Reset (drop + todas as migrations do repositório)..."
npx prisma migrate reset --force --skip-seed

echo ""
echo "3. Populando dados iniciais (configs, planos, especialidades, advogados, casos [EXEMPLO])..."
echo "   (use CASOS=50 ./scripts/reset-database.sh para mais casos — export antes de rodar)"
npm run seed

echo ""
echo "✅ Banco resetado. Schema alinhado ao que prod obtém com «migrate deploy»."
echo ""
echo "📝 Opcional: admin — npm run admin:create ou npm run admin:seed"
echo "📝 Próximo passo: npm run dev"
