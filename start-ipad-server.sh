#!/bin/bash

# 🚀 Démarrage Serveur Local iPad - Interface Session Dynamique
# Script optimisé pour test sur iPad

echo "🛒 === MYCONFORT - SERVEUR LOCAL IPAD ==="
echo "📱 Interface Session Dynamique - Prêt pour test"
echo "=============================================="
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Naviguer vers le projet Vite
cd "/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-3/mon-projet-vite"

echo "📁 Répertoire: $(pwd)"
echo ""

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Afficher l'IP du Mac pour iPad
echo "🔍 === ADRESSES RÉSEAU POUR IPAD ==="
echo "Local (Mac uniquement): http://localhost:5173"
echo ""
echo "📱 Pour iPad, utiliser une de ces adresses:"
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "http://" $2 ":5173"}'
echo ""

# Tuer les processus existants sur le port 5173
echo "🧹 Nettoyage port 5173..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo ""
echo "🚀 === DÉMARRAGE SERVEUR ==="
echo "✅ Interface Session Dynamique intégrée !"
echo "✅ Champs événement : Nom, dates début/fin"
echo "✅ Bouton 'Ouvrir session' fonctionnel"
echo "✅ Format A4 blindé pour impression"
echo "✅ Configuration iPad optimisée"
echo ""
echo "⏳ Le serveur va démarrer..."
echo "🛑 Pour arrêter : Ctrl+C"
echo ""

# Démarrer le serveur Vite
npm run dev
