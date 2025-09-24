#!/bin/bash

# Test des endpoints CA Instant - Caisse MyConfort
# Usage: ./test-caisse-endpoints.sh [URL_BASE]

set -e

URL_BASE=${1:-"https://caissemycomfort2025.netlify.app"}
SECRET="MySuperSecretKey2025"

echo "🧪 Test des endpoints CA Instant"
echo "Base URL: $URL_BASE"
echo "Secret: $SECRET"
echo "================================="

# Test 1: Ping (vérifier que les fonctions sont déployées)
echo -n "Test 1 - Ping fonction: "
RESPONSE=$(curl -sS "$URL_BASE/.netlify/functions/ping")
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ OK"
    echo "   Réponse: $RESPONSE"
else
    echo "❌ ÉCHEC"
    echo "   Réponse: $RESPONSE"
fi

# Test 2: GET CA instant (tous les vendeurs)
echo -e "\nTest 2 - GET CA instant (tous): "
RESPONSE=$(curl -sS "$URL_BASE/api/caisse/ca")
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ OK"
    echo "   Réponse: $RESPONSE"
else
    echo "❌ ÉCHEC"
    echo "   Réponse: $RESPONSE"
fi

# Test 3: GET CA instant (vendeuse spécifique)
echo -e "\nTest 3 - GET CA instant (Sylvie): "
RESPONSE=$(curl -sS "$URL_BASE/api/caisse/ca?vendorId=sylvie")
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ OK"
    echo "   Réponse: $RESPONSE"
else
    echo "❌ ÉCHEC"
    echo "   Réponse: $RESPONSE"
fi

# Test 4: POST facture (test avec montant)
echo -e "\nTest 4 - POST facture test: "
PAYLOAD='{
  "numero_facture": "F-TEST-001",
  "vendeuse": "sylvie",
  "vendorId": "sylvie",
  "montant_ttc": 150.75,
  "date": "2025-01-24"
}'

RESPONSE=$(curl -sS -X POST "$URL_BASE/api/caisse/facture" \
  -H "Content-Type: application/json" \
  -H "X-Secret: $SECRET" \
  -d "$PAYLOAD")

if echo "$RESPONSE" | grep -q '"caUpdated":true'; then
    echo "✅ OK - Facture enregistrée"
    echo "   Réponse: $RESPONSE"
else
    echo "❌ ÉCHEC"
    echo "   Réponse: $RESPONSE"
fi

# Test 5: Vérifier que le CA a été mis à jour
echo -e "\nTest 5 - Vérifier CA mis à jour: "
RESPONSE=$(curl -sS "$URL_BASE/api/caisse/ca?vendorId=sylvie")
if echo "$RESPONSE" | grep -q '"total":150.75'; then
    echo "✅ OK - CA mis à jour à 150.75"
    echo "   Réponse: $RESPONSE"
else
    echo "❌ ÉCHEC - CA non mis à jour"
    echo "   Réponse: $RESPONSE"
fi

echo -e "\n🎯 Tests terminés !"
echo "Si tous les tests sont ✅, le système CA Instant est opérationnel."
