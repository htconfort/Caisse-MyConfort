#!/bin/bash

# Test pour la suppression du doublon Stock général et colonnes Prix/Valeur
# Version: v3.5.1

echo "🧪 Test Optimisation Stock Général - v3.5.1"
echo "=============================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/mon-projet-vite"

echo ""
echo -e "${BLUE}📋 Modifications apportées :${NC}"
echo "1. ❌ Suppression du doublon 'Stock général' avec emoji"
echo "2. 🗑️  Suppression des colonnes 'Prix TTC' et 'Valeur'"
echo "3. 🧹 Suppression du résumé de valeur totale"
echo "4. 🎯 Interface plus compacte et focalisée"
echo ""

# 1. Test de compilation
echo -e "${BLUE}1. Vérification compilation...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Compilation réussie${NC}"
else
    echo -e "${RED}❌ Erreur de compilation${NC}"
    exit 1
fi

# 2. Vérification de la suppression des colonnes
echo ""
echo -e "${BLUE}2. Vérification suppression colonnes Prix/Valeur...${NC}"

if ! grep -q "Prix TTC" "src/components/tabs/stock/GeneralStockTab.tsx"; then
    echo -e "${GREEN}✅ Colonne 'Prix TTC' supprimée${NC}"
else
    echo -e "${RED}❌ Colonne 'Prix TTC' encore présente${NC}"
fi

if ! grep -q "Valeur" "src/components/tabs/stock/GeneralStockTab.tsx"; then
    echo -e "${GREEN}✅ Colonne 'Valeur' supprimée${NC}"
else
    echo -e "${RED}❌ Colonne 'Valeur' encore présente${NC}"
fi

# 3. Vérification de la suppression du résumé de valeur
echo ""
echo -e "${BLUE}3. Vérification suppression résumé valeur totale...${NC}"

if ! grep -q "Valeur totale du stock général" "src/components/tabs/stock/GeneralStockTab.tsx"; then
    echo -e "${GREEN}✅ Résumé de valeur totale supprimé${NC}"
else
    echo -e "${RED}❌ Résumé de valeur totale encore présent${NC}"
fi

# 4. Vérification du header conditionnel
echo ""
echo -e "${BLUE}4. Vérification header conditionnel...${NC}"

if grep -q "activeSubTab !== 'general'" "src/components/tabs/StockTabElegant.tsx"; then
    echo -e "${GREEN}✅ Header conditionnel implémenté${NC}"
else
    echo -e "${RED}❌ Header conditionnel manquant${NC}"
fi

# 5. Démarrage du serveur pour test visuel
echo ""
echo -e "${BLUE}5. Démarrage du serveur de test...${NC}"
echo -e "${YELLOW}⚡ Serveur démarré pour test visuel${NC}"
echo ""
echo -e "${YELLOW}📋 Points à vérifier visuellement :${NC}"
echo "1. Ouvrir l'onglet 'Stock' → 'Stock général'"
echo "2. Vérifier qu'il n'y a plus de doublon de titre"
echo "3. Vérifier que le tableau n'a que 5 colonnes :"
echo "   - Statut"
echo "   - Produit"
echo "   - Catégorie"
echo "   - Stock actuel"
echo "   - Stock min"
echo "4. Vérifier qu'il n'y a plus de résumé de valeur totale"
echo "5. Vérifier que l'interface est plus compacte"
echo ""
echo -e "${GREEN}✅ Points de validation :${NC}"
echo "• Plus de doublon de titre 'Stock général'"
echo "• Tableau simplifié (5 colonnes au lieu de 7)"
echo "• Interface plus focalisée sur la gestion quantitative"
echo "• Header unique et élégant pour le stock général"
echo ""

# Lancer le serveur
npm run dev
