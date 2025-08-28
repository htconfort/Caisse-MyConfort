#!/bin/bash

# 📱 SURVEILLANCE CONTINUE POUR IPAD
# Surveille et synchronise automatiquement pour iPad

set -e

REPO_DIR="/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-3"
WATCH_DIRS="mon-projet-vite/src"
LAST_SYNC_FILE="$REPO_DIR/.last_ipad_sync"
MIN_INTERVAL=300  # 5 minutes minimum entre synchronisations

echo "📱 === SURVEILLANCE IPAD ACTIVÉE ==="
echo "📁 Surveillance: $REPO_DIR/$WATCH_DIRS"
echo "⏱️  Intervalle minimum: ${MIN_INTERVAL}s (5 min)"
echo "🌐 Auto-déploiement: GitHub → Netlify → iPad"
echo "🔄 Appuyez sur Ctrl+C pour arrêter"
echo ""

cd "$REPO_DIR"

# Fonction de synchronisation automatique
auto_sync_ipad() {
    local current_time=$(date +%s)
    local last_sync=0
    
    if [ -f "$LAST_SYNC_FILE" ]; then
        last_sync=$(cat "$LAST_SYNC_FILE")
    fi
    
    local time_diff=$((current_time - last_sync))
    
    if [ $time_diff -ge $MIN_INTERVAL ]; then
        echo "📱 Changements détectés - Synchronisation iPad..."
        if ./ipad-sync.sh "AUTO-IPAD: Synchronisation automatique $(date '+%H:%M:%S')"; then
            echo "$current_time" > "$LAST_SYNC_FILE"
            echo "✅ Synchronisation iPad terminée à $(date '+%H:%M:%S')"
            echo "🔄 Netlify déploiera automatiquement dans 2-3 min"
        else
            echo "❌ Erreur lors de la synchronisation"
        fi
        echo ""
    else
        local remaining=$((MIN_INTERVAL - time_diff))
        local remaining_min=$((remaining / 60))
        echo "⏳ Changements détectés mais délai non écoulé (${remaining_min}min restantes)"
    fi
}

# Surveillance avec fswatch (si disponible) ou fallback avec find
if command -v fswatch > /dev/null; then
    echo "🎯 Utilisation de fswatch pour la surveillance iPad..."
    fswatch -o "$WATCH_DIRS" | while read events; do
        auto_sync_ipad
    done
else
    echo "📊 Utilisation de la surveillance par polling..."
    echo "💡 Pour une meilleure performance, installez fswatch: brew install fswatch"
    
    LAST_CHECK=""
    while true; do
        CURRENT_CHECK=$(find "$WATCH_DIRS" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" | xargs ls -la 2>/dev/null | md5 2>/dev/null || echo "")
        
        if [ "$CURRENT_CHECK" != "$LAST_CHECK" ] && [ -n "$LAST_CHECK" ]; then
            auto_sync_ipad
        fi
        
        LAST_CHECK="$CURRENT_CHECK"
        sleep 20  # Vérification toutes les 20 secondes pour réactivité
    done
fi
