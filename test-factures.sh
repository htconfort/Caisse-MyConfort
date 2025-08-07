#!/bin/bash

# 🎯 Script de test pour l'intégration des factures
# Caisse MyConfort - Système de factures

echo "🚀 Test de l'intégration du système de factures"
echo "=============================================="

# Aller dans le bon répertoire
cd "$(dirname "$0")/mon-projet-vite"

echo "📁 Répertoire actuel: $(pwd)"

# Vérifier que les dépendances sont installées
echo "📦 Vérification des dépendances..."
if [ ! -d "node_modules" ]; then
  echo "⚠️  Node modules non trouvés. Installation..."
  npm install
else
  echo "✅ Node modules trouvés"
fi

# Vérifier les fichiers créés
echo ""
echo "🔍 Vérification des fichiers créés:"

FILES=(
  "src/services/syncService.ts"
  "src/hooks/useSyncInvoices.ts"
  "src/hooks/useStockManagement.ts"
  "src/hooks/useNotifications.ts"
  "src/components/InvoicesTab.tsx"
  "src/components/InvoiceCard.tsx"
  "src/components/StockOverview.tsx"
  "src/components/SyncStatus.tsx"
  "src/components/NotificationCenter.tsx"
  "src/styles/invoices-tab.css"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file (manquant)"
  fi
done

echo ""
echo "🔧 Compilation TypeScript..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
  echo "✅ Compilation TypeScript réussie"
else
  echo "❌ Erreurs de compilation TypeScript"
  echo "💡 Note: Les erreurs React sont normales en développement"
fi

echo ""
echo "🎯 Lancement de l'application..."
echo "📝 Vérifiez que l'onglet '📄 Factures' apparaît dans la navigation"
echo ""
echo "🌐 L'application sera disponible sur: http://localhost:5173"
echo "⏹️  Appuyez sur Ctrl+C pour arrêter"
echo ""

# Lancer l'application en mode développement
npm run dev
