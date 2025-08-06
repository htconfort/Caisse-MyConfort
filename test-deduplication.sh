#!/bin/bash

echo "🧪 Test de déduplication des factures"
echo "====================================="

cd "/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-1/mon-projet-vite"

echo ""
echo "📋 Analyse des données N8N brutes..."

# Compter les entrées pour chaque numéro de facture
curl -s "http://localhost:5176/api/n8n/sync/invoices" | jq -r '
.invoices | 
group_by(.invoiceNumber) | 
map("Facture " + .[0].invoiceNumber + ": " + (length | tostring) + " entrées") | 
.[]'

echo ""
echo "🔍 Détail de la facture 2025-002 (celle visible dans la capture):"

curl -s "http://localhost:5176/api/n8n/sync/invoices" | jq -r '
.invoices[] | 
select(.invoiceNumber == "2025-002") | 
"Entrée avec " + (.products | length | tostring) + " produits:"
as $header |
.products[] | 
"  - " + .name + " (qté: " + (.quantity | tostring) + ")"'

echo ""
echo "✅ Après la correction dans transformInvoicesData:"
echo "   La fonction doit fusionner ces entrées pour n'avoir qu'une seule facture"
echo "   avec tous les produits uniques (sans doublons)."
echo ""
echo "🔄 Rechargez l'application pour voir l'effet de la correction !"
