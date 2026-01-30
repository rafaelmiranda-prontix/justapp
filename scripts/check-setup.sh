#!/bin/bash

echo "🔍 Verificando setup do projeto LegalConnect..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
echo "Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js instalado: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js não encontrado"
    exit 1
fi

# Verificar npm
echo "Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm instalado: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm não encontrado"
    exit 1
fi

# Verificar PostgreSQL
echo "Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    echo -e "${GREEN}✓${NC} PostgreSQL instalado: $PSQL_VERSION"
else
    echo -e "${YELLOW}⚠${NC} PostgreSQL não encontrado (opcional se usar Supabase)"
fi

# Verificar node_modules
echo "Verificando dependências..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules encontrado"
else
    echo -e "${RED}✗${NC} node_modules não encontrado. Execute: npm install"
    exit 1
fi

# Verificar arquivo .env
echo "Verificando configuração..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Arquivo .env encontrado"

    # Verificar variáveis essenciais
    if grep -q "DATABASE_URL=" .env; then
        echo -e "${GREEN}✓${NC} DATABASE_URL configurado"
    else
        echo -e "${RED}✗${NC} DATABASE_URL não configurado"
    fi

    if grep -q "NEXTAUTH_SECRET=" .env; then
        echo -e "${GREEN}✓${NC} NEXTAUTH_SECRET configurado"
    else
        echo -e "${YELLOW}⚠${NC} NEXTAUTH_SECRET não configurado"
    fi

    if grep -q "GOOGLE_CLIENT_ID=" .env; then
        echo -e "${GREEN}✓${NC} GOOGLE_CLIENT_ID configurado"
    else
        echo -e "${YELLOW}⚠${NC} GOOGLE_CLIENT_ID não configurado"
    fi
else
    echo -e "${YELLOW}⚠${NC} Arquivo .env não encontrado"
    echo "  Execute: cp .env.example .env"
    echo "  E configure as variáveis de ambiente"
fi

# Verificar Prisma
echo "Verificando Prisma..."
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${GREEN}✓${NC} Schema Prisma encontrado"
else
    echo -e "${RED}✗${NC} Schema Prisma não encontrado"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Próximos passos:"
echo ""
echo "1. Configure o arquivo .env com suas credenciais"
echo "2. Execute: npm run db:generate"
echo "3. Execute: npm run db:push"
echo "4. Execute: npm run db:seed"
echo "5. Execute: npm run dev"
echo ""
echo "📚 Documentação:"
echo "  - README.md"
echo "  - docs/GOOGLE_OAUTH_SETUP.md"
echo "  - docs/ARCHITECTURE.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
