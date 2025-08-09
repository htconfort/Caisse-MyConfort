#!/bin/bash

# 🧹 NETTOYAGE N8N LOCAL - Suppression données de test
# Script pour nettoyer les données parasites dans N8N local

echo "🧹 === NETTOYAGE N8N LOCAL ==="
echo "🎯 Objectif: Supprimer les données de test du 8 août"
echo ""

# Vérifier si N8N est en cours d'exécution
if pgrep -f "n8n" > /dev/null; then
    echo "✅ N8N détecté en cours d'exécution"
    
    # Obtenir le PID de N8N
    N8N_PID=$(pgrep -f "n8n" | head -1)
    echo "📍 PID N8N: $N8N_PID"
    
    echo ""
    echo "🔍 Vérification des données N8N..."
    
    # Test de l'endpoint sync
    echo "📡 Test endpoint sync/invoices:"
    curl -s "http://localhost:5678/webhook/sync/invoices" | jq . || echo "❌ Endpoint non accessible"
    
    echo ""
    echo "📊 Si vous voyez des factures du 8 août ci-dessus, voici les options:"
    echo ""
    echo "🎯 OPTION 1 - Redémarrage N8N (recommandé):"
    echo "   sudo kill $N8N_PID"
    echo "   n8n start --tunnel"
    echo ""
    echo "🎯 OPTION 2 - Nettoyage base de données N8N:"
    echo "   - Ouvrez l'interface N8N: http://localhost:5678"
    echo "   - Allez dans Settings > Database"
    echo "   - Supprimez les exécutions du 8 août"
    echo ""
    echo "🎯 OPTION 3 - Reset cache workflow:"
    echo "   - Ouvrez votre workflow de facturation"
    echo "   - Cliquez sur 'Clear executions'"
    echo "   - Redémarrez le workflow"
    
else
    echo "❌ N8N non détecté"
    echo "💡 Pour démarrer N8N:"
    echo "   cd ~/n8n"
    echo "   n8n start"
fi

echo ""
echo "✨ Après nettoyage N8N, relancez le script web pour synchroniser !"
