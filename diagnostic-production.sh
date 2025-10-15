#!/bin/bash

# 🔍 Diagnostic du système de facturation MyConfort

echo "🔍 DIAGNOSTIC SYSTÈME CAISSE MYCONFORT"
echo "======================================"
echo ""

echo "📡 Vérification du serveur de développement..."
if lsof -Pi :5181 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Serveur actif sur http://localhost:5181"
else
    echo "❌ Serveur non actif - lancer 'npm run dev'"
fi
echo ""

echo "🌐 Test de connectivité N8N..."
if curl -s --max-time 5 "https://n8n.myconfort.fr/webhook/sync/invoices" >/dev/null ; then
    echo "✅ N8N accessible"
else
    echo "❌ N8N non accessible - mode démo recommandé"
fi
echo ""

echo "🏭 Test du proxy local..."
if curl -s --max-time 3 "http://localhost:5181/api/n8n/sync/invoices" >/dev/null ; then
    echo "✅ Proxy fonctionnel"
else
    echo "❌ Proxy non fonctionnel - vérifier la configuration"
fi
echo ""

echo "🧪 SOLUTIONS :"
echo ""
echo "🔧 Pour MODE PRODUCTION (sans N8N) :"
echo "   1. Ouvrir http://localhost:5181"
echo "   2. Console (F12) → localStorage.setItem('force-production-mode', 'true')"
echo "   3. Recharger (F5)"
echo ""
echo "🔧 Pour MODE DÉVELOPPEMENT (avec N8N) :"
echo "   1. Console (F12) → localStorage.removeItem('force-production-mode')"
echo "   2. Recharger (F5)"
echo ""
echo "🔧 Pour REDÉMARRER le serveur :"
echo "   1. cd mon-projet-vite"
echo "   2. npm run dev"
echo ""

echo "📊 État actuel des factures :"
echo "   Mode démo : 5 factures avec données complètes"
echo "   Mode N8N : dépend de la connectivité réseau"
echo ""

echo "✨ DIAGNOSTIC TERMINÉ ✨"
