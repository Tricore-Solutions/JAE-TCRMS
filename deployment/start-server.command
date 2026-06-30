#!/bin/bash
# Start Django API server — developer use on macOS

set -e
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "Created backend/.env from .env.example"
fi

if [ ! -f backend/venv/bin/python ]; then
  echo "Backend venv not found — run: npm run install:backend"
  exit 1
fi

exec node scripts/backend-python.js manage.py runserver 0.0.0.0:3000
