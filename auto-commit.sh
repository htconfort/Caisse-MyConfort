#!/bin/bash

# Script d'auto-commit pour Caisse MyConfort
# Usage: ./auto-commit.sh "message de commit"

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Début de la sauvegarde automatique GitHub${NC}"

# Vérifier si on est dans un repository git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Erreur: Pas dans un repository Git${NC}"
    exit 1
fi

# Message de commit par défaut ou personnalisé
if [ -z "$1" ]; then
    COMMIT_MESSAGE="🔄 Sauvegarde automatique - $(date '+%Y-%m-%d %H:%M:%S')"
else
    COMMIT_MESSAGE="$1"
fi

echo -e "${YELLOW}📝 Message de commit: ${COMMIT_MESSAGE}${NC}"

# Vérifier s'il y a des changements
if git diff --quiet && git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️  Aucun changement détecté${NC}"
    exit 0
fi

# Afficher le statut
echo -e "${BLUE}📊 Statut des fichiers:${NC}"
git status --short

# Ajouter tous les fichiers
echo -e "${BLUE}📥 Ajout des fichiers...${NC}"
git add .

# Commit
echo -e "${BLUE}💾 Commit en cours...${NC}"
git commit -m "$COMMIT_MESSAGE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Commit réussi${NC}"
else
    echo -e "${RED}❌ Erreur lors du commit${NC}"
    exit 1
fi

# Push vers GitHub
echo -e "${BLUE}🌐 Push vers GitHub...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Sauvegarde GitHub réussie !${NC}"
    echo -e "${GREEN}📁 Repository: https://github.com/htconfort/Caisse-MyConfort${NC}"
else
    echo -e "${RED}❌ Erreur lors du push GitHub${NC}"
    exit 1
fi

# Afficher le hash du dernier commit
LAST_COMMIT=$(git rev-parse --short HEAD)
echo -e "${BLUE}🏷️  Dernier commit: ${LAST_COMMIT}${NC}"

echo -e "${GREEN}✨ Sauvegarde automatique terminée avec succès !${NC}"
