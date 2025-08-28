#!/bin/bash

# 🔄 SAUVEGARDE + DÉPLOIEMENT COMPLET
# Git + Netlify en une seule commande pour synchronisation iPad

set -e

REPO_DIR="/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-3"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DEFAULT_MESSAGE="FULL-SYNC: Sauvegarde et déploiement automatique du $TIMESTAMP"

# Message du commit (utilise le paramètre ou le message par défaut)
COMMIT_MESSAGE="${1:-$DEFAULT_MESSAGE}"

echo "🚀 === SYNCHRONISATION COMPLÈTE (GIT + NETLIFY) ==="
echo "📁 Répertoire: $REPO_DIR"
echo "💬 Message: $COMMIT_MESSAGE"
echo "⏰ Timestamp: $TIMESTAMP"
echo "🎯 Objectif: Synchronisation iPad immédiate"
echo ""

cd "$REPO_DIR"

echo "📦 ÉTAPE 1/3: SAUVEGARDE GIT..."
if ./auto-git-save.sh "$COMMIT_MESSAGE"; then
    echo "✅ Git sauvegarde réussie"
else
    echo "❌ Erreur Git - Arrêt du processus"
    exit 1
fi

echo ""
echo "🏗️  ÉTAPE 2/3: BUILD PRODUCTION..."
cd "$REPO_DIR/mon-projet-vite"

if npm run build; then
    echo "✅ Build réussi"
else
    echo "❌ Erreur build - Arrêt du processus"
    exit 1
fi

echo ""
echo "🌐 ÉTAPE 3/3: DÉPLOIEMENT NETLIFY..."

# Vérifier si Netlify CLI est installé
if ! command -v netlify &> /dev/null; then
    echo "📦 Installation de Netlify CLI..."
    npm install -g netlify-cli
fi

# Déploiement sur Netlify
if netlify deploy --prod --dir=dist; then
    echo ""
    echo "✅ === SYNCHRONISATION COMPLÈTE RÉUSSIE ==="
    echo "💾 Git: Sauvegardé sur origin/main"
    echo "🌐 Netlify: Déployé en production"
    echo "📱 iPad: Synchronisé et accessible"
    echo "🎯 Commit: $(git rev-parse --short HEAD)"
    echo "⏰ Synchronisé à: $TIMESTAMP"
else
    echo ""
    echo "❌ Échec du déploiement Netlify"
    echo "💾 Git: Sauvegardé (OK)"
    echo "🌐 Netlify: Échec"
    exit 1
fi

echo ""
echo "📋 DERNIERS COMMITS:"
cd "$REPO_DIR"
git log --oneline -3
