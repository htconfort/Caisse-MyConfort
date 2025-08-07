#!/bin/bash

# Test pour la navigation compacte des onglets stock
# Version: v3.5.0

echo "🧪 Test Navigation Compacte Stock - v3.5.0"
echo "=============================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/mon-projet-vite"

echo ""
echo -e "${BLUE}📋 Tests à effectuer :${NC}"
echo "1. ✅ Vérification de la compilation"
echo "2. 🎯 Test des 3 modes de vue (cartes, compact, horizontal)"
echo "3. 📱 Test de la responsivité mobile"
echo "4. 🚀 Test de performance de navigation"
echo ""

# 1. Test de compilation
echo -e "${BLUE}1. Vérification compilation...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Compilation réussie${NC}"
else
    echo -e "${RED}❌ Erreur de compilation${NC}"
    exit 1
fi

# 2. Vérification des fichiers créés
echo ""
echo -e "${BLUE}2. Vérification des fichiers...${NC}"

files_to_check=(
    "src/components/tabs/stock/CompactStockTabsNav.tsx"
    "src/styles/compact-stock-tabs.css"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file manquant${NC}"
        exit 1
    fi
done

# 3. Test de contenu des composants
echo ""
echo -e "${BLUE}3. Vérification du contenu des composants...${NC}"

# Vérifier CompactStockTabsNav
if grep -q "compact-stock-tab-button" "src/components/tabs/stock/CompactStockTabsNav.tsx"; then
    echo -e "${GREEN}✅ CompactStockTabsNav contient les classes CSS${NC}"
else
    echo -e "${RED}❌ CompactStockTabsNav manque les classes CSS${NC}"
fi

# Vérifier StockTabElegant
if grep -q "viewMode.*horizontal" "src/components/tabs/StockTabElegant.tsx"; then
    echo -e "${GREEN}✅ StockTabElegant a le mode horizontal${NC}"
else
    echo -e "${RED}❌ StockTabElegant manque le mode horizontal${NC}"
fi

# 4. Vérification du CSS
echo ""
echo -e "${BLUE}4. Vérification du CSS...${NC}"

if grep -q "@media.*max-width.*768px" "src/styles/compact-stock-tabs.css"; then
    echo -e "${GREEN}✅ CSS responsive présent${NC}"
else
    echo -e "${RED}❌ CSS responsive manquant${NC}"
fi

if grep -q "fadeInSlide" "src/styles/compact-stock-tabs.css"; then
    echo -e "${GREEN}✅ Animations CSS présentes${NC}"
else
    echo -e "${RED}❌ Animations CSS manquantes${NC}"
fi

# 5. Démarrage du serveur de développement
echo ""
echo -e "${BLUE}5. Démarrage du serveur de test...${NC}"
echo -e "${YELLOW}⚡ Serveur démarré sur http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}📋 Instructions de test manuel :${NC}"
echo "1. Ouvrir http://localhost:5173"
echo "2. Aller dans l'onglet 'Stock'"
echo "3. Cliquer sur le bouton 'Vue cartes/compacte/horizontale'"
echo "4. Vérifier les 3 modes de navigation :"
echo "   - Mode Cartes : Navigation avec cartes élégantes"
echo "   - Mode Compact : Cartes plus petites"
echo "   - Mode Horizontal : Navigation avec boutons horizontaux"
echo "5. Tester la responsivité sur mobile"
echo "6. Vérifier les animations de transition"
echo ""
echo -e "${GREEN}🎯 Points de validation :${NC}"
echo "• Navigation fluide entre les modes"
echo "• Responsive design (mobile/tablette)"
echo "• Animations de transition"
echo "• Mode horizontal avec navigation compacte"
echo "• Fonctionnalité des 4 sous-onglets stock"
echo ""

# Lancer le serveur
npm run dev
