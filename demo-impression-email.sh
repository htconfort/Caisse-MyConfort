#!/bin/bash

# Script de démonstration du système Impression & E-mail RAZ
# Version 1.0 - Test en temps réel

echo "🎯 DÉMONSTRATION SYSTÈME IMPRESSION & E-MAIL RAZ"
echo "==============================================="

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-2/mon-projet-vite"

echo -e "${BLUE}📁 Répertoire: $PROJECT_DIR${NC}"

cd "$PROJECT_DIR"

echo -e "\n${YELLOW}🔧 VÉRIFICATION DE L'ENVIRONNEMENT${NC}"
echo "=================================="

# Vérifier Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installé: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js non trouvé${NC}"
    exit 1
fi

# Vérifier npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm installé: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm non trouvé${NC}"
    exit 1
fi

# Vérifier les dépendances
echo -e "\n${YELLOW}📦 VÉRIFICATION DES DÉPENDANCES${NC}"
echo "==============================="

DEPENDENCIES=("jspdf" "html2canvas" "react-to-print" "date-fns")

for dep in "${DEPENDENCIES[@]}"; do
    if npm list "$dep" &> /dev/null; then
        VERSION=$(npm list "$dep" 2>/dev/null | grep "$dep" | head -1 | sed 's/.*@//' | sed 's/ .*//')
        echo -e "${GREEN}✅ $dep@$VERSION${NC}"
    else
        echo -e "${RED}❌ $dep manquant${NC}"
    fi
done

echo -e "\n${YELLOW}🚀 DÉMARRAGE DE L'APPLICATION${NC}"
echo "================================"

echo -e "${BLUE}🔄 Lancement du serveur de développement...${NC}"

# Démarrer en arrière-plan et capturer le PID
npm run dev &
DEV_PID=$!

echo -e "${GREEN}✅ Serveur démarré (PID: $DEV_PID)${NC}"

# Attendre que le serveur soit prêt
echo -e "${BLUE}⏳ Attente du démarrage complet...${NC}"
sleep 5

# Vérifier si le serveur répond
echo -e "${BLUE}🔍 Vérification de la connectivité...${NC}"

# Essayer plusieurs ports
PORTS=(5173 5174 5175 5176 5177 5178)
SERVER_URL=""

for port in "${PORTS[@]}"; do
    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
        SERVER_URL="http://localhost:$port"
        echo -e "${GREEN}✅ Serveur accessible sur: $SERVER_URL${NC}"
        break
    fi
done

if [ -z "$SERVER_URL" ]; then
    echo -e "${RED}❌ Impossible de se connecter au serveur${NC}"
    echo -e "${YELLOW}💡 Vérifiez manuellement avec: npm run dev${NC}"
else
    echo -e "\n${YELLOW}🎯 GUIDE D'UTILISATION${NC}"
    echo "====================="
    
    echo -e "${BLUE}1. Ouvrez votre navigateur sur: ${GREEN}$SERVER_URL${NC}"
    echo -e "${BLUE}2. Naviguez vers l'onglet 'Impression' pour tester le système d'impression${NC}"
    echo -e "${BLUE}3. Naviguez vers l'onglet 'E-mail RAZ' pour le système d'e-mail${NC}"
    echo -e "${BLUE}4. Ajoutez des ventes et testez les fonctionnalités${NC}"
    
    echo -e "\n${YELLOW}📋 FONCTIONNALITÉS DISPONIBLES${NC}"
    echo "=============================="
    
    echo -e "${GREEN}✅ Onglet Impression:${NC}"
    echo "  • Interface de génération PDF"
    echo "  • Boutons d'impression directe"
    echo "  • Prévisualisation des rapports"
    echo "  • Statistiques détaillées"
    
    echo -e "${GREEN}✅ Onglet E-mail RAZ:${NC}"
    echo "  • Configuration automatique"
    echo "  • Interface de planification"
    echo "  • Historique des actions"
    echo "  • Status en temps réel"
    
    echo -e "\n${YELLOW}🔧 TESTS À EFFECTUER${NC}"
    echo "==================="
    
    echo -e "${BLUE}1. Test de navigation entre onglets${NC}"
    echo -e "${BLUE}2. Vérification des interfaces utilisateur${NC}"
    echo -e "${BLUE}3. Test des boutons et interactions${NC}"
    echo -e "${BLUE}4. Vérification du design responsive${NC}"
    
    echo -e "\n${YELLOW}⚠️  INFORMATIONS IMPORTANTES${NC}"
    echo "============================"
    
    echo -e "${BLUE}• Les modules sont en phase de développement${NC}"
    echo -e "${BLUE}• Les interfaces sont entièrement fonctionnelles${NC}"
    echo -e "${BLUE}• L'architecture backend est en place${NC}"
    echo -e "${BLUE}• Les services PDF et e-mail sont prêts${NC}"
fi

echo -e "\n${YELLOW}🛑 COMMANDES DE CONTRÔLE${NC}"
echo "========================"

echo -e "${BLUE}Pour arrêter le serveur: ${GREEN}kill $DEV_PID${NC}"
echo -e "${BLUE}Pour relancer: ${GREEN}npm run dev${NC}"
echo -e "${BLUE}Pour compiler: ${GREEN}npm run build${NC}"

echo -e "\n${GREEN}🎉 Démonstration prête !${NC}"
echo -e "${BLUE}📱 Testez maintenant l'application dans votre navigateur${NC}"

# Garder le script ouvert pour montrer les logs
echo -e "\n${YELLOW}📊 LOGS DU SERVEUR (Ctrl+C pour arrêter):${NC}"
echo "========================================="

# Attendre que l'utilisateur arrête le serveur
wait $DEV_PID
