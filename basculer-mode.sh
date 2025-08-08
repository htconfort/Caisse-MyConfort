#!/bin/bash

# 🎯 Basculement rapide entre modes de production

echo "🎯 BASCULEMENT MODE CAISSE MYCONFORT"
echo "===================================="
echo ""

echo "Choisissez votre mode :"
echo ""
echo "1) 🏭 MODE PRODUCTION (Données de démo uniquement)"
echo "2) 🧪 MODE DÉVELOPPEMENT (Avec N8N)"
echo "3) 🔍 DIAGNOSTIC SYSTÈME"
echo ""

read -p "Votre choix (1/2/3) : " choice

case $choice in
    1)
        echo ""
        echo "🏭 Activation du MODE PRODUCTION..."
        echo ""
        echo "📋 Instructions :"
        echo "1. Ouvrez http://localhost:5181"
        echo "2. Appuyez sur F12 (Console développeur)"
        echo "3. Tapez : localStorage.setItem('force-production-mode', 'true')"
        echo "4. Appuyez sur F5 (Recharger)"
        echo ""
        echo "✅ Résultat : Système 100% stable avec données de démo"
        ;;
    2)
        echo ""
        echo "🧪 Activation du MODE DÉVELOPPEMENT..."
        echo ""
        echo "📋 Instructions :"
        echo "1. Ouvrez http://localhost:5181"
        echo "2. Appuyez sur F12 (Console développeur)"
        echo "3. Tapez : localStorage.removeItem('force-production-mode')"
        echo "4. Appuyez sur F5 (Recharger)"
        echo ""
        echo "✅ Résultat : Connexion N8N + fallback données de démo"
        ;;
    3)
        echo ""
        echo "🔍 Lancement du diagnostic..."
        echo ""
        ./diagnostic-production.sh
        ;;
    *)
        echo ""
        echo "❌ Choix invalide. Utilisez 1, 2 ou 3."
        ;;
esac

echo ""
echo "🌐 Application disponible sur : http://localhost:5181"
echo "✨ Bonne utilisation de votre Caisse MyConfort !"
