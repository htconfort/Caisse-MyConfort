#!/bin/bash

echo "🧹 NETTOYAGE CACHE ET FORCE SYNC N8N"
echo "====================================="
echo ""

cd "/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-1/mon-projet-vite"

echo "🗑️ Nettoyage du cache localStorage..."
echo "--------------------------------------"

# Script pour nettoyer le cache dans le navigateur
cat << 'EOF' > /tmp/clear_cache.js
// Script à exécuter dans la console du navigateur
console.log('🧹 Nettoyage du cache MyConfort...');

// Nettoyer tout le cache lié à MyConfort
Object.keys(localStorage).forEach(key => {
  if (key.includes('myconfort') || key.includes('n8n') || key.includes('invoice') || key.includes('sync')) {
    console.log(`🗑️ Suppression de: ${key}`);
    localStorage.removeItem(key);
  }
});

// Forcer le mode N8N
localStorage.setItem('n8n-test-mode', 'true');
console.log('✅ Mode N8N activé');

// Recharger la page
console.log('🔄 Rechargement de la page...');
setTimeout(() => location.reload(), 1000);
EOF

echo "📋 Script de nettoyage créé : /tmp/clear_cache.js"
echo ""
echo "🌐 INSTRUCTIONS POUR NETTOYER LE CACHE :"
echo "----------------------------------------"
echo "1. 🖥️  Ouvrez http://localhost:5173 dans votre navigateur"
echo "2. 🔧 Ouvrez la Console Développeur (F12)"
echo "3. 📋 Copiez-collez ce script dans la console :"
echo ""
cat /tmp/clear_cache.js
echo ""
echo "4. ⏎  Appuyez sur Entrée pour l'exécuter"
echo "5. 📄 La page va se recharger et vous pourrez aller sur l'onglet Factures"
echo ""
echo "✨ Après cela, vos vraies factures N8N devraient apparaître !"
echo ""
echo "🔍 Vérification rapide - Nombre de factures disponibles :"
curl -s "http://localhost:5173/api/n8n/sync/invoices" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(f'📊 {data.get(\"count\", 0)} factures prêtes à être synchronisées')
except:
    print('❌ Problème de connexion N8N')
"
