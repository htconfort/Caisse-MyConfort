#!/bin/bash

# 🔄 SURVEILLANCE AUTOMATIQUE ET SAUVEGARDE
# Surveille les changements et sauvegarde automatiquement

set -e

REPO_DIR="/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-3"
WATCH_DIRS="mon-projet-vite/src"
LAST_SAVE_FILE="$REPO_DIR/.last_auto_save"
MIN_INTERVAL=300  # 5 minutes minimum entre sauvegardes

echo "🔍 === SURVEILLANCE AUTOMATIQUE ACTIVÉE ==="
echo "📁 Surveillance: $REPO_DIR/$WATCH_DIRS"
echo "⏱️  Intervalle minimum: ${MIN_INTERVAL}s"
echo "🔄 Appuyez sur Ctrl+C pour arrêter"
echo ""

cd "$REPO_DIR"

# Fonction de sauvegarde
auto_save() {
    local current_time=$(date +%s)
    local last_save=0
    
    if [ -f "$LAST_SAVE_FILE" ]; then
        last_save=$(cat "$LAST_SAVE_FILE")
    fi
    
    local time_diff=$((current_time - last_save))
    
    if [ $time_diff -ge $MIN_INTERVAL ]; then
        echo "💾 Changements détectés - Sauvegarde automatique..."
        if ./auto-git-save.sh "AUTO-WATCH: Sauvegarde automatique $(date '+%H:%M:%S')"; then
            echo "$current_time" > "$LAST_SAVE_FILE"
            echo "✅ Sauvegarde terminée à $(date '+%H:%M:%S')"
        else
            echo "❌ Erreur lors de la sauvegarde"
        fi
        echo ""
    else
        local remaining=$((MIN_INTERVAL - time_diff))
        echo "⏳ Changements détectés mais délai non écoulé (${remaining}s restantes)"
    fi
}

# Surveillance avec fswatch (si disponible) ou fallback avec find
if command -v fswatch > /dev/null; then
    echo "🎯 Utilisation de fswatch pour la surveillance..."
    fswatch -o "$WATCH_DIRS" | while read events; do
        auto_save
    done
else
    echo "📊 Utilisation de la surveillance par polling..."
    echo "💡 Pour une meilleure performance, installez fswatch: brew install fswatch"
    
    LAST_CHECK=""
    while true; do
        CURRENT_CHECK=$(find "$WATCH_DIRS" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs ls -la | md5)
        
        if [ "$CURRENT_CHECK" != "$LAST_CHECK" ] && [ -n "$LAST_CHECK" ]; then
            auto_save
        fi
        
        LAST_CHECK="$CURRENT_CHECK"
        sleep 10
    done
fi
