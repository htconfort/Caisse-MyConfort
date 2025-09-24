#!/bin/bash

echo "🔍 DIAGNOSTIC COMPLET NETLIFY FUNCTIONS"
echo "======================================="

echo ""
echo "📁 STRUCTURE DU PROJET:"
echo "Racine du projet: $(pwd)"
echo ""
echo "📄 Fichier netlify.toml:"
if [ -f "netlify.toml" ]; then
    echo "✅ netlify.toml trouvé à la racine"
    echo "Contenu:"
    cat netlify.toml
else
    echo "❌ netlify.toml NON TROUVÉ à la racine"
fi

echo ""
echo "📁 Dossier des fonctions:"
if [ -d "mon-projet-vite/netlify/functions" ]; then
    echo "✅ Dossier functions trouvé"
    echo "Contenu:"
    ls -la mon-projet-vite/netlify/functions/
else
    echo "❌ Dossier functions NON TROUVÉ"
fi

echo ""
echo "📦 Package.json:"
if [ -f "mon-projet-vite/package.json" ]; then
    echo "✅ package.json trouvé"
    echo "Type de module:"
    grep '"type"' mon-projet-vite/package.json || echo "Pas de type défini"
    echo "Dépendances Netlify:"
    grep -i "netlify" mon-projet-vite/package.json || echo "Pas de dépendances Netlify"
else
    echo "❌ package.json NON TROUVÉ"
fi

echo ""
echo "🧪 TEST SYNTAXE DES FONCTIONS:"
for func in mon-projet-vite/netlify/functions/*.js; do
    if [ -f "$func" ]; then
        echo "Test syntaxe $(basename $func):"
        if node -c "$func" 2>/dev/null; then
            echo "✅ $(basename $func) - Syntaxe OK"
        else
            echo "❌ $(basename $func) - Erreur de syntaxe"
        fi
    fi
done

echo ""
echo "🌐 TEST CONNECTIVITÉ NETLIFY:"
echo "Test ping direct:"
curl -sS -w "Status: %{http_code}\n" "https://caissemycomfort2025.netlify.app/.netlify/functions/ping" || echo "❌ Erreur de connexion"

echo ""
echo "📊 RÉSUMÉ:"
echo "- Structure: $(if [ -f "netlify.toml" ] && [ -d "mon-projet-vite/netlify/functions" ]; then echo "✅ OK"; else echo "❌ PROBLÈME"; fi)"
echo "- Fonctions: $(ls mon-projet-vite/netlify/functions/*.js 2>/dev/null | wc -l) fichiers JS trouvés"
echo "- Connectivité: $(if curl -sS "https://caissemycomfort2025.netlify.app/.netlify/functions/ping" | grep -q "pong"; then echo "✅ OK"; else echo "❌ 404"; fi)"

echo ""
echo "🎯 RECOMMANDATIONS:"
if [ ! -f "netlify.toml" ]; then
    echo "❌ Créer netlify.toml à la racine"
fi
if [ ! -d "mon-projet-vite/netlify/functions" ]; then
    echo "❌ Créer le dossier mon-projet-vite/netlify/functions/"
fi
if ! curl -sS "https://caissemycomfort2025.netlify.app/.netlify/functions/ping" | grep -q "pong"; then
    echo "❌ Problème de déploiement Netlify - vérifier les logs de build"
fi