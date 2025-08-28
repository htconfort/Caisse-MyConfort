#!/bin/bash
# Script de test rapide pour valider un déploiement Netlify

echo "🧪 TEST RAPIDE DÉPLOIEMENT NETLIFY"
echo "=================================="

# Demander l'URL du site
read -p "🌐 Entrez l'URL de votre site Netlify (ex: https://mon-site.netlify.app): " SITE_URL

if [ -z "$SITE_URL" ]; then
    echo "❌ URL requise. Arrêt du test."
    exit 1
fi

# Enlever le slash final si présent
SITE_URL=${SITE_URL%/}

echo ""
echo "🔍 Test de l'URL: $SITE_URL"
echo "=========================="

# Test 1: Page principale
echo -n "📄 Test page principale... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/")
if [ "$STATUS" = "200" ]; then
    echo "✅ OK ($STATUS)"
else
    echo "❌ ERREUR ($STATUS)"
fi

# Test 2: URL inexistante (doit rediriger vers 200)
echo -n "🔀 Test redirection SPA... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/test-inexistant")
if [ "$STATUS" = "200" ]; then
    echo "✅ OK ($STATUS)"
else
    echo "❌ ERREUR ($STATUS) - Redirections SPA non configurées"
fi

# Test 3: Fichier de diagnostic
echo -n "🧪 Test page diagnostic... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/test-deployment.html")
if [ "$STATUS" = "200" ]; then
    echo "✅ OK ($STATUS)"
    echo "   👀 Visitez: $SITE_URL/test-deployment.html"
else
    echo "⚠️  Non trouvé ($STATUS) - Normal si pas inclus dans le déploiement"
fi

# Test 4: Assets CSS
echo -n "🎨 Test assets CSS... "
CSS_URL=$(curl -s "$SITE_URL/" | grep -o '/assets/[^"]*\.css' | head -1)
if [ ! -z "$CSS_URL" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL$CSS_URL")
    if [ "$STATUS" = "200" ]; then
        echo "✅ OK ($STATUS)"
    else
        echo "❌ ERREUR ($STATUS)"
    fi
else
    echo "❓ Impossible de détecter l'URL CSS"
fi

# Test 5: Assets JS
echo -n "📜 Test assets JS... "
JS_URL=$(curl -s "$SITE_URL/" | grep -o '/assets/[^"]*\.js' | head -1)
if [ ! -z "$JS_URL" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL$JS_URL")
    if [ "$STATUS" = "200" ]; then
        echo "✅ OK ($STATUS)"
    else
        echo "❌ ERREUR ($STATUS)"
    fi
else
    echo "❓ Impossible de détecter l'URL JS"
fi

echo ""
echo "📊 RÉSUMÉ DU TEST"
echo "================="

# Compter les erreurs
ERRORS=$(echo "$STATUS" | grep -c "❌" || echo "0")

if [ "$ERRORS" = "0" ]; then
    echo "🎉 TOUS LES TESTS SONT PASSÉS !"
    echo "   Votre site MyConfort est correctement déployé."
    echo "   Accédez-y via: $SITE_URL"
else
    echo "⚠️  $ERRORS erreur(s) détectée(s)."
    echo "   Consultez le guide de dépannage: GUIDE-DEPANNAGE-404-COMPLET.md"
fi

echo ""
echo "🔗 Liens utiles:"
echo "   • Site principal: $SITE_URL"
echo "   • Test diagnostic: $SITE_URL/test-deployment.html"
echo "   • Support Netlify: https://answers.netlify.com"
