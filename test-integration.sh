#!/bin/bash

# Script de test d'intégration facturation-caisse
# À utiliser une fois que les fonctions Netlify sont accessibles

BASE_URL="https://caissemycomfort2025.netlify.app/.netlify/functions"
SECRET="MySuperSecretKey2025"

echo "🎯 TESTS D'INTÉGRATION FACTURATION-CAISSE"
echo "=========================================="

echo ""
echo "1️⃣ Test Ping (vérification connectivité):"
curl -sS "$BASE_URL/ping" | jq '.' 2>/dev/null || curl -sS "$BASE_URL/ping"

echo ""
echo "2️⃣ CA Instant initial (avant facture):"
curl -sS "$BASE_URL/ca-instant?vendorId=sylvie" | jq '.' 2>/dev/null || curl -sS "$BASE_URL/ca-instant?vendorId=sylvie"

echo ""
echo "3️⃣ Envoi d'une facture de test:"
FACTURE_RESPONSE=$(curl -sS -X POST "$BASE_URL/caisse-facture" \
  -H "Content-Type: application/json" \
  -H "X-Secret: $SECRET" \
  -d '{
    "numero_facture": "F-SYL-TEST-001",
    "date_facture": "2025-09-24",
    "nom_client": "Client Test",
    "vendeuse": "Sylvie",
    "vendorId": "sylvie",
    "montant_ttc": 280,
    "produits": [
      {
        "nom": "Matelas 140x190",
        "quantite": 1,
        "prix_ttc": 280,
        "remise": 0
      }
    ]
  }')

echo "$FACTURE_RESPONSE" | jq '.' 2>/dev/null || echo "$FACTURE_RESPONSE"

echo ""
echo "4️⃣ CA Instant après facture (doit être 280€):"
curl -sS "$BASE_URL/ca-instant?vendorId=sylvie" | jq '.' 2>/dev/null || curl -sS "$BASE_URL/ca-instant?vendorId=sylvie"

echo ""
echo "5️⃣ Envoi d'une deuxième facture:"
FACTURE_RESPONSE2=$(curl -sS -X POST "$BASE_URL/caisse-facture" \
  -H "Content-Type: application/json" \
  -H "X-Secret: $SECRET" \
  -d '{
    "numero_facture": "F-SYL-TEST-002",
    "date_facture": "2025-09-24",
    "nom_client": "Client Test 2",
    "vendeuse": "Sylvie",
    "vendorId": "sylvie",
    "montant_ttc": 150,
    "produits": [
      {
        "nom": "Oreiller",
        "quantite": 2,
        "prix_ttc": 75,
        "remise": 0
      }
    ]
  }')

echo "$FACTURE_RESPONSE2" | jq '.' 2>/dev/null || echo "$FACTURE_RESPONSE2"

echo ""
echo "6️⃣ CA Instant final (doit être 430€ = 280 + 150):"
curl -sS "$BASE_URL/ca-instant?vendorId=sylvie" | jq '.' 2>/dev/null || curl -sS "$BASE_URL/ca-instant?vendorId=sylvie"

echo ""
echo "7️⃣ Test avec une autre vendeuse (Lucia):"
curl -sS -X POST "$BASE_URL/caisse-facture" \
  -H "Content-Type: application/json" \
  -H "X-Secret: $SECRET" \
  -d '{
    "numero_facture": "F-LUC-TEST-001",
    "date_facture": "2025-09-24",
    "nom_client": "Client Lucia",
    "vendeuse": "Lucia",
    "vendorId": "lucia",
    "montant_ttc": 200
  }' | jq '.' 2>/dev/null || curl -sS -X POST "$BASE_URL/caisse-facture" \
  -H "Content-Type: application/json" \
  -H "X-Secret: $SECRET" \
  -d '{
    "numero_facture": "F-LUC-TEST-001",
    "date_facture": "2025-09-24",
    "nom_client": "Client Lucia",
    "vendeuse": "Lucia",
    "vendorId": "lucia",
    "montant_ttc": 200
  }'

echo ""
echo "8️⃣ CA Instant Lucia (doit être 200€):"
curl -sS "$BASE_URL/ca-instant?vendorId=lucia" | jq '.' 2>/dev/null || curl -sS "$BASE_URL/ca-instant?vendorId=lucia"

echo ""
echo "9️⃣ CA Instant Sylvie (doit rester 430€):"
curl -sS "$BASE_URL/ca-instant?vendorId=sylvie" | jq '.' 2>/dev/null || curl -sS "$BASE_URL/ca-instant?vendorId=sylvie"

echo ""
echo "✅ Tests terminés !"
echo "Si tout fonctionne, vous devriez voir :"
echo "- Sylvie : 430€ (280 + 150)"
echo "- Lucia : 200€"
echo "- Les factures sont bien reçues et traitées"
