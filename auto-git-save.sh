#!/bin/bash

# 🔄 SCRIPT DE SAUVEGARDE AUTOMATIQUE GIT
# Utilisation: ./auto-git-save.sh "message du commit"

set -e

# Configuration
REPO_DIR="/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-3"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DEFAULT_MESSAGE="AUTO-SAVE: Mise à jour automatique du $TIMESTAMP"

# Message du commit (utilise le paramètre ou le message par défaut)
COMMIT_MESSAGE="${1:-$DEFAULT_MESSAGE}"

echo "🚀 === SAUVEGARDE AUTOMATIQUE GIT ==="
echo "📁 Répertoire: $REPO_DIR"
echo "💬 Message: $COMMIT_MESSAGE"
echo "⏰ Timestamp: $TIMESTAMP"
echo ""

# Aller dans le répertoire du projet
cd "$REPO_DIR"

# Vérifier si on est dans un repo git
if [ ! -d ".git" ]; then
    echo "❌ ERREUR: Ce n'est pas un répertoire Git!"
    exit 1
fi

# Afficher le statut actuel
echo "📊 STATUT ACTUEL:"
git status --short

echo ""
echo "📦 AJOUT DES FICHIERS..."

# Ajouter tous les fichiers modifiés
git add .

# Vérifier s'il y a des changements à commiter
if git diff --staged --quiet; then
    echo "ℹ️  Aucun changement à sauvegarder."
    exit 0
fi

echo "💾 COMMIT EN COURS..."

# Faire le commit
git commit -m "$COMMIT_MESSAGE"

echo "🌐 PUSH VERS LE SERVEUR..."

# Push vers origin main
if git push origin main; then
    echo ""
    echo "✅ === SAUVEGARDE TERMINÉE AVEC SUCCÈS ==="
    echo "🎯 Commit: $(git rev-parse --short HEAD)"
    echo "📤 Poussé vers: origin/main"
else
    echo ""
    echo "⚠️  Le push a échoué, mais le commit local est fait."
    echo "🔄 Essayez de pousser manuellement plus tard avec:"
    echo "    git push origin main"
fi

echo ""
echo "📋 DERNIERS COMMITS:"
git log --oneline -5
