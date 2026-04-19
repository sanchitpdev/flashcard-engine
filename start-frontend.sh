#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  start-frontend.sh
#  Run from project root: bash start-frontend.sh
#  • installs node_modules if missing
#  • starts Vite dev server on http://localhost:5173
#  • proxies /api/* → http://localhost:8080 (your Spring Boot)
# ─────────────────────────────────────────────────────────────
set -e

FRONTEND_DIR="$(cd "$(dirname "$0")/frontend" && pwd)"

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "❌  Could not find frontend/ directory. Run from project root."
  exit 1
fi

cd "$FRONTEND_DIR"

# Install if node_modules missing or package.json newer
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
  echo "📦  node_modules not found or stale — running npm install..."
  npm install
  echo "✅  Dependencies installed"
else
  echo "✅  node_modules already present"
fi

echo ""
echo "🚀  Starting Vite dev server..."
echo "     Frontend : http://localhost:5173"
echo "     API proxy: /api/* → http://localhost:8080"
echo ""
echo "     Make sure your Spring Boot backend is running on :8080"
echo "     Press Ctrl+C to stop"
echo ""
npm run dev
