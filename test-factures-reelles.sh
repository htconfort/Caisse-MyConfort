#!/bin/bash

echo "🔍 TEST SYNCHRONISATION FACTURES N8N"
echo "====================================="
echo ""

cd "/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-1/mon-projet-vite"

echo "📊 Vérification des données N8N disponibles :"
echo "---------------------------------------------"

# Test direct de l'API via le proxy Vite
echo "🔗 Test via proxy Vite : http://localhost:5173/api/n8n/sync/invoices"
curl -s "http://localhost:5173/api/n8n/sync/invoices" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    count = data.get('count', 0)
    print(f'✅ Connexion réussie - {count} factures disponibles')
    
    # Afficher quelques factures exemple
    invoices = data.get('invoices', [])
    unique_invoices = {}
    for inv in invoices:
        num = inv.get('invoiceNumber', 'Unknown')
        client = inv.get('client', {}).get('name', 'Unknown')
        if num not in unique_invoices:
            unique_invoices[num] = client
    
    print(f'📋 Factures uniques détectées :')
    for num, client in list(unique_invoices.items())[:5]:
        print(f'   • {num} - {client}')
    
    if len(unique_invoices) > 5:
        print(f'   ... et {len(unique_invoices) - 5} autres factures')
        
except Exception as e:
    print(f'❌ Erreur : {e}')
"

echo ""
echo "🌐 Instructions pour vérifier dans l'application :"
echo "--------------------------------------------------"
echo "1. 🖥️  Ouvrez http://localhost:5173 dans votre navigateur"
echo "2. 🔧 Ouvrez la Console Développeur (F12)"
echo "3. 📄 Cliquez sur l'onglet 'Factures'"
echo "4. 👀 Vérifiez les logs dans la console :"
echo ""
echo "   Recherchez ces messages :"
echo "   ✅ '🔧 SyncService mode: DÉVELOPPEMENT'"
echo "   ✅ '🌐 Base URL: /api/n8n'"
echo "   ✅ '🧪 Mode N8N: ACTIVÉ automatiquement'"
echo "   ✅ '🔗 Récupération des factures depuis N8N: /api/n8n/sync/invoices'"
echo "   ✅ '✅ N8N connecté, X factures reçues'"
echo ""
echo "🔄 Si les factures n'apparaissent pas :"
echo "--------------------------------------"
echo "1. Actualisez la page (Ctrl+R ou Cmd+R)"
echo "2. Cliquez plusieurs fois sur l'onglet Factures"
echo "3. Dans la console, tapez : syncService.getInvoices().then(console.log)"
echo ""
echo "✨ Vous devriez voir vos vraies factures N8N au lieu des données de démo !"
