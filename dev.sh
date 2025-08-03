#!/bin/bash

# Script de développement pour Caisse MyConfort
# Optimisé pour GitHub Copilot et VSCode

echo "🛒 Caisse MyConfort - Script de développement"
echo "=============================================="

# Vérification de Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Vérification de npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Installation des dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Vérification de TypeScript
echo "🔍 Vérification TypeScript..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ TypeScript OK"
else
    echo "❌ Erreurs TypeScript détectées"
    echo "📝 Consultez les erreurs ci-dessus"
    exit 1
fi

# Options de lancement
echo ""
echo "Choisissez une option :"
echo "1) Démarrer l'application (développement)"
echo "2) Build production"
echo "3) Démarrer avec port spécifique"
echo "4) Ouvrir VSCode avec extensions recommandées"
echo "5) Tester l'application"

read -p "Votre choix (1-5): " choice

case $choice in
    1)
        echo "🚀 Démarrage de l'application..."
        npm start
        ;;
    2)
        echo "🏗️ Build production..."
        npm run build
        ;;
    3)
        read -p "Port (défaut 3001): " port
        port=${port:-3001}
        echo "🚀 Démarrage sur le port $port..."
        PORT=$port npm start
        ;;
    4)
        echo "💻 Ouverture de VSCode..."
        code . --install-extension GitHub.copilot --install-extension GitHub.copilot-chat --install-extension ms-vscode.vscode-typescript-tsg
        ;;
    5)
        echo "🧪 Tests de l'application..."
        echo "Vérification des types..."
        npx tsc --noEmit
        echo "Vérification de la syntaxe..."
        npm run build > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ Application prête pour production"
        else
            echo "❌ Erreurs détectées"
        fi
        ;;
    *)
        echo "❌ Option invalide"
        exit 1
        ;;
esac
