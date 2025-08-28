#!/bin/bash

# 🔄 SURVEILLANCE AUTOMATIQUE NETLIFY
# Surveille les changements et déploie automatiquement pour iPad

set -e

REPO_DIR="/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-3"
WATCH_DIRS="mon-projet-vite/src"
LAST_DEPLOY_FILE="$REPO_DIR/.last_netlify_deploy"
MIN_INTERVAL=600  # 10 minutes minimum entre déploiements

echo "🔍 === SURVEILLANCE NETLIFY ACTIVÉE ==="
echo "📁 Surveillance: $REPO_DIR/$WATCH_DIRS"
echo "⏱️  Intervalle minimum: ${MIN_INTERVAL}s (10 min)"
echo "📱 Cible: Synchronisation iPad automatique"
echo "🔄 Appuyez sur Ctrl+C pour arrêter"
echo ""

cd "$REPO_DIR"

# Fonction de déploiement automatique
auto_deploy() {
    local current_time=$(date +%s)
    local last_deploy=0
    
    if [ -f "$LAST_DEPLOY_FILE" ]; then
        last_deploy=$(cat "$LAST_DEPLOY_FILE")
    fi
    
    local time_diff=$((current_time - last_deploy))
    
    if [ $time_diff -ge $MIN_INTERVAL ]; then
        echo "🚀 Changements détectés - Déploiement automatique..."
        if ./auto-deploy-netlify.sh "AUTO-NETLIFY: Déploiement automatique $(date '+%H:%M:%S')"; then
            echo "$current_time" > "$LAST_DEPLOY_FILE"
            echo "✅ Déploiement terminé à $(date '+%H:%M:%S')"
            echo "📱 Disponible sur iPad!"
        else
            echo "❌ Erreur lors du déploiement"
        fi
        echo ""
    else
        local remaining=$((MIN_INTERVAL - time_diff))
        local remaining_min=$((remaining / 60))
        echo "⏳ Changements détectés mais délai non écoulé (${remaining_min}min ${remaining}s restantes)"
    fi
}

# Surveillance avec fswatch (si disponible) ou fallback avec find
if command -v fswatch > /dev/null; then
    echo "🎯 Utilisation de fswatch pour la surveillance Netlify..."
    fswatch -o "$WATCH_DIRS" | while read events; do
        auto_deploy
    done
else
    echo "📊 Utilisation de la surveillance par polling..."
    echo "💡 Pour une meilleure performance, installez fswatch: brew install fswatch"
    
    LAST_CHECK=""
    while true; do
        CURRENT_CHECK=$(find "$WATCH_DIRS" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs ls -la | md5)
        
        if [ "$CURRENT_CHECK" != "$LAST_CHECK" ] && [ -n "$LAST_CHECK" ]; then
            auto_deploy
        fi
        
        LAST_CHECK="$CURRENT_CHECK"
        sleep 30  # Vérification toutes les 30 secondes pour Netlify
    done
fi
