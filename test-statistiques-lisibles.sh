#!/bin/bash

# Test pour les statistiques hyper lisibles du stock général
# Version: v3.6.0

echo "🧪 Test Statistiques Hyper Lisibles - v3.6.0"
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
echo "2. 🎨 Test de la lisibilité des statistiques"
echo "3. 📱 Test de la responsivité"
echo "4. 🎯 Test du contraste et de la visibilité"
echo ""

# 1. Test de compilation
echo -e "${BLUE}1. Vérification compilation...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Compilation réussie${NC}"
else
    echo -e "${RED}❌ Erreur de compilation${NC}"
    exit 1
fi

# 2. Vérification du contenu des modifications
echo ""
echo -e "${BLUE}2. Vérification des modifications...${NC}"

# Vérifier la police doublée (text-2xl)
if grep -q "text-2xl font-black" "src/components/tabs/stock/GeneralStockTab.tsx"; then
    echo -e "${GREEN}✅ Police doublée (text-2xl) appliquée${NC}"
else
    echo -e "${RED}❌ Police doublée manquante${NC}"
fi

# Vérifier l'ombre de texte pour le contraste
if grep -q "textShadow.*rgba" "src/components/tabs/stock/GeneralStockTab.tsx"; then
    echo -e "${GREEN}✅ Ombre de texte pour contraste présente${NC}"
else
    echo -e "${RED}❌ Ombre de texte manquante${NC}"
fi

# Vérifier les couleurs spécifiques
colors_check=(
    "#654321.*Références"
    "#15803D.*Stock OK"
    "#EA580C.*Stock faible"
    "#B91C1C.*Rupture"
)

for color_pattern in "${colors_check[@]}"; do
    if grep -q "$color_pattern" "src/components/tabs/stock/GeneralStockTab.tsx"; then
        echo -e "${GREEN}✅ Couleur contrastée trouvée : $color_pattern${NC}"
    else
        echo -e "${YELLOW}⚠️  Pattern couleur non trouvé : $color_pattern${NC}"
    fi
done

# Vérifier les emojis agrandis
if grep -q 'text-2xl">📦\|text-2xl">✅\|text-2xl">⚠️\|text-2xl">🚨' "src/components/tabs/stock/GeneralStockTab.tsx"; then
    echo -e "${GREEN}✅ Emojis agrandis présents${NC}"
else
    echo -e "${RED}❌ Emojis agrandis manquants${NC}"
fi

# 3. Vérification de l'espacement amélioré
echo ""
echo -e "${BLUE}3. Vérification de l'espacement...${NC}"

if grep -q "gap-6\|gap-3" "src/components/tabs/stock/GeneralStockTab.tsx"; then
    echo -e "${GREEN}✅ Espacement amélioré présent${NC}"
else
    echo -e "${RED}❌ Espacement amélioré manquant${NC}"
fi

# 4. Démarrage du serveur de test
echo ""
echo -e "${BLUE}4. Démarrage du serveur de test...${NC}"
echo -e "${YELLOW}⚡ Serveur démarré sur http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}📋 Instructions de test manuel :${NC}"
echo "1. Ouvrir http://localhost:5173"
echo "2. Aller dans l'onglet 'Stock' puis 'Stock général'"
echo "3. Vérifier la ligne des statistiques :"
echo "   📦 Références (Marron foncé #654321)"
echo "   ✅ Stock OK (Vert foncé #15803D)"
echo "   ⚠️ Stock faible (Orange foncé #EA580C)"
echo "   🚨 Rupture (Rouge foncé #B91C1C)"
echo "4. Vérifier que la police est 2x plus grande (text-2xl)"
echo "5. Vérifier l'ombre de texte pour le contraste"
echo "6. Tester sur différentes tailles d'écran"
echo ""
echo -e "${GREEN}🎯 Points de validation :${NC}"
echo "• Police 2x plus grande et hyper lisible"
echo "• Contraste maximal avec ombres de texte"
echo "• Couleurs distinctes pour chaque statut"
echo "• Emojis plus grands et visibles"
echo "• Espacement optimisé entre les éléments"
echo "• Responsive design maintenu"
echo ""
echo -e "${BLUE}🎨 Palette de couleurs utilisées :${NC}"
echo "• Références : Marron #654321 (Saddle Brown)"
echo "• Stock OK : Vert #15803D (Dark Green)"
echo "• Stock faible : Orange #EA580C (Dark Orange)"
echo "• Rupture : Rouge #B91C1C (Dark Red)"
echo ""

# Lancer le serveur
npm run dev
