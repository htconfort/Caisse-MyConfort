#!/bin/bash

# Script de test rapide pour le webhook N8N
# À utiliser après avoir cliqué sur "Test workflow" dans N8N

echo "🔍 Test du webhook N8N pour les factures..."
echo "URL: https://n8n.srv765811.hstgr.cloud/webhook-test/sync/invoices"
echo ""

# Test GET pour récupérer les factures
echo "📥 Test GET /sync/invoices:"
curl -X GET \
  -H "Content-Type: application/json" \
  "https://n8n.srv765811.hstgr.cloud/webhook-test/sync/invoices" \
  -w "\n\nStatus Code: %{http_code}\n" \
  -s

echo ""
echo "---"
echo ""

# Test POST pour mettre à jour le statut d'une facture
echo "📤 Test POST /sync/status-update:"
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "test-123",
    "status": "paid",
    "updatedBy": "caisse-test",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }' \
  "https://n8n.srv765811.hstgr.cloud/webhook-test/sync/status-update" \
  -w "\n\nStatus Code: %{http_code}\n" \
  -s

echo ""
echo "✅ Tests terminés."
echo ""
echo "💡 Si vous obtenez des erreurs 404:"
echo "   1. Connectez-vous à N8N: https://n8n.srv765811.hstgr.cloud"
echo "   2. Ouvrez votre workflow de facturation"
echo "   3. Cliquez sur 'Test workflow'"
echo "   4. Relancez ce script immédiatement"
