#!/bin/bash

echo "🚀 Démarrage FORCÉ sur port 5173"

# Tuer tous les processus sur le port 5173
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Nettoyer le cache Vite
rm -rf node_modules/.vite 2>/dev/null || true

# Démarrer Vite avec configuration forcée
echo "📱 L'application va démarrer sur http://localhost:5173"
npx vite --port 5173 --host
