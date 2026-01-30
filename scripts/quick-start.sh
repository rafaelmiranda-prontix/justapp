#!/bin/bash

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  🚀 LegalConnect MVP - Quick Start"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo "Criando a partir do .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Arquivo .env criado"
    echo ""
    echo -e "${YELLOW}📝 Configure suas variáveis de ambiente em .env${NC}"
    echo ""
    read -p "Pressione ENTER para continuar após configurar o .env..."
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo ""
fi

# Gerar Prisma Client
echo "🔧 Gerando Prisma Client..."
npm run db:generate > /dev/null 2>&1

# Verificar conexão com banco
echo "🔍 Verificando conexão com banco de dados..."
if npx prisma db push --accept-data-loss > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Banco de dados conectado e sincronizado"
else
    echo -e "${YELLOW}⚠️  Não foi possível conectar ao banco${NC}"
    echo "   Verifique DATABASE_URL no arquivo .env"
    echo ""
    read -p "Deseja continuar mesmo assim? (s/N): " continue
    if [ "$continue" != "s" ] && [ "$continue" != "S" ]; then
        exit 1
    fi
fi

# Verificar se banco tem dados
echo "📊 Verificando dados no banco..."
ESPECIALIDADES=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM especialidades;" 2>/dev/null | grep -oE '[0-9]+' | tail -1)

if [ "$ESPECIALIDADES" = "0" ] || [ -z "$ESPECIALIDADES" ]; then
    echo "🌱 Populando banco com dados iniciais..."
    npm run db:seed
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✓ Setup completo!${NC}"
echo ""
echo "📚 Recursos disponíveis:"
echo ""
echo "  • Prisma Studio: npm run db:studio"
echo "  • Documentação: docs/"
echo "  • Comandos úteis: docs/COMANDOS_UTEIS.md"
echo ""
echo "🚀 Iniciando servidor de desenvolvimento..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Iniciar servidor
npm run dev
