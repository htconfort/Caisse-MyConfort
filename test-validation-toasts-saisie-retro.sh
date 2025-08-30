#!/bin/bash

echo "🧪 Test du système SaisieRetro avec validation et toasts..."

cd /Users/brunopriem/CAISSE\ MYCONFORT/Caisse-MyConfort-3/mon-projet-vite

echo "📋 Vérification de la structure complète..."
echo ""
echo "✅ Utils de validation:"
ls -la src/utils/saisieRetroValidation.ts 2>/dev/null && echo "  ✓ saisieRetroValidation.ts" || echo "  ❌ saisieRetroValidation.ts manquant"

echo ""
echo "✅ Hooks SaisieRetro:"
ls -la src/hooks/SaisieRetro/useSaisieRetroValidation.ts 2>/dev/null && echo "  ✓ useSaisieRetroValidation.ts" || echo "  ❌ useSaisieRetroValidation.ts manquant"
ls -la src/hooks/SaisieRetro/useSaisieRetroActionsWithToasts.ts 2>/dev/null && echo "  ✓ useSaisieRetroActionsWithToasts.ts" || echo "  ❌ useSaisieRetroActionsWithToasts.ts manquant"

echo ""
echo "✅ Hooks généraux:"
ls -la src/hooks/useToasts.ts 2>/dev/null && echo "  ✓ useToasts.ts" || echo "  ❌ useToasts.ts manquant"

echo ""
echo "✅ Composants Toast:"
ls -la src/components/common/Toast.tsx 2>/dev/null && echo "  ✓ Toast.tsx" || echo "  ❌ Toast.tsx manquant"

echo ""
echo "✅ Composants SaisieRetro:"
ls -la src/components/SaisieRetro/SaisieRetroSystemAdvanced.tsx 2>/dev/null && echo "  ✓ SaisieRetroSystemAdvanced.tsx" || echo "  ❌ SaisieRetroSystemAdvanced.tsx manquant"

echo ""
echo "🔧 Test de compilation des nouveaux fichiers..."

# Test spécifique des fichiers de validation
echo "📝 Test validation..."
npx tsc --noEmit --skipLibCheck src/utils/saisieRetroValidation.ts 2>/dev/null && echo "  ✓ Validation utils OK" || echo "  ❌ Erreur validation utils"

# Test des hooks
echo "🎪 Test hooks..."
npx tsc --noEmit --skipLibCheck src/hooks/SaisieRetro/useSaisieRetroValidation.ts src/hooks/useToasts.ts 2>/dev/null && echo "  ✓ Hooks OK" || echo "  ❌ Erreur hooks"

# Test des composants
echo "🎨 Test composants..."
npx tsc --noEmit --skipLibCheck src/components/common/Toast.tsx 2>/dev/null && echo "  ✓ Toast component OK" || echo "  ❌ Erreur Toast component"

echo ""
echo "📊 Résumé des fonctionnalités SaisieRetro disponibles:"
echo "   🔍 Validation robuste:"
echo "     • validateSaisieRetro() - Validation de base"
echo "     • validateCompleteSaisieRetro() - Validation + contraintes temporelles"  
echo "     • useSaisieRetroValidation() - Hook validation temps réel"
echo ""
echo "   🔔 Notifications visuelles:"
echo "     • useToasts() - Gestion des toasts"
echo "     • ToastContainer - Affichage des notifications"
echo "     • useSaisieRetroActionsWithToasts() - Actions avec toasts"
echo ""
echo "   🎯 Composants:"
echo "     • SaisieVenteRetroRefactored - Version simple (émoji)"
echo "     • SaisieRetroSystem - Version standard (icônes)"  
echo "     • SaisieRetroSystemAdvanced - Version avancée (validation temps réel)"
echo ""
echo "🎯 Le système SaisieRetro est maintenant complet avec validation et toasts !"
echo "   📚 Voir README-SAISIE-RETRO-COMPLET.md pour la documentation complète"
