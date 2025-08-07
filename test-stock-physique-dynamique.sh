#!/bin/bash

# Test pour le nouveau stock physique avec déductions automatiques
# Version: v3.7.0

echo "🧪 Test Stock Physique Dynamique - v3.7.0"
echo "=============================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/mon-projet-vite"

echo ""
echo -e "${BLUE}📋 Tests à effectuer :${NC}"
echo "1. ✅ Vérification de la compilation"
echo "2. 🔄 Test de la suppression des onglets inutiles"
echo "3. 📦 Test du nouveau PhysicalStockTab"
echo "4. 🛒 Test de la déduction automatique ventes locales"
echo "5. 📡 Test de la déduction N8N (produits emportés uniquement)"
echo ""

# 1. Test de compilation
echo -e "${BLUE}1. Vérification compilation...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Compilation réussie${NC}"
else
    echo -e "${RED}❌ Erreur de compilation${NC}"
    exit 1
fi

# 2. Vérification des fichiers supprimés
echo ""
echo -e "${BLUE}2. Vérification des suppressions...${NC}"

deleted_files=(
    "src/components/tabs/stock/StandEntryTab.tsx"
    "src/components/tabs/stock/TrailerEntryTab.tsx"
)

for file in "${deleted_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${GREEN}✅ $file supprimé${NC}"
    else
        echo -e "${YELLOW}⚠️  $file encore présent${NC}"
    fi
done

# 3. Vérification des nouveaux fichiers
echo ""
echo -e "${BLUE}3. Vérification des nouveaux composants...${NC}"

new_files=(
    "src/components/tabs/stock/PhysicalStockTab.tsx"
)

for file in "${new_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file créé${NC}"
    else
        echo -e "${RED}❌ $file manquant${NC}"
        exit 1
    fi
done

# 4. Vérification du contenu PhysicalStockTab
echo ""
echo -e "${BLUE}4. Vérification du PhysicalStockTab...${NC}"

# Vérifier la synchronisation
if grep -q "syncService.getCurrentPhysicalStock" "src/components/tabs/stock/PhysicalStockTab.tsx"; then
    echo -e "${GREEN}✅ Synchronisation avec syncService${NC}"
else
    echo -e "${RED}❌ Synchronisation manquante${NC}"
fi

# Vérifier l'édition manuelle
if grep -q "syncService.updateProductStock" "src/components/tabs/stock/PhysicalStockTab.tsx"; then
    echo -e "${GREEN}✅ Édition manuelle possible${NC}"
else
    echo -e "${RED}❌ Édition manuelle manquante${NC}"
fi

# Vérifier les colonnes spécifiques
if grep -q "Stock réservé\|Stock disponible\|Dernière MAJ" "src/components/tabs/stock/PhysicalStockTab.tsx"; then
    echo -e "${GREEN}✅ Colonnes stock physique présentes${NC}"
else
    echo -e "${RED}❌ Colonnes stock physique manquantes${NC}"
fi

# 5. Vérification de la déduction automatique dans App.tsx
echo ""
echo -e "${BLUE}5. Vérification des déductions automatiques...${NC}"

if grep -q "syncService.deductStockFromLocalSale" "src/App.tsx"; then
    echo -e "${GREEN}✅ Déduction ventes locales intégrée${NC}"
else
    echo -e "${RED}❌ Déduction ventes locales manquante${NC}"
fi

# 6. Vérification du syncService
echo ""
echo -e "${BLUE}6. Vérification du syncService amélioré...${NC}"

# Vérifier la méthode de déduction locale
if grep -q "deductStockFromLocalSale" "src/services/syncService.ts"; then
    echo -e "${GREEN}✅ Méthode déduction locale présente${NC}"
else
    echo -e "${RED}❌ Méthode déduction locale manquante${NC}"
fi

# Vérifier le type de livraison
if grep -q "deliveryType.*emporte\|livraison" "src/services/syncService.ts"; then
    echo -e "${GREEN}✅ Type de livraison géré${NC}"
else
    echo -e "${RED}❌ Type de livraison manquant${NC}"
fi

# Vérifier la détection automatique
if grep -q "detectDeliveryType" "src/services/syncService.ts"; then
    echo -e "${GREEN}✅ Détection automatique type livraison${NC}"
else
    echo -e "${RED}❌ Détection automatique manquante${NC}"
fi

# 7. Vérification de la navigation mise à jour
echo ""
echo -e "${BLUE}7. Vérification de la navigation...${NC}"

if grep -q "general.*physical" "src/components/tabs/stock/CompactStockTabsNav.tsx"; then
    echo -e "${GREEN}✅ Navigation compacte mise à jour${NC}"
else
    echo -e "${RED}❌ Navigation compacte non mise à jour${NC}"
fi

# 8. Démarrage du serveur de test
echo ""
echo -e "${BLUE}8. Démarrage du serveur de test...${NC}"
echo -e "${YELLOW}⚡ Serveur démarré sur http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}📋 Instructions de test manuel :${NC}"
echo "1. Ouvrir http://localhost:5173"
echo "2. Aller dans l'onglet 'Stock'"
echo "3. Vérifier que seuls 2 onglets sont présents :"
echo "   📦 Stock général"
echo "   🗄️ Stock physique"
echo ""
echo -e "${PURPLE}4. Tester le Stock Physique :${NC}"
echo "   • Interface identique au stock général"
echo "   • Colonnes supplémentaires : Stock réservé, Stock disponible, Dernière MAJ"
echo "   • Édition manuelle possible (avec PIN)"
echo "   • Rechargement automatique toutes les 30s"
echo "   • Indicateur de synchronisation"
echo ""
echo -e "${PURPLE}5. Tester la déduction automatique :${NC}"
echo "   • Effectuer une vente locale (onglet Produits)"
echo "   • Vérifier que le stock physique est déduit automatiquement"
echo "   • Consulter les logs de la console (F12)"
echo ""
echo -e "${PURPLE}6. Simulation N8N :${NC}"
echo "   • Les factures N8N avec deliveryType='emporte' déduisent le stock physique"
echo "   • Les factures N8N avec deliveryType='livraison' ne déduisent PAS le stock physique"
echo "   • Par défaut, considéré comme 'emporte' si non spécifié"
echo ""
echo -e "${GREEN}🎯 Points de validation :${NC}"
echo "• Navigation simplifiée (2 onglets uniquement)"
echo "• Stock physique avec déductions automatiques"
echo "• Ventes locales déduites immédiatement"
echo "• Factures N8N déduites selon le type de livraison"
echo "• Interface d'édition manuelle conservée"
echo "• Synchronisation temps réel"
echo "• Logs détaillés des mouvements de stock"
echo ""
echo -e "${BLUE}🔧 Logique de déduction :${NC}"
echo "• Vente locale → Déduction immédiate du stock physique"
echo "• Facture N8N 'emporte' → Déduction du stock physique"
echo "• Facture N8N 'livraison' → Pas de déduction du stock physique"
echo "• Logs détaillés dans la console pour debugging"
echo ""

# Lancer le serveur
npm run dev
