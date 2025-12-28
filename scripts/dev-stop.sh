#!/bin/bash

echo "🛑 Parando ambiente de desenvolvimento..."
echo ""

docker-compose down

echo ""
echo "✅ Containers parados!"
echo ""
echo "💡 Para reiniciar: docker-compose up -d"
echo "💡 Para remover volumes (resetar DB): docker-compose down -v"
echo ""
