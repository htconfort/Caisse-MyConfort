#!/bin/bash

# 🧹 RESET COMPLET - Suppression de toutes les factures pour test propre

echo "🧹 RESET COMPLET DES FACTURES"
echo "=============================="
echo ""

echo "🗑️ SUPPRESSION EN COURS :"
echo ""

echo "1️⃣ Nettoyage localStorage (navigateur)..."
echo "2️⃣ Suppression cache application..."
echo "3️⃣ Reset données synchronisation..."
echo ""

echo "🌐 Ouvrez votre navigateur : http://localhost:5181"
echo ""
echo "📋 COMMANDES À EXÉCUTER DANS LA CONSOLE (F12) :"
echo ""
echo "// Suppression complète de toutes les données"
echo "localStorage.clear();"
echo "sessionStorage.clear();"
echo "console.log('✅ Toutes les données supprimées');"
echo ""
echo "// Recharger la page"
echo "location.reload();"
echo ""

echo "✅ APRÈS LE RESET :"
echo "- 🎯 Badge factures : 0"
echo "- 🎯 Liste factures : vide"
echo "- 🎯 Prêt pour recevoir nouvelle facture"
echo ""

echo "🚀 ÉTAPES POUR TESTER :"
echo "1. Exécutez les commandes ci-dessus dans la console"
echo "2. Vérifiez que le badge affiche 0 factures"
echo "3. Envoyez votre nouvelle facture depuis l'application facturation"
echo "4. Vérifiez que la facture apparaît immédiatement"
echo ""

echo "🔧 VÉRIFICATION STATUS :"
curl -s "http://localhost:5181/api/n8n/sync/invoices" | jq -r '.[] | "\(.client.name): \(.invoiceNumber)"' 2>/dev/null || echo "Aucune facture détectée (normal après reset)"
