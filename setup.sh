#!/bin/bash
# setup.sh — Run once to configure the project
# Usage: chmod +x setup.sh && ./setup.sh

set -e

echo ""
echo "🩸 LifeLink – Project Setup"
echo "================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org (v18+)"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required. Current: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Backend setup
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📝 Created backend/.env — please fill in your values"
fi
cd ..

# Frontend setup
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  echo "📝 Created frontend/.env.local — please fill in your values"
fi
cd ..

# Mobile setup
echo "📦 Installing mobile dependencies..."
cd mobile
npm install
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📝 Created mobile/.env — please fill in your values"
fi
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Fill in environment variables in backend/.env"
echo "  2. Fill in environment variables in frontend/.env.local"
echo "  3. Fill in environment variables in mobile/.env"
echo ""
echo "To start development:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo "  Terminal 3: cd mobile && npx expo start"
echo ""
echo "To seed demo data (after configuring MongoDB):"
echo "  cd backend && node src/utils/seed.js"
echo ""
echo "Admin credentials after seed:"
echo "  Email:    admin@lifelink.com"
echo "  Password: Admin@1234"
echo ""
