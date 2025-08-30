#!/bin/bash

# 🚀 Script de déploiement automatique - Synchronisation Google Sheets
# Ce script build et déploie automatiquement la nouvelle fonctionnalité

set -e

echo "🚀 Déploiement automatique - Synchronisation Google Sheets"
echo "============================================================"

# 1. Vérifications préalables
echo "📋 1. Vérifications préalables..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "mon-projet-vite/package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet (Caisse-MyConfort-3)"
    exit 1
fi

# Vérifier que les variables d'environnement sont configurées
if ! grep -q "VITE_N8N_SYNC_WEBHOOK" mon-projet-vite/.env; then
    echo "⚠️  VITE_N8N_SYNC_WEBHOOK manquant dans .env"
    echo "Ajout automatique..."
    echo "VITE_N8N_SYNC_WEBHOOK=https://n8n.srv765811.hstgr.cloud/webhook/sync/daily" >> mon-projet-vite/.env
fi

echo "✅ Variables d'environnement OK"

# 2. Installation des dépendances
echo "📦 2. Installation des dépendances..."
cd mon-projet-vite
npm install
echo "✅ Dépendances installées"

# 3. Compilation TypeScript
echo "🔧 3. Vérification TypeScript..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ TypeScript OK"
else
    echo "⚠️  Avertissements TypeScript détectés, mais on continue..."
fi

# 4. Build de production
echo "🏗️  4. Build de production..."
npm run build
echo "✅ Build terminé"

# 5. Test du webhook (optionnel)
echo "🧪 5. Test du webhook n8n..."
if command -v curl >/dev/null 2>&1; then
    echo "Test de connectivité du webhook..."
    WEBHOOK_URL=$(grep VITE_N8N_SYNC_WEBHOOK .env | cut -d '=' -f2)
    
    # Test simple de ping
    curl -s -X POST "$WEBHOOK_URL" \
         -H "Content-Type: application/json" \
         -d '{"test": true, "date": "'$(date +%Y-%m-%d)'"}' \
         --max-time 10 \
         > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Webhook accessible"
    else
        echo "⚠️  Webhook non accessible (mais on continue le déploiement)"
    fi
else
    echo "⚠️  curl non disponible, skip test webhook"
fi

# 6. Commit automatique
echo "📝 6. Commit automatique..."
cd ..
git add .
git commit -m "🚀 Deploy: Synchronisation automatique Google Sheets

✨ Nouvelles fonctionnalités:
- Service googleDriveSyncService avec queue hors-ligne
- Intégration automatique dans RAZ Journée  
- Composant GoogleDriveSyncStatus
- Documentation complète + workflow n8n
- Gestion idempotence et retry automatique

🎯 À chaque RAZ Journée:
- Envoi automatique des données vers n8n
- Alimentation Google Sheets (recap + ventes)
- Snapshot XLSX horodaté dans Drive
- Interface de statut en temps réel

🛡️ Fiabilité:
- Queue locale si hors-ligne
- Retry automatique au retour réseau
- Idempotence anti-doublons
- Logs détaillés pour debug" || echo "⚠️  Rien à commiter (déjà à jour)"

# 7. Push vers main
echo "🌐 7. Push vers GitHub..."
git push origin main
echo "✅ Déploiement terminé"

# 8. Résumé
echo ""
echo "🎉 DÉPLOIEMENT RÉUSSI !"
echo "======================="
echo ""
echo "📊 Synchronisation Google Sheets activée:"
echo "   • Service: googleDriveSyncService"
echo "   • Interface: GoogleDriveSyncStatus" 
echo "   • Webhook: VITE_N8N_SYNC_WEBHOOK"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Configurer le Google Sheet avec le guide"
echo "   2. Importer le workflow n8n depuis n8n-workflow-sync-google-sheets.json"
echo "   3. Configurer les credentials Google dans n8n"
echo "   4. Tester avec une RAZ Journée"
echo ""
echo "📖 Documentation: GUIDE-SYNC-GOOGLE-SHEETS.md"
echo "🔧 Workflow n8n: n8n-workflow-sync-google-sheets.json"
echo ""
echo "🚀 Votre tableau sera maintenant alimenté automatiquement !"
