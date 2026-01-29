#!/bin/bash

echo "🗑️  Resetando banco de dados..."
echo ""
echo "⚠️  ATENÇÃO: Isso irá APAGAR TODOS OS DADOS do banco!"
echo ""
read -p "Tem certeza? Digite 'SIM' para confirmar: " confirm

if [ "$confirm" != "SIM" ]; then
    echo "❌ Operação cancelada."
    exit 0
fi

echo ""
echo "📊 Executando reset..."

# Gerar Prisma Client
echo "1. Gerando Prisma Client..."
npm run db:generate

# Reset usando Prisma
echo ""
echo "2. Resetando banco de dados..."
npx prisma migrate reset --force --skip-seed

# Aplicar schema
echo ""
echo "3. Aplicando schema..."
npx prisma db push --force-reset

# Popular com seed
echo ""
echo "4. Populando banco com dados iniciais..."
npm run db:seed

echo ""
echo "✅ Banco de dados resetado com sucesso!"
echo ""
echo "📝 Próximo passo: npm run dev"
