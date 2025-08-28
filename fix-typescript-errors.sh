#!/bin/bash

# 🛠️ SCRIPT DE CORRECTION AUTOMATIQUE - ERREURS TYPESCRIPT
# Caisse MyConfort - Préparation déploiement Netlify
# Date: 27 août 2025

echo "🚀 DÉBUT DES CORRECTIONS TYPESCRIPT - CAISSE MYCONFORT"
echo "=================================================="

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis le répertoire mon-projet-vite${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 PHASE 1: Renommage des fichiers JS → TS${NC}"
echo "--------------------------------------------"

# Sauvegarder les fichiers originaux
echo "💾 Sauvegarde des fichiers originaux..."
if [ -f "src/services/emailService.js" ]; then
    cp src/services/emailService.js src/services/emailService.js.backup
    echo "✅ emailService.js sauvegardé"
fi

if [ -f "src/services/printService.js" ]; then
    cp src/services/printService.js src/services/printService.js.backup
    echo "✅ printService.js sauvegardé"
fi

if [ -f "src/utils/dateUtils.js" ]; then
    cp src/utils/dateUtils.js src/utils/dateUtils.js.backup
    echo "✅ dateUtils.js sauvegardé"
fi

# Renommer les fichiers
echo ""
echo "🔄 Renommage des fichiers..."
if [ -f "src/services/emailService.js" ]; then
    mv src/services/emailService.js src/services/emailService.ts
    echo -e "${GREEN}✅ emailService.js → emailService.ts${NC}"
else
    echo -e "${YELLOW}⚠️  emailService.js non trouvé${NC}"
fi

if [ -f "src/services/printService.js" ]; then
    mv src/services/printService.js src/services/printService.ts
    echo -e "${GREEN}✅ printService.js → printService.ts${NC}"
else
    echo -e "${YELLOW}⚠️  printService.js non trouvé${NC}"
fi

if [ -f "src/utils/dateUtils.js" ]; then
    mv src/utils/dateUtils.js src/utils/dateUtils.ts
    echo -e "${GREEN}✅ dateUtils.js → dateUtils.ts${NC}"
else
    echo -e "${YELLOW}⚠️  dateUtils.js non trouvé${NC}"
fi

echo ""
echo -e "${YELLOW}📋 PHASE 2: Vérification des types${NC}"
echo "------------------------------------"

# Tenter une compilation pour voir les erreurs restantes
echo "🔍 Vérification TypeScript..."
if npm run type-check > typescript-errors.log 2>&1; then
    echo -e "${GREEN}✅ Aucune erreur TypeScript détectée${NC}"
    rm typescript-errors.log
else
    echo -e "${YELLOW}⚠️  Erreurs TypeScript restantes (voir typescript-errors.log)${NC}"
    echo "📄 Premières erreurs:"
    head -20 typescript-errors.log
fi

echo ""
echo -e "${YELLOW}📋 PHASE 3: Test de build${NC}"
echo "----------------------------"

# Tenter un build
echo "🏗️  Test de build de production..."
if npm run build > build-errors.log 2>&1; then
    echo -e "${GREEN}✅ Build réussi! 🎉${NC}"
    echo "📦 Fichiers générés dans le dossier dist/"
    rm build-errors.log
else
    echo -e "${RED}❌ Échec du build (voir build-errors.log)${NC}"
    echo "📄 Premières erreurs:"
    head -20 build-errors.log
fi

echo ""
echo "======================================"
echo -e "${GREEN}📊 RÉSUMÉ DES CORRECTIONS${NC}"
echo "======================================"

echo "✅ Fichiers renommés:"
[ -f "src/services/emailService.ts" ] && echo "   • emailService.js → emailService.ts"
[ -f "src/services/printService.ts" ] && echo "   • printService.js → printService.ts"
[ -f "src/utils/dateUtils.ts" ] && echo "   • dateUtils.js → dateUtils.ts"

echo ""
echo "📁 Fichiers de sauvegarde créés:"
[ -f "src/services/emailService.js.backup" ] && echo "   • emailService.js.backup"
[ -f "src/services/printService.js.backup" ] && echo "   • printService.js.backup"
[ -f "src/utils/dateUtils.js.backup" ] && echo "   • dateUtils.js.backup"

echo ""
echo "🎯 PROCHAINES ÉTAPES MANUELLES:"
echo "1. Corriger les interfaces TypeScript dans src/types/index.ts"
echo "2. Ajouter les types de paramètres dans les fonctions"
echo "3. Corriger la gestion d'erreurs avec instanceof Error"
echo "4. Relancer: npm run build"

echo ""
echo "📖 Consultez le rapport détaillé: RAPPORT-ERREURS-TYPESCRIPT.md"
echo ""
echo -e "${GREEN}🚀 Script terminé!${NC}"
