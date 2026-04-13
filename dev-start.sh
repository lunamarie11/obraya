#!/bin/bash
# ─────────────────────────────────────────────────
# ObraYa - Script de inicio para desarrollo local
# Levanta: PostgreSQL (Docker) + Backend + Frontend
# ─────────────────────────────────────────────────

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'
DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo -e "${CYAN}🏗  ObraYa - Iniciando entorno completo${NC}"
echo "─────────────────────────────────────────"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado.${NC}"
    echo "   Instalalo desde: https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v)"

# Check if Docker is running (for PostgreSQL)
DOCKER_OK=false
if command -v docker &> /dev/null && docker info &> /dev/null; then
    DOCKER_OK=true
    echo -e "${GREEN}✓${NC} Docker está corriendo"
else
    echo -e "${YELLOW}⚠${NC} Docker no está corriendo — el backend va a necesitar PostgreSQL manual"
fi

# ── Step 1: PostgreSQL via Docker ──
if [ "$DOCKER_OK" = true ]; then
    echo ""
    echo -e "${YELLOW}🐘 Levantando PostgreSQL...${NC}"
    docker run -d --name obraya-postgres \
        -e POSTGRES_USER=obraya \
        -e POSTGRES_PASSWORD=obraya123 \
        -e POSTGRES_DB=obraya \
        -p 5432:5432 \
        postgres:16-alpine 2>/dev/null || echo "   (ya estaba corriendo)"
    sleep 2
    echo -e "${GREEN}✓${NC} PostgreSQL en puerto 5432"
fi

# ── Step 2: Backend ──
echo ""
echo -e "${YELLOW}⚙️  Preparando Backend...${NC}"
cd "$DIR/backend"

if [ ! -d "node_modules" ]; then
    echo "   Instalando dependencias backend..."
    npm install
fi

# Create .env if not exists
if [ ! -f ".env" ]; then
    cat > .env <<EOF
DATABASE_URL="postgresql://obraya:obraya123@localhost:5432/obraya?schema=public"
FRONTEND_URL="http://localhost:3000"
PORT=3001
JWT_SECRET="obraya-dev-secret-2026"
EOF
    echo -e "${GREEN}✓${NC} .env creado"
fi

# Run migrations
if [ "$DOCKER_OK" = true ]; then
    echo "   Ejecutando migraciones..."
    npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name init 2>/dev/null || true
    echo "   Cargando datos de demo..."
    npx prisma db seed 2>/dev/null || true
fi

# Start backend in background
echo -e "${GREEN}🚀 Iniciando Backend en puerto 3001...${NC}"
npm run start:dev &
BACKEND_PID=$!

# ── Step 3: Frontend ──
echo ""
echo -e "${YELLOW}🎨 Preparando Frontend...${NC}"
cd "$DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "   Instalando dependencias frontend..."
    npm install
fi

echo -e "${GREEN}🚀 Iniciando Frontend en puerto 3000...${NC}"
echo ""
echo "─────────────────────────────────────────"
echo -e "   ${CYAN}Frontend:${NC} ${GREEN}http://localhost:3000${NC}"
echo -e "   ${CYAN}Backend API:${NC} ${GREEN}http://localhost:3001/api${NC}"
echo ""
echo -e "   ${YELLOW}Para detener todo: presioná Ctrl+C${NC}"
echo "─────────────────────────────────────────"
echo ""

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null; echo ''; echo 'ObraYa detenido.'" EXIT

npm run dev
