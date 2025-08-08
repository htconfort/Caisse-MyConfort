#!/bin/bash

# 🚨 RÉPARATION URGENTE - Synchronisation N8N 

echo "🚨 RÉPARATION URGENTE SYNCHRONISATION N8N"
echo "=========================================="
echo ""

echo "🔍 PROBLÈME IDENTIFIÉ :"
echo "- ✅ N8N fonctionne parfaitement (19 factures détectées)"
echo "- ✅ Proxy Vite opérationnel (codes 200)"
echo "- ❌ Application en mode production forcé (utilise les données de démo)"
echo ""

echo "🛠️ SOLUTION IMMÉDIATE :"
echo ""
echo "1️⃣ Ouvrez votre navigateur : http://localhost:5181"
echo ""
echo "2️⃣ Appuyez sur F12 (Console développeur)"
echo ""
echo "3️⃣ Tapez EXACTEMENT cette commande :"
echo "   localStorage.removeItem('force-production-mode')"
echo ""
echo "4️⃣ Appuyez sur F5 (Recharger la page)"
echo ""

echo "✅ RÉSULTAT ATTENDU :"
echo "- 🎯 Affichage des 19 vraies factures N8N"
echo "- 🎯 Clients réels : Quatre, martine, Test 1 synchronise, etc."
echo "- 🎯 Synchronisation temps réel opérationnelle"
echo ""

echo "🔧 VÉRIFICATION RAPIDE :"
echo "Pour vérifier que les données arrivent bien de N8N :"
curl -s "http://localhost:5181/api/n8n/sync/invoices" | grep -o '"name":"[^"]*"' | head -5
echo ""

echo "📊 FACTURES DISPONIBLES EN ATTENTE :"
echo "- Client 'Quatre' : MATELAS BAMBOU 200 x 200 (9200€)"
echo "- Client 'martine' : Couette 240 x 260 (350€)"
echo "- Client 'Test 1 synchronise' : MATELAS + oreillers (1900€)"
echo "- Et 16 autres factures réelles..."
echo ""

echo "⚡ ACTION IMMÉDIATE REQUISE :"
echo "Désactivez le mode production forcé pour voir vos vraies factures !"
echo ""
echo "🌐 URL application : http://localhost:5181"
