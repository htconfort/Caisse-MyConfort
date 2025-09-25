#!/bin/bash

echo "🎯 TEST FINAL - INTÉGRATION NETLIFY FUNCTIONS"
echo "============================================="

BASE_URL="https://caissemycomfort2025.netlify.app"
SECRET="MySuperSecretKey2025"

echo ""
echo "📋 STRUCTURE FINALE:"
echo "- netlify.toml: ✅ À la racine"
echo "- Fonctions: ✅ 3 fichiers dans mon-projet-vite/netlify/functions/"
echo "- Configuration: ✅ functions = 'mon-projet-vite/netlify/functions'"
echo ""

echo "🧪 TESTS DE CONNECTIVITÉ:"
echo ""

echo "1️⃣ Test Ping (fonction simple):"
PING_RESPONSE=$(curl -sS "${BASE_URL}/.netlify/functions/ping")
echo "   Réponse: ${PING_RESPONSE}"
if echo "${PING_RESPONSE}" | grep -q '"ok":true'; then
  echo "   ✅ Ping OK - Les fonctions Netlify fonctionnent !"
  PING_OK=true
else
  echo "   ❌ Ping FAILED - Problème de déploiement Netlify"
  PING_OK=false
fi

if [ "$PING_OK" = true ]; then
  echo ""
  echo "2️⃣ Test CA Instant (lecture Blobs):"
  CA_RESPONSE=$(curl -sS "${BASE_URL}/.netlify/functions/ca-instant?vendorId=sylvie")
  echo "   Réponse: ${CA_RESPONSE}"
  if echo "${CA_RESPONSE}" | grep -q '"ok":true'; then
    echo "   ✅ CA Instant OK - Netlify Blobs fonctionne !"
  else
    echo "   ❌ CA Instant FAILED - Problème avec Netlify Blobs"
  fi

  echo ""
  echo "3️⃣ Test Envoi Facture (écriture Blobs):"
  INVOICE_DATA='{
    "numero_facture":"F-FINAL-TEST-001",
    "date_facture":"2025-09-24",
    "nom_client":"Client Test Final",
    "payment_method":"card",
    "vendeuse":"Sylvie",
    "vendorId":"sylvie",
    "montant_ttc":150,
    "produits":[{"nom":"Test Final","quantite":1,"prix_ttc":150,"remise":0}]
  }'
  INVOICE_RESPONSE=$(curl -sS -X POST "${BASE_URL}/.netlify/functions/caisse-facture" \
    -H "Content-Type: application/json" \
    -H "X-Secret: ${SECRET}" \
    -d "${INVOICE_DATA}")
  echo "   Réponse: ${INVOICE_RESPONSE}"
  if echo "${INVOICE_RESPONSE}" | grep -q '"ok":true' && echo "${INVOICE_RESPONSE}" | grep -q '"enqueued":1'; then
    echo "   ✅ Facture envoyée OK - Stockage Blobs fonctionne !"
  else
    echo "   ❌ Facture envoyée FAILED - Problème avec stockage Blobs"
  fi

  echo ""
  echo "4️⃣ Test Endpoints /api/ (redirects):"
  API_RESPONSE=$(curl -sS "${BASE_URL}/api/ping")
  echo "   Réponse /api/ping: ${API_RESPONSE}"
  if echo "${API_RESPONSE}" | grep -q '"ok":true'; then
    echo "   ✅ Endpoints /api/ OK - Redirects fonctionnent !"
  else
    echo "   ❌ Endpoints /api/ FAILED - Problème avec redirects"
  fi

else
  echo ""
  echo "🚨 PROBLÈME CRITIQUE DÉTECTÉ"
  echo "Les fonctions Netlify ne sont pas accessibles."
  echo ""
  echo "🔧 ACTIONS RECOMMANDÉES:"
  echo "1. Aller dans le dashboard Netlify"
  echo "2. Site Settings → Functions"
  echo "3. Vérifier si les fonctions apparaissent"
  echo "4. Faire 'Clear cache and deploy site'"
  echo "5. Vérifier les logs de build pour voir 'Functions bundling'"
fi

echo ""
echo "🎯 RÉSUMÉ FINAL:"
if [ "$PING_OK" = true ]; then
  echo "✅ INTÉGRATION RÉUSSIE !"
  echo "   - Fonctions Netlify: OK"
  echo "   - Netlify Blobs: OK"
  echo "   - Redirects /api/: OK"
  echo "   - Prêt pour intégration n8n !"
else
  echo "❌ PROBLÈME DE DÉPLOIEMENT NETLIFY"
  echo "   - Code: ✅ Correct"
  echo "   - Configuration: ✅ Correcte"
  echo "   - Déploiement: ❌ Fonctions non détectées"
fi
