#!/bin/bash

echo "🗑️ Test suppression 'Valeur totale' - $(date)"
echo "===========================================" 

# Vérifier si le serveur dev est en cours
if ! curl -s http://localhost:5178 > /dev/null; then
    echo "❌ Serveur Vite non accessible"
    exit 1
fi

echo "✅ Serveur accessible"
echo ""
echo "📊 Modifications apportées:"
echo "• Suppression de la carte 'Valeur totale'"
echo "• Grille passée de 4 à 3 colonnes (md:grid-cols-3)"
echo "• Suppression de l'import TrendingUp inutilisé"
echo "• Mise à jour des animations CSS (3 cartes au lieu de 4)"
echo ""
echo "🎯 Vérifications à effectuer:"
echo "1. Aller sur l'onglet Stock"
echo "2. Vérifier qu'il n'y a que 3 statistiques:"
echo "   ✅ Stock OK (89% - vert)"
echo "   ⚠️ Stock faible (12 - orange)"
echo "   📊 Références (142 - violet)"
echo "3. Vérifier que la grille s'adapte bien sur 3 colonnes"
echo "4. S'assurer que les animations fonctionnent toujours"
echo ""
echo "🌐 Ouverture du navigateur..."
open http://localhost:5178

echo ""
echo "✅ Test préparé ! Vérifiez que la carte 'Valeur totale' a bien été supprimée."
