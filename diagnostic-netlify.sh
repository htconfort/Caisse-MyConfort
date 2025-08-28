#!/bin/bash
# 🔍 Script de diagnostic Netlify pour MyConfort
# Vérifie les fichiers manquants et la configuration

echo "🚀 DIAGNOSTIC NETLIFY - MyConfort"
echo "=================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="mon-projet-vite"
DIST_DIR="$PROJECT_DIR/dist"

echo -e "${BLUE}📁 Vérification de la structure des fichiers${NC}"
echo "============================================="

# 1. Vérifier que le dossier dist existe
if [ ! -d "$DIST_DIR" ]; then
    echo -e "${RED}❌ Dossier dist/ manquant !${NC}"
    echo "   Exécutez: cd '$PROJECT_DIR' && npm run build"
    exit 1
else
    echo -e "${GREEN}✅ Dossier dist/ trouvé${NC}"
fi

# 2. Vérifier index.html
if [ -f "$DIST_DIR/index.html" ]; then
    echo -e "${GREEN}✅ index.html présent${NC}"
    SIZE=$(stat -f%z "$DIST_DIR/index.html" 2>/dev/null || echo "0")
    echo "   Taille: ${SIZE} bytes"
else
    echo -e "${RED}❌ index.html MANQUANT !${NC}"
fi

# 3. Vérifier _redirects
if [ -f "$DIST_DIR/_redirects" ]; then
    echo -e "${GREEN}✅ _redirects présent${NC}"
    echo "   Contenu:"
    sed 's/^/   /' "$DIST_DIR/_redirects"
else
    echo -e "${RED}❌ _redirects MANQUANT !${NC}"
fi

# 4. Vérifier les assets
ASSETS_DIR="$DIST_DIR/assets"
if [ -d "$ASSETS_DIR" ]; then
    echo -e "${GREEN}✅ Dossier assets/ présent${NC}"
    echo "   Fichiers assets:"
    ls -la "$ASSETS_DIR" | sed 's/^/   /'
else
    echo -e "${RED}❌ Dossier assets/ MANQUANT !${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Vérification de la configuration${NC}"
echo "===================================="

# 5. Vérifier netlify.toml
NETLIFY_CONFIG="netlify.toml"
if [ -f "$NETLIFY_CONFIG" ]; then
    echo -e "${GREEN}✅ netlify.toml présent${NC}"
    echo "   Configuration publish:"
    grep -E "publish|command" "$NETLIFY_CONFIG" | sed 's/^/   /'
else
    echo -e "${YELLOW}⚠️  netlify.toml non trouvé à la racine${NC}"
fi

# 6. Vérifier package.json
PACKAGE_JSON="$PROJECT_DIR/package.json"
if [ -f "$PACKAGE_JSON" ]; then
    echo -e "${GREEN}✅ package.json présent${NC}"
    echo "   Scripts de build:"
    grep -A 5 '"scripts"' "$PACKAGE_JSON" | sed 's/^/   /'
else
    echo -e "${RED}❌ package.json MANQUANT !${NC}"
fi

echo ""
echo -e "${BLUE}📊 Statistiques des fichiers${NC}"
echo "============================="

echo "📁 Contenu complet du dossier dist/:"
if [ -d "$DIST_DIR" ]; then
    find "$DIST_DIR" -type f | sort | sed 's/^/   /'
    echo ""
    echo "📈 Résumé:"
    HTML_COUNT=$(find "$DIST_DIR" -name "*.html" | wc -l)
    JS_COUNT=$(find "$DIST_DIR" -name "*.js" | wc -l)
    CSS_COUNT=$(find "$DIST_DIR" -name "*.css" | wc -l)
    PNG_COUNT=$(find "$DIST_DIR" -name "*.png" | wc -l)
    SVG_COUNT=$(find "$DIST_DIR" -name "*.svg" | wc -l)
    
    echo "   📄 Fichiers HTML: $HTML_COUNT"
    echo "   📜 Fichiers JS: $JS_COUNT"
    echo "   🎨 Fichiers CSS: $CSS_COUNT"
    echo "   🖼️  Fichiers PNG: $PNG_COUNT"
    echo "   🎯 Fichiers SVG: $SVG_COUNT"
fi

echo ""
echo -e "${BLUE}🌐 Test de validation HTML${NC}"
echo "=========================="

if [ -f "$DIST_DIR/index.html" ]; then
    echo "🔍 Vérification du contenu index.html:"
    
    # Vérifier les liens vers les assets
    if grep -q "assets/" "$DIST_DIR/index.html"; then
        echo -e "${GREEN}✅ Liens vers assets/ trouvés${NC}"
        grep "assets/" "$DIST_DIR/index.html" | sed 's/^/   /'
    else
        echo -e "${RED}❌ Aucun lien vers assets/ trouvé${NC}"
    fi
    
    # Vérifier la div root
    if grep -q 'id="root"' "$DIST_DIR/index.html"; then
        echo -e "${GREEN}✅ Div root trouvée${NC}"
    else
        echo -e "${RED}❌ Div root manquante${NC}"
    fi
fi

echo ""
echo -e "${BLUE}💡 Recommandations${NC}"
echo "=================="

echo "🚀 Pour redéployer sur Netlify:"
echo "   1. Drag & drop du dossier: $DIST_DIR"
echo "   2. Ou utiliser le ZIP: MyConfort-Netlify-FIXED-*.zip"
echo ""
echo "🔧 Si le problème persiste:"
echo "   1. Vérifier l'URL exacte visitée"
echo "   2. Tester l'URL racine: https://votre-site.netlify.app/"
echo "   3. Vérifier les logs de build Netlify"
echo "   4. Supprimer et recréer le site sur Netlify"

echo ""
echo -e "${GREEN}✅ Diagnostic terminé !${NC}"
