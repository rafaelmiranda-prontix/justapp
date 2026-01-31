#!/bin/bash

# Script rápido para criar admin de teste
# Uso: ./scripts/quick-admin.sh

echo "🚀 Criação Rápida de Admin de Teste"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Dados padrão para teste
ADMIN_NAME=${1:-"Admin de Teste"}
ADMIN_EMAIL=${2:-"admin@test.com"}

echo -e "${YELLOW}Criando admin com:${NC}"
echo "  Nome: $ADMIN_NAME"
echo "  Email: $ADMIN_EMAIL"
echo ""

# Executar via environment variables
SEED_ADMIN_NAME="$ADMIN_NAME" \
SEED_ADMIN_EMAIL="$ADMIN_EMAIL" \
npm run admin:seed

echo ""
echo -e "${GREEN}✅ Concluído!${NC}"
echo ""
echo "Para fazer login:"
echo "  1. Use Google/GitHub OAuth"
echo "  2. Ou defina senha: npm run admin:password"
echo ""
echo "Painel admin: http://localhost:3000/admin/dashboard"
