#!/bin/bash

# Script de test d'intégration final avec Netlify Blobs
BASE_URL="https://caissemycomfort2025.netlify.app"
SECRET="MySuperSecretKey2025"

echo "🎯 TESTS D'INTÉGRATION FINALE - NETLIFY BLOBS"
echo "=============================================="

echo ""
echo "1️⃣ Test Ping (connectivité):"
PING_RESPONSE=$(curl -sS "${BASE_URL}/.netlify/functions/ping")
echo "   Réponse: ${PING_RESPONSE}"
if echo "${PING_RESPONSE}" | grep -q '"ok":true'; then
  echo "   ✅ Ping OK"
else
  echo "   ❌ Ping FAILED"
fi

echo ""
echo "2️⃣ CA Instant initial (avant facture):"
CA_INITIAL=$(curl -sS "${BASE_URL}/.netlify/functions/ca-instant?vendorId=sylvie")
echo "   Réponse: ${CA_INITIAL}"
if echo "${CA_INITIAL}" | grep -q '"ok":true'; then
  echo "   ✅ CA Instant OK"
else
  echo "   ❌ CA Instant FAILED"
fi

echo ""
echo "3️⃣ Envoi d'une facture de test (280€):"
INVOICE_DATA='{
  "numero_facture":"F-SYL-TEST-BLOBS-001",
  "date_facture":"2025-09-24",
  "nom_client":"Client Test Blobs",
  "payment_method":"card",
  "vendeuse":"Sylvie",
  "vendorId":"sylvie",
  "montant_ttc":280,
  "produits":[{"nom":"Matelas Test","quantite":1,"prix_ttc":280,"remise":0}]
}'
INVOICE_RESPONSE=$(curl -sS -X POST "${BASE_URL}/.netlify/functions/caisse-facture" \
  -H "Content-Type: application/json" \
  -H "X-Secret: ${SECRET}" \
  -d "${INVOICE_DATA}")
echo "   Réponse: ${INVOICE_RESPONSE}"
if echo "${INVOICE_RESPONSE}" | grep -q '"ok":true' && echo "${INVOICE_RESPONSE}" | grep -q '"enqueued":1'; then
  echo "   ✅ Facture envoyée OK"
else
  echo "   ❌ Facture envoyée FAILED"
fi

echo ""
echo "4️⃣ CA Instant après facture (doit être 280€):"
sleep 2  # Attendre la propagation
CA_AFTER=$(curl -sS "${BASE_URL}/.netlify/functions/ca-instant?vendorId=sylvie")
echo "   Réponse: ${CA_AFTER}"
if echo "${CA_AFTER}" | grep -q '"ok":true' && echo "${CA_AFTER}" | grep -q '"ca_instant":280'; then
  echo "   ✅ CA Instant après facture OK (280€)"
else
  echo "   ❌ CA Instant après facture FAILED"
fi

echo ""
echo "5️⃣ Test avec endpoints /api/ (plus propres):"
API_PING=$(curl -sS "${BASE_URL}/api/ping")
echo "   Réponse /api/ping: ${API_PING}"
if echo "${API_PING}" | grep -q '"ok":true'; then
  echo "   ✅ Endpoints /api/ OK"
else
  echo "   ❌ Endpoints /api/ FAILED"
fi

echo ""
echo "6️⃣ Test idempotence (même facture):"
IDEMPOTENCE_RESPONSE=$(curl -sS -X POST "${BASE_URL}/.netlify/functions/caisse-facture" \
  -H "Content-Type: application/json" \
  -H "X-Secret: ${SECRET}" \
  -d "${INVOICE_DATA}")
echo "   Réponse idempotence: ${IDEMPOTENCE_RESPONSE}"
if echo "${IDEMPOTENCE_RESPONSE}" | grep -q '"message":"Invoice updated"'; then
  echo "   ✅ Idempotence OK"
else
  echo "   ❌ Idempotence FAILED"
fi

echo ""
echo "7️⃣ CA Instant final (doit toujours être 280€):"
CA_FINAL=$(curl -sS "${BASE_URL}/.netlify/functions/ca-instant?vendorId=sylvie")
echo "   Réponse: ${CA_FINAL}"
if echo "${CA_FINAL}" | grep -q '"ok":true' && echo "${CA_FINAL}" | grep -q '"ca_instant":280'; then
  echo "   ✅ CA Instant final OK (280€ inchangé)"
else
  echo "   ❌ CA Instant final FAILED"
fi

echo ""
echo "🎯 TESTS TERMINÉS !"
echo "Si tous les tests sont ✅, l'intégration Netlify Blobs fonctionne parfaitement !"
