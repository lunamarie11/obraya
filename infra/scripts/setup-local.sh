#!/bin/bash

# ObraYa Local Development Setup Script

set -e

echo "=========================================="
echo "ObraYa - Local Development Setup"
echo "=========================================="
echo ""

# Check Node version
echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "ERROR: Node.js 20+ is required. Current version: $(node -v)"
  exit 1
fi
echo "   Node.js $(node -v) - OK"
echo ""

# Docker check
echo "2. Checking Docker and Docker Compose..."
if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker is not installed"
  exit 1
fi
if ! command -v docker-compose &> /dev/null; then
  echo "ERROR: Docker Compose is not installed"
  exit 1
fi
echo "   Docker and Docker Compose found - OK"
echo ""

# Start services
echo "3. Starting Docker services (Postgres, Redis, Elasticsearch)..."
docker-compose -f infra/docker/docker-compose.yml up -d
echo "   Waiting for services to be healthy..."
sleep 5
echo "   Services started - OK"
echo ""

# Install dependencies
echo "4. Installing npm dependencies..."
npm install
echo "   Dependencies installed - OK"
echo ""

# Setup environment
echo "5. Setting up environment variables..."
if [ ! -f .env ]; then
  cp packages/backend/.env.example .env
  echo "   Created .env from .env.example"
  echo "   Remember to update .env with your actual credentials"
else
  echo "   .env already exists - skipping"
fi
echo ""

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Update .env with your actual credentials"
echo "  2. Run 'npm run dev' to start the backend"
echo "  3. Run 'npm run dev --workspace=@obraya/frontend' for the frontend"
echo ""
echo "Docker services running:"
echo "  - Postgres: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - Elasticsearch: localhost:9200"
echo ""
echo "To stop services: docker-compose -f infra/docker/docker-compose.yml down"
