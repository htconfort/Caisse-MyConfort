#!/bin/bash

# Script de test pour les paramètres des vendeuses
echo "🧪 Test Paramètres Vendeuses - $(date)"
echo "====================================="

cd "/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-1/mon-projet-vite"

# Vérifier si le serveur dev est en cours
if ! curl -s http://localhost:5178 > /dev/null; then
    echo "❌ Serveur Vite non accessible sur localhost:5178"
    echo "   Veuillez démarrer 'npm run dev' avant de lancer ce test"
    exit 1
fi

echo "✅ Serveur Vite accessible"

echo ""
echo "📝 Test des fonctionnalités Paramètres Vendeuses"
echo "-----------------------------------------------"

echo "🔧 Fonctionnalités à tester:"
echo "1. Navigation entre 'Sélection' et 'Paramètres'"
echo "2. Ajout d'une nouvelle vendeuse avec nom et couleur"
echo "3. Prévisualisation en temps réel"
echo "4. Modification du nom d'une vendeuse existante"
echo "5. Changement de couleur d'une vendeuse"
echo "6. Suppression d'une vendeuse"
echo "7. Palette de 16 couleurs prédéfinies"
echo "8. Contraste automatique du texte"

echo ""
echo "🎨 Couleurs disponibles:"
echo "Row 1: Vert MyConfort, Rouge/Orange, Vert foncé, Noir"
echo "       Bleu clair, Rose/Violet, Jaune poussin, Orange vif"
echo "Row 2: Bleu marine, Violet, Turquoise, Jaune/Orange"
echo "       Saumon, Vert olive, Violet foncé, Orange doré"

echo ""
echo "📋 Instructions de test:"
echo "1. Aller sur l'onglet 'Vendeuse'"
echo "2. Cliquer sur l'onglet 'Paramètres'"
echo "3. Ajouter une nouvelle vendeuse:"
echo "   - Saisir un nom"
echo "   - Choisir une couleur"
echo "   - Vérifier l'aperçu"
echo "   - Cliquer 'Ajouter'"
echo "4. Modifier une vendeuse existante:"
echo "   - Cliquer sur l'icône crayon"
echo "   - Modifier le nom"
echo "   - Valider avec ✓ ou annuler avec ✗"
echo "5. Changer la couleur:"
echo "   - Cliquer sur une couleur dans la palette en bas"
echo "6. Supprimer une vendeuse:"
echo "   - Cliquer sur l'icône poubelle"
echo "   - Confirmer la suppression"

echo ""
echo "✅ Résultats attendus:"
echo "- Interface avec deux onglets (Sélection | Paramètres)"
echo "- Formulaire d'ajout avec champ nom + palette couleurs"
echo "- Aperçu en temps réel de la nouvelle vendeuse"
echo "- Cards colorées pour chaque vendeuse existante"
echo "- Actions d'édition (nom, couleur, suppression)"
echo "- Contraste de texte adapté à chaque couleur de fond"
echo "- Sauvegarde automatique dans localStorage"

echo ""
echo "🌐 Ouvrir le navigateur pour tester..."
open http://localhost:5178

echo ""
echo "🔍 Points de vérification:"
echo "1. L'onglet 'Paramètres' est-il visible ?"
echo "2. Peut-on ajouter une vendeuse avec différentes couleurs ?"
echo "3. Le texte est-il lisible sur tous les fonds colorés ?"
echo "4. Les modifications sont-elles sauvegardées ?"
echo "5. Les nouvelles vendeuses apparaissent-elles dans l'onglet 'Sélection' ?"

echo ""
echo "✅ Test préparé ! Vérifiez manuellement l'interface."
