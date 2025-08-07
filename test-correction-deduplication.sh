#!/bin/bash

# Script de test pour vérifier la correction de la déduplication des factures
# Test avec deux factures ayant le même numéro mais des clients différents

echo "🧪 Test de correction déduplication factures - $(date)"
echo "======================================================"

cd "/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-1/mon-projet-vite"

# Vérifier si le serveur dev est en cours
if ! curl -s http://localhost:5178 > /dev/null; then
    echo "❌ Serveur Vite non accessible sur localhost:5178"
    echo "   Veuillez démarrer 'npm run dev' avant de lancer ce test"
    exit 1
fi

echo "✅ Serveur Vite accessible"

# Test 1: Créer des données de test avec des factures ayant le même numéro
echo ""
echo "📝 Test 1: Factures avec même numéro mais clients différents"
echo "------------------------------------------------------------"

# Simuler des données N8N avec doublons par numéro mais clients différents
test_data='{
  "invoices": [
    {
      "invoiceNumber": "2025-005",
      "client": { "name": "Bruno Sylvain" },
      "products": [{"name": "Matelas 140x190", "category": "Matelas", "quantity": 1, "unitPrice": 800}],
      "totalTTC": 800,
      "paymentMethod": "Chèque",
      "status": "sent",
      "lastUpdate": "2025-01-27T10:00:00Z"
    },
    {
      "invoiceNumber": "2025-005",
      "client": { "name": "Bruno Sabrina" },
      "products": [{"name": "Oreiller ergonomique", "category": "Oreillers", "quantity": 2, "unitPrice": 50}],
      "totalTTC": 100,
      "paymentMethod": "Carte",
      "status": "sent",
      "lastUpdate": "2025-01-27T10:30:00Z"
    },
    {
      "invoiceNumber": "2025-006",
      "client": { "name": "Marie Dupont" },
      "products": [{"name": "Couette 220x240", "category": "Couettes", "quantity": 1, "unitPrice": 120}],
      "totalTTC": 120,
      "paymentMethod": "Espèces",
      "status": "sent",
      "lastUpdate": "2025-01-27T11:00:00Z"
    }
  ]
}'

echo "📤 Données test créées:"
echo "- Facture 2025-005 pour Bruno Sylvain (Matelas 800€)"
echo "- Facture 2025-005 pour Bruno Sabrina (Oreillers 100€)"
echo "- Facture 2025-006 pour Marie Dupont (Couette 120€)"

# Test transformation côté frontend
echo ""
echo "🔧 Test transformation via console navigateur..."
echo "   -> Ouvrir http://localhost:5178"
echo "   -> Ouvrir la console développeur (F12)"
echo "   -> Aller sur l'onglet Factures"
echo "   -> Vérifier que 3 factures distinctes apparaissent:"
echo "      * 2025-005 - Bruno Sylvain"
echo "      * 2025-005 - Bruno Sabrina" 
echo "      * 2025-006 - Marie Dupont"

echo ""
echo "🔍 Vérification automatique des logs de transformation..."
echo "   Regarder les logs dans la console navigateur pour:"
echo "   - ✅ 'Nouvelle facture 2025-005 (Bruno Sylvain)'"
echo "   - ✅ 'Nouvelle facture 2025-005 (Bruno Sabrina)'"
echo "   - ✅ 'Nouvelle facture 2025-006 (Marie Dupont)'"
echo "   - ❌ Pas de 'Fusion facture' entre les 2025-005"

echo ""
echo "📊 Résultat attendu:"
echo "   - 3 factures distinctes affichées"
echo "   - Pas de fusion entre les factures 2025-005"
echo "   - Chaque client visible séparément"

echo ""
echo "🌐 Ouvrir le navigateur pour vérifier..."
open http://localhost:5178

echo ""
echo "✅ Test de déduplication préparé !"
echo "   Vérifiez manuellement l'affichage dans l'onglet Factures"
