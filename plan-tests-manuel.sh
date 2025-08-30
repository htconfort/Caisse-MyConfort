#!/bin/bash
# Plan de tests rapide - Corrections FloatingCart + Impression A4

echo "🧪 TESTS MANUELS - iPad Safari + Chrome Desktop"
echo "================================================"

echo ""
echo "1. 📱 MINI-PANIER (iPad / Responsive DevTools)"
echo "   □ Minimiser depuis chaque onglet → la bulle reste visible"
echo "   □ Rotation portrait ↔ paysage → la bulle reste clampée"
echo "   □ Changer la taille de fenêtre (desktop) → toujours dans le viewport"
echo "   □ Zoom navigateur 50%/200% → position stable"
echo "   ✅ Test OK si: bulle toujours dans l'écran, aucun débordement"

echo ""
echo "2. 🖨️ IMPRESSION (iPad Safari + Chrome Desktop)"
echo "   □ Cliquer 'Imprimer' → aperçu non vide"
echo "   □ A4, marges 15mm, tableaux visibles"
echo "   □ .no-print masqué, .print-only visible"
echo "   □ Pas de page blanche sur Safari iOS"
echo "   ✅ Test OK si: PDF généré correctement formaté"

echo ""
echo "3. 🎯 RAZ - PANNEAU VISIBLE"
echo "   □ Onglet RAZ affiche le panneau et la bannière debug"
echo "   □ 'Saisie manuelle' crée un snapshot sur une date passée validée"
echo "   □ Toutes les sections s'affichent (ventes, factures, statistiques)"
echo "   □ Workflow impression: Visualiser → Imprimer → Email"
echo "   ✅ Test OK si: interface complète et fonctionnelle"

echo ""
echo "📋 CHECKLIST VALIDATION:"
echo "   □ FloatingCart: position clamp() + event listeners"
echo "   □ Impression: printHtmlA4Iframe() + fallback window.print()"
echo "   □ CSS: pas de dangerouslySetInnerHTML massif"
echo "   □ Types: aucune erreur TypeScript"
echo "   □ Console: pas d'erreurs runtime"

echo ""
echo "🎯 SCORE GLOBAL: ___/10"
echo "🚦 NIVEAU DE RISQUE: [FAIBLE] [MOYEN] [ÉLEVÉ]"

echo ""
echo "📝 NOTES DE TEST:"
echo "________________"
echo ""
echo ""
echo ""

echo "✅ VALIDATION FINALE:"
echo "□ Tous les tests passent"
echo "□ Application stable sur iPad Safari"
echo "□ Prêt pour production"
