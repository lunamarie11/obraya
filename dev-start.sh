#!/bin/bash
# ─────────────────────────────────────────────────
# ObraYa - Script de inicio para desarrollo local
# Solo necesitas: Node.js (v18+) instalado
# ─────────────────────────────────────────────────

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}🏗  ObraYa - Iniciando modo desarrollo${NC}"
echo "─────────────────────────────────────────"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado.${NC}"
    echo "   Instalalo desde: https://nodejs.org (versión 18 o superior)"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo -e "${GREEN}✓${NC} Node.js $(node -v) detectado"

# Install frontend dependencies if needed
echo ""
echo -e "${YELLOW}📦 Verificando dependencias del frontend...${NC}"
cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
    echo "   Instalando dependencias (primera vez, puede tardar 1-2 min)..."
    npm install
else
    echo -e "${GREEN}✓${NC} Dependencias ya instaladas"
fi

# Start frontend in dev mode
echo ""
echo "─────────────────────────────────────────"
echo -e "${GREEN}🚀 Iniciando ObraYa Frontend...${NC}"
echo ""
echo -e "   ${CYAN}➜ Abrí tu navegador en: ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "   ${YELLOW}Para detener: presioná Ctrl+C${NC}"
echo "─────────────────────────────────────────"
echo ""

npm run dev
