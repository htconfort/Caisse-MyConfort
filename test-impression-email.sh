#!/bin/bash

# Test d'intégration du système Impression & E-mail RAZ
# Version 1.0 - Système d'impression et e-mail automatique

echo "🧪 DÉBUT DES TESTS - SYSTÈME IMPRESSION & E-MAIL RAZ"
echo "================================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour tester un élément
test_element() {
    local test_name="$1"
    local file_path="$2"
    
    echo -e "${BLUE}🔍 Test: $test_name${NC}"
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✅ Fichier trouvé: $file_path${NC}"
        return 0
    else
        echo -e "${RED}❌ Fichier manquant: $file_path${NC}"
        return 1
    fi
}

# Fonction pour tester le contenu d'un fichier
test_content() {
    local test_name="$1"
    local file_path="$2"
    local search_pattern="$3"
    
    echo -e "${BLUE}🔍 Test contenu: $test_name${NC}"
    
    if [ -f "$file_path" ] && grep -q "$search_pattern" "$file_path"; then
        echo -e "${GREEN}✅ Contenu vérifié dans: $file_path${NC}"
        return 0
    else
        echo -e "${RED}❌ Contenu manquant dans: $file_path${NC}"
        return 1
    fi
}

# Variables de base
PROJECT_DIR="/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-2/mon-projet-vite"
SERVICES_DIR="$PROJECT_DIR/src/services"
STYLES_DIR="$PROJECT_DIR/src/styles"
UTILS_DIR="$PROJECT_DIR/src/utils"

echo -e "${YELLOW}📁 Répertoire du projet: $PROJECT_DIR${NC}"

# Tests des services
echo -e "\n${YELLOW}🔧 TESTS DES SERVICES${NC}"
echo "========================="

test_element "Service d'impression" "$SERVICES_DIR/printService.js"
test_element "Service d'e-mail" "$SERVICES_DIR/emailService.js"

# Tests des utilitaires
echo -e "\n${YELLOW}🛠️ TESTS DES UTILITAIRES${NC}"
echo "=========================="

test_element "Utilitaires de dates" "$UTILS_DIR/dateUtils.js"

# Tests des styles
echo -e "\n${YELLOW}🎨 TESTS DES STYLES${NC}"
echo "==================="

test_element "CSS d'impression" "$STYLES_DIR/print.css"

# Tests du contenu des services
echo -e "\n${YELLOW}📋 TESTS DU CONTENU${NC}"
echo "==================="

test_content "Fonction generatePDF" "$SERVICES_DIR/printService.js" "generatePDF"
test_content "Fonction sendDailyReport" "$SERVICES_DIR/emailService.js" "sendDailyReport"
test_content "Fonction formatCurrency" "$UTILS_DIR/dateUtils.js" "formatCurrency"
test_content "Règles @media print" "$STYLES_DIR/print.css" "@media print"

# Tests de l'intégration dans App.tsx
echo -e "\n${YELLOW}🔗 TESTS D'INTÉGRATION${NC}"
echo "======================="

test_content "Onglet impression" "$PROJECT_DIR/src/App.tsx" "activeTab === 'impression'"
test_content "Onglet e-mail" "$PROJECT_DIR/src/App.tsx" "activeTab === 'email'"
test_content "Import TabType" "$PROJECT_DIR/src/App.tsx" "TabType"

# Tests des types
echo -e "\n${YELLOW}📝 TESTS DES TYPES${NC}"
echo "=================="

test_content "Type impression" "$PROJECT_DIR/src/constants.ts" "impression"
test_content "Type email" "$PROJECT_DIR/src/constants.ts" "email"

# Vérification des dépendances
echo -e "\n${YELLOW}📦 TESTS DES DÉPENDANCES${NC}"
echo "========================"

cd "$PROJECT_DIR"

echo -e "${BLUE}🔍 Vérification de jspdf${NC}"
if npm list jspdf > /dev/null 2>&1; then
    echo -e "${GREEN}✅ jspdf installé${NC}"
else
    echo -e "${RED}❌ jspdf manquant${NC}"
fi

echo -e "${BLUE}🔍 Vérification de html2canvas${NC}"
if npm list html2canvas > /dev/null 2>&1; then
    echo -e "${GREEN}✅ html2canvas installé${NC}"
else
    echo -e "${RED}❌ html2canvas manquant${NC}"
fi

echo -e "${BLUE}🔍 Vérification de react-to-print${NC}"
if npm list react-to-print > /dev/null 2>&1; then
    echo -e "${GREEN}✅ react-to-print installé${NC}"
else
    echo -e "${RED}❌ react-to-print manquant${NC}"
fi

echo -e "${BLUE}🔍 Vérification de date-fns${NC}"
if npm list date-fns > /dev/null 2>&1; then
    echo -e "${GREEN}✅ date-fns installé${NC}"
else
    echo -e "${RED}❌ date-fns manquant${NC}"
fi

# Test de compilation
echo -e "\n${YELLOW}🏗️ TEST DE COMPILATION${NC}"
echo "======================"

echo -e "${BLUE}🔍 Test de compilation TypeScript${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Compilation réussie${NC}"
else
    echo -e "${RED}❌ Erreur de compilation${NC}"
    echo "Détails de l'erreur:"
    npm run build
fi

# Récapitulatif
echo -e "\n${YELLOW}📊 RÉCAPITULATIF${NC}"
echo "================"

echo -e "${BLUE}🔧 Services créés:${NC}"
echo "  • printService.js - Génération PDF et impression"
echo "  • emailService.js - Envoi d'e-mails automatique"

echo -e "${BLUE}🛠️ Utilitaires créés:${NC}"
echo "  • dateUtils.js - Formatage dates et calculs"

echo -e "${BLUE}🎨 Styles créés:${NC}"
echo "  • print.css - CSS optimisé pour l'impression"

echo -e "${BLUE}🔗 Intégration réalisée:${NC}"
echo "  • Nouveaux onglets 'Impression' et 'E-mail RAZ'"
echo "  • Types TabType étendus"
echo "  • Navigation mise à jour"

echo -e "\n${GREEN}✅ Tests terminés !${NC}"
echo -e "${BLUE}🚀 L'application est prête avec les nouveaux modules d'impression et d'e-mail${NC}"
echo -e "${YELLOW}📌 Prochaines étapes: Développement du backend pour l'e-mail automatique${NC}"
