#!/bin/bash

# 🚀 DÉPLOIEMENT AUTOMATIQUE NETLIFY
# Système de synchronisation automatique pour iPad

set -e

REPO_DIR="/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-3"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DEFAULT_MESSAGE="AUTO-DEPLOY: Déploiement automatique du $TIMESTAMP"

# Message du commit (utilise le paramètre ou le message par défaut)
COMMIT_MESSAGE="${1:-$DEFAULT_MESSAGE}"

echo "🚀 === DÉPLOIEMENT AUTOMATIQUE NETLIFY ==="
echo "📁 Répertoire: $REPO_DIR"
echo "💬 Message: $COMMIT_MESSAGE"
echo "⏰ Timestamp: $TIMESTAMP"
echo "📱 Cible: Synchronisation iPad"
echo ""

# Aller dans le répertoire du projet
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
    echo "⚠️  Conflit détecté, résolution automatique..."
    git merge --strategy-option=theirs origin/main
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
    echo "ℹ️  Aucun changement local à déployer."
    echo "🔄 Vérification du build..."
else
    echo "💾 COMMIT EN COURS..."
    # Faire le commit
    git commit -m "$COMMIT_MESSAGE"
    
    echo "🌐 PUSH VERS LE SERVEUR..."
    # Push vers origin main
    git push origin main
fi

echo ""
echo "🏗️  BUILD POUR PRODUCTION..."

# Aller dans le répertoire du projet Vite
cd "$REPO_DIR/mon-projet-vite"

# Build de production
if npm run build; then
    echo "✅ Build réussi"
else
    echo "❌ Erreur lors du build"
    exit 1
fi

echo ""
echo "🌐 DÉPLOIEMENT NETLIFY..."

# Vérifier si Netlify CLI est installé
if ! command -v netlify &> /dev/null; then
    echo "📦 Installation de Netlify CLI..."
    npm install -g netlify-cli
fi

# Déploiement sur Netlify
if netlify deploy --prod --dir=dist; then
    echo ""
    echo "✅ === DÉPLOIEMENT RÉUSSI ==="
    echo "🌐 Site disponible sur: https://your-site-name.netlify.app"
    echo "📱 Accessible sur iPad maintenant!"
    echo "🎯 Commit: $(git rev-parse --short HEAD)"
else
    echo ""
    echo "❌ Échec du déploiement Netlify"
    echo "🔄 Vérifiez la configuration Netlify"
    exit 1
fi

echo ""
echo "📋 DERNIERS COMMITS:"
cd "$REPO_DIR"
git log --oneline -5

echo ""
echo "⏰ Déployé à: $TIMESTAMP"
