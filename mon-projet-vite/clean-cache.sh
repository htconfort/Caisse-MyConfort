# ⚡ VS Code Turbo - Script de nettoyage cache Vite
# Usage: chmod +x clean-cache.sh && ./clean-cache.sh

#!/bin/bash

echo "🧹 Nettoyage du cache Vite..."

# Nettoyer le cache Vite
rm -rf node_modules/.vite
echo "✅ Cache Vite supprimé"

# Nettoyer dist
rm -rf dist
echo "✅ Dossier dist supprimé"

# Nettoyer node_modules si demandé
if [ "$1" = "--full" ]; then
  echo "🔄 Suppression complète de node_modules..."
  rm -rf node_modules
  echo "📦 Réinstallation des dépendances..."
  npm install
fi

echo "🚀 Cache nettoyé ! Relancez 'npm run dev:turbo'"
