#!/bin/bash

echo "🔍 DIAGNOSTIC : Synchronisation N8N et Détails de Règlement"
echo "========================================================="

cd "/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-1/mon-projet-vite"

echo ""
echo "1️⃣ Test direct N8N :"
echo "--------------------"
echo "📡 Test de l'API N8N directe..."
curl -s "https://n8n.myconfort.fr/webhook/sync/invoices" \
  -H "Content-Type: application/json" | \
  jq -r '.invoices[] | select(.paymentMethod | contains("chèque") or contains("Chèque")) | .invoiceNumber + " : " + .paymentMethod' 2>/dev/null || \
  echo "❌ jq non disponible, utilisez python3 pour parser"

echo ""
echo "2️⃣ Test via proxy Vite :"
echo "-------------------------"
echo "🔗 Test via le proxy Vite (http://localhost:5176/api/n8n/sync/invoices)..."

# Test avec timeout
timeout 10s curl -s "http://localhost:5176/api/n8n/sync/invoices" \
  -H "Content-Type: application/json" | \
  python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(f'✅ Proxy fonctionne - {data.get(\"count\", 0)} factures')
    for invoice in data.get('invoices', [])[:3]:
        payment = invoice.get('paymentMethod', 'Aucun')
        print(f'   {invoice.get(\"invoiceNumber\", \"?\")}: {payment[:60]}...')
except Exception as e:
    print(f'❌ Erreur proxy: {e}')
" 2>/dev/null || echo "❌ Proxy Vite non accessible"

echo ""
echo "3️⃣ Vérification des logs de l'application :"
echo "--------------------------------------------"
echo "🔍 Derniers logs de Vite (chercher les messages de SyncService)..."

# Simuler un appel pour générer des logs
echo ""
echo "4️⃣ Test de transformation des données :"
echo "----------------------------------------"
echo "📋 Exemple de données N8N transformées..."

cat << 'EOF' > /tmp/test_payment.py
import json

# Exemple de données N8N réelles
sample_data = {
    "invoiceNumber": "2025-002",
    "paymentMethod": "Chèques à venir - 9 chèques à venir de 133.89€ chacun",
    "deposit": 235,
    "totalTTC": 1440,
    "status": "to_deliver"
}

def extract_payment_details(item):
    payment_method_text = item.get('paymentMethod', '')
    total_amount = float(item.get('totalTTC', 0))
    deposit = float(item.get('deposit', 0))
    remaining = total_amount - deposit
    
    print(f"📄 Facture: {item.get('invoiceNumber')}")
    print(f"💰 Total: {total_amount}€")
    print(f"💵 Acompte: {deposit}€")
    print(f"💳 Restant: {remaining}€")
    print(f"📝 Règlement: {payment_method_text}")
    
    # Analyser les chèques
    if 'chèque' in payment_method_text.lower():
        import re
        cheques_match = re.search(r'(\d+)\s*chèques?\s*à?\s*venir', payment_method_text, re.I)
        amount_match = re.search(r'de\s*([\d,]+\.?\d*)\s*€', payment_method_text, re.I)
        
        if cheques_match and amount_match:
            nb_cheques = int(cheques_match.group(1))
            montant = float(amount_match.group(1).replace(',', '.'))
            print(f"✅ Détection: {nb_cheques} chèques de {montant}€")
            return {
                'method': 'check',
                'totalChecks': nb_cheques,
                'checkAmount': montant,
                'characteristics': f'{nb_cheques} chèques de {montant}€ chacun'
            }
    
    return None

result = extract_payment_details(sample_data)
if result:
    print(f"🎯 Résultat: {json.dumps(result, indent=2)}")
else:
    print("❌ Aucun détail de règlement extrait")
EOF

python3 /tmp/test_payment.py
rm /tmp/test_payment.py

echo ""
echo "5️⃣ Instructions de test :"
echo "-------------------------"
echo "🌐 Ouvrez http://localhost:5176 dans votre navigateur"
echo "🔧 Ouvrez la console (F12) pour voir les logs"
echo "📋 Allez dans l'onglet 'Factures'"
echo "👀 Cherchez les messages qui commencent par:"
echo "   - '🔧 SyncService mode: DÉVELOPPEMENT'"
echo "   - '🔗 Récupération des factures depuis N8N'"
echo "   - '💳 Analyse du règlement:'"
echo "   - '✅ N8N connecté, X factures reçues'"
echo ""
echo "💡 Si vous ne voyez pas les vraies factures:"
echo "   1. Rechargez la page (Ctrl+R ou Cmd+R)"
echo "   2. Vérifiez la console pour les erreurs"
echo "   3. Vérifiez que le serveur Vite tourne sur le bon port"
echo ""
echo "✨ Attendu: Factures avec vraies données N8N et détails de règlement"
