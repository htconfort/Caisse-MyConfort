#!/bin/bash

# Script de test d'intégration facturation-caisse
# À utiliser une fois que les fonctions Netlify sont accessibles

BASE_URL="https://caissemycomfort2025.netlify.app/.netlify/functions"
SECRET="MySuperSecretKey2025"

echo "🎯 TESTS D'INTÉGRATION FACTURATION-CAISSE"
echo "=========================================="

echo ""
echo "1️⃣ Test Ping (vérification connectivité):"
curl -sS "$BASE_URL/ping"

echo ""
echo "2️⃣ CA Instant initial (avant facture):"
curl -sS "$BASE_URL/ca-instant?vendorId=sylvie"

echo ""
echo "3️⃣ Envoi d'une facture de test:"
curl -sS -X POST "$BASE_URL/caisse-facture" \
  -H "Content-Type: application/json" \
  -H "X-Secret: $SECRET" \
  -d '{"numero_facture":"F-SYL-TEST-001","date_facture":"2025-09-24","nom_client":"Client Test","vendeuse":"Sylvie","vendorId":"sylvie","montant_ttc":280,"produits":[{"nom":"Matelas 140x190","quantite":1,"prix_ttc":280,"remise":0}]}'

echo ""
echo "4️⃣ CA Instant après facture (doit être 280€):"
curl -sS "$BASE_URL/ca-instant?vendorId=sylvie"

echo ""
echo "✅ Tests terminés !"
