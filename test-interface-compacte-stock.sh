#!/bin/bash

# Test pour l'interface compacte du stock général
# Version: v3.6.0

echo "🧪 Test Interface Compacte Stock Général - v3.6.0"
echo "=================================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/mon-projet-vite"

echo ""
echo -e "${BLUE}📋 Modifications apportées :${NC}"
echo "1. ✅ Titre principal élégant et plus grand"
echo "2. 🎯 Statistiques et recherche sur la même ligne"
echo "3. 📱 Interface ultra-compacte et optimisée"
echo "4. 🎨 Typographie améliorée"
echo ""

# 1. Test de compilation
echo -e "${BLUE}1. Vérification compilation...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Compilation réussie${NC}"
else
    echo -e "${RED}❌ Erreur de compilation${NC}"
    exit 1
fi

# 2. Vérification des modifications dans GeneralStockTab
echo ""
echo -e "${BLUE}2. Vérification du contenu...${NC}"

if grep -q "text-3xl font-bold" "src/components/tabs/stock/GeneralStockTab.tsx"; then
    echo -e "${GREEN}✅ Titre principal élégant implémenté${NC}"
else
    echo -e "${RED}❌ Titre principal manquant${NC}"
fi

if grep -q "stat-item-compact" "src/components/tabs/stock/GeneralStockTab.tsx"; then
    echo -e "${GREEN}✅ Statistiques compactes implémentées${NC}"
else
    echo -e "${RED}❌ Statistiques compactes manquantes${NC}"
fi

if grep -q "lg:flex-row.*gap-4.*items-start.*lg:items-center" "src/components/tabs/stock/GeneralStockTab.tsx"; then
    echo -e "${GREEN}✅ Layout responsive sur même ligne implémenté${NC}"
else
    echo -e "${RED}❌ Layout responsive manquant${NC}"
fi

# 3. Vérification du CSS
echo ""
echo -e "${BLUE}3. Vérification du CSS...${NC}"

if grep -q "stat-item-compact" "src/styles/general-stock-compact.css"; then
    echo -e "${GREEN}✅ Styles compacts présents${NC}"
else
    echo -e "${RED}❌ Styles compacts manquants${NC}"
fi

if grep -q "elegant-title" "src/styles/general-stock-compact.css"; then
    echo -e "${GREEN}✅ Styles titre élégant présents${NC}"
else
    echo -e "${RED}❌ Styles titre élégant manquants${NC}"
fi

# 4. Test des breakpoints responsive
echo ""
echo -e "${BLUE}4. Vérification responsive...${NC}"

if grep -q "@media.*max-width.*768px" "src/styles/general-stock-compact.css"; then
    echo -e "${GREEN}✅ Responsive mobile présent${NC}"
else
    echo -e "${RED}❌ Responsive mobile manquant${NC}"
fi

if grep -q "@media.*max-width.*1024px" "src/styles/general-stock-compact.css"; then
    echo -e "${GREEN}✅ Responsive tablette présent${NC}"
else
    echo -e "${RED}❌ Responsive tablette manquant${NC}"
fi

# 5. Démarrage du serveur de développement
echo ""
echo -e "${BLUE}5. Démarrage du serveur de test...${NC}"
echo -e "${YELLOW}⚡ Serveur démarré sur http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}📋 Instructions de test manuel :${NC}"
echo "1. Ouvrir http://localhost:5173"
echo "2. Aller dans l'onglet 'Stock' puis 'Stock général'"
echo "3. Vérifier les améliorations :"
echo ""
echo -e "${GREEN}🎯 Points de validation :${NC}"
echo "• Titre principal : 'Stock général' plus grand et élégant"
echo "• Sous-titre : 'Inventaire principal et gestion des stocks'"
echo "• Layout compact : Statistiques + Recherche sur même ligne"
echo "• Statistiques réduites : Icônes 14px, texte plus petit"
echo "• Séparateur vertical entre statistiques et recherche"
echo "• Recherche compacte : Input et select plus petits"
echo "• Titre tableau : 'Inventaire général' plus élégant"
echo "• Responsive : Adaptation mobile/tablette"
echo ""
echo -e "${BLUE}💡 Comparaison avec l'ancienne version :${NC}"
echo "AVANT : Titre normal + Stats sur ligne + Recherche ligne séparée"
echo "APRÈS : Titre élégant + Stats + Recherche sur MÊME ligne compacte"
echo ""

# Lancer le serveur
npm run dev
