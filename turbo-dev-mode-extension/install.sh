#!/bin/bash

# 🚀 Script d'installation MyConfort Turbo Dev Mode Extension

echo "🚀 Installation de l'extension MyConfort Turbo Dev Mode..."

# Vérifier que vsce est installé
if ! command -v vsce &> /dev/null; then
    echo "📦 Installation de vsce (VS Code Extension CLI)..."
    npm install -g vsce
fi

# Aller dans le dossier de l'extension
cd "$(dirname "$0")"

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Compiler l'extension
echo "🔧 Compilation de l'extension..."
npm run compile

# Créer le package VSIX
echo "📦 Création du package VSIX..."
vsce package

# Installer l'extension localement
echo "🔧 Installation locale de l'extension..."
VSIX_FILE=$(ls *.vsix | head -n 1)
if [ -n "$VSIX_FILE" ]; then
    code --install-extension "$VSIX_FILE"
    echo "✅ Extension installée avec succès !"
    echo ""
    echo "🎯 Pour activer le Turbo Mode :"
    echo "   Cmd + Shift + P → 'MyConfort: Activer Turbo Mode'"
    echo ""
    echo "⚙️ Configuration automatique :"
    echo "   L'extension détectera automatiquement vos projets React/Vite"
    echo ""
else
    echo "❌ Erreur : Impossible de trouver le fichier VSIX"
fi

echo "🎉 Installation terminée !"
