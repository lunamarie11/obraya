#!/bin/bash
set -e

echo ""
echo "  ╔═══════════════════════════════════════╗"
echo "  ║         ObraYa - Local Setup          ║"
echo "  ╚═══════════════════════════════════════╝"
echo ""

# ── Check Docker ────────────────────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker no esta instalado."
  echo "Descargalo en: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

if ! docker info &> /dev/null; then
  echo "ERROR: Docker no esta corriendo. Abre Docker Desktop primero."
  exit 1
fi

echo "[1/5] Levantando PostgreSQL..."
docker compose up -d postgres
echo "  Esperando que PostgreSQL este listo..."
sleep 3

echo "[2/5] Instalando dependencias del backend..."
cd backend
npm install
echo "  Generando Prisma Client..."
npx prisma generate

echo "[3/5] Ejecutando migraciones de base de datos..."
npx prisma migrate dev --name init 2>/dev/null || npx prisma db push
echo "  Aplicando seed con datos demo..."
npx prisma db seed || echo "  (Seed ya fue aplicado)"
cd ..

echo "[4/5] Instalando dependencias del frontend..."
cd frontend
npm install
cd ..

echo "[5/5] Listo! Ahora abre 2 terminales:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend && npm run start:dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend && npm run dev"
echo ""
echo "  Luego abre en tu navegador:"
echo "    Frontend: http://localhost:3000"
echo "    API:      http://localhost:3000/api"
echo ""
echo "  ─────────────────────────────────────────"
echo "  ALTERNATIVA: Correr todo con Docker:"
echo "    docker compose up --build"
echo "    Frontend: http://localhost:3001"
echo "    API:      http://localhost:3000/api"
echo "  ─────────────────────────────────────────"
echo ""
