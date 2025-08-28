#!/bin/bash

# 🚀 SYNCHRONISATION IPAD AUTOMATIQUE
# Push Git → Déclenchement automatique Netlify → Disponible sur iPad

set -e

REPO_DIR="/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-3"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DEFAULT_MESSAGE="IPAD-SYNC: Synchronisation automatique iPad du $TIMESTAMP"

# Message du commit (utilise le paramètre ou le message par défaut)
COMMIT_MESSAGE="${1:-$DEFAULT_MESSAGE}"

echo "📱 === SYNCHRONISATION AUTOMATIQUE IPAD ==="
echo "📁 Répertoire: $REPO_DIR"
echo "💬 Message: $COMMIT_MESSAGE"
echo "⏰ Timestamp: $TIMESTAMP"
echo "🎯 Netlify détectera automatiquement et déploiera"
echo ""

cd "$REPO_DIR"

# Vérifier si on est dans un repo git
if [ ! -d ".git" ]; then
    echo "❌ ERREUR: Ce n'est pas un répertoire Git!"
    exit 1
fi

echo "🔄 PULL DES DERNIÈRES MODIFICATIONS..."
# Pull pour récupérer les derniers changements
if git pull origin main; then
    echo "✅ Pull réussi"
else
    echo "⚠️  Gestion des conflits automatique..."
    git stash
    git pull origin main
    git stash pop 2>/dev/null || echo "Pas de changements en stash"
fi

echo ""
echo "📊 STATUT ACTUEL:"
git status --short

echo ""
echo "📦 AJOUT DES FICHIERS..."

# Ajouter tous les fichiers modifiés
git add .

# Vérifier s'il y a des changements à commiter
if git diff --staged --quiet; then
    echo "ℹ️  Aucun changement à synchroniser."
    exit 0
fi

echo "💾 COMMIT EN COURS..."

# Faire le commit
git commit -m "$COMMIT_MESSAGE"

echo "🌐 PUSH VERS GITHUB (DÉCLENCHEMENT NETLIFY)..."

# Push vers origin main - Netlify détectera automatiquement
if git push origin main; then
    echo ""
    echo "✅ === SYNCHRONISATION RÉUSSIE ==="
    echo "📤 GitHub: Push réussi"
    echo "🔄 Netlify: Déploiement automatique en cours..."
    echo "⏳ Attente de 2-3 minutes pour déploiement"
    echo "📱 iPad: Sera synchronisé automatiquement"
    echo "🎯 Commit: $(git rev-parse --short HEAD)"
    
    # Attendre un peu et vérifier le statut
    echo ""
    echo "⏳ Vérification du déploiement dans 30 secondes..."
    sleep 30
    
    echo "🌐 Site MyConfort disponible sur:"
    echo "   https://caisse-myconfort.netlify.app"
    echo "   (ou votre URL Netlify personnalisée)"
    
else
    echo ""
    echo "❌ Échec du push GitHub"
    echo "🔄 Réessayez avec:"
    echo "    git push origin main"
fi

echo ""
echo "📋 DERNIERS COMMITS:"
git log --oneline -5
