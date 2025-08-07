#!/bin/bash

# Script de nettoyage : Archiver l'ancien projet React et ne garder que le projet Vite
# Éviter toute confusion entre les deux projets

echo "🧹 NETTOYAGE : Archivage ancien projet React"
echo "============================================="

cd "$(dirname "$0")"

echo ""
echo "📋 SITUATION ACTUELLE :"
echo "- Projet VITE (à conserver) : mon-projet-vite/ ✅"
echo "- Ancien projet React (à archiver) : src/, public/, package.json ❌"
echo ""

# Créer un dossier d'archive
ARCHIVE_DIR="archive-ancien-projet-react-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$ARCHIVE_DIR"

echo "📦 Archivage de l'ancien projet React vers $ARCHIVE_DIR..."

# Déplacer les fichiers de l'ancien projet React
echo "  → Déplacement src/ (ancien React)"
[ -d "src" ] && mv src "$ARCHIVE_DIR/"

echo "  → Déplacement public/ (ancien React)"
[ -d "public" ] && mv public "$ARCHIVE_DIR/"

echo "  → Déplacement node_modules/ (ancien React)"
[ -d "node_modules" ] && mv node_modules "$ARCHIVE_DIR/"

echo "  → Déplacement package.json (ancien React)"
[ -f "package.json" ] && mv package.json "$ARCHIVE_DIR/"

echo "  → Déplacement package-lock.json (ancien React)"
[ -f "package-lock.json" ] && mv package-lock.json "$ARCHIVE_DIR/"

echo "  → Déplacement .env (ancien React)"
[ -f ".env" ] && mv .env "$ARCHIVE_DIR/"

echo "  → Déplacement tsconfig.json (ancien React)"
[ -f "tsconfig.json" ] && mv tsconfig.json "$ARCHIVE_DIR/"

# Créer un README d'explication dans l'archive
cat > "$ARCHIVE_DIR/README-ARCHIVE.md" << 'EOF'
# Archive de l'ancien projet React

## Date d'archivage
$(date)

## Raison
Confusion entre deux projets :
- **Ancien projet React** : Port 3000, react-scripts
- **Nouveau projet Vite** : Port 5173-5175, Vite

## Contenu archivé
- src/ : Code source de l'ancien projet React
- public/ : Assets publics de l'ancien projet React  
- package.json : Configuration npm de l'ancien projet React
- node_modules/ : Dépendances de l'ancien projet React
- .env : Variables d'environnement de l'ancien projet React

## Projet actuel à utiliser
**UNIQUEMENT** le dossier `mon-projet-vite/` qui contient :
- ✅ Code source à jour avec déduction automatique stock N8N
- ✅ Interface factures élégante  
- ✅ Système complet de gestion
- ✅ Serveur Vite (port 5173-5175)

## Commandes pour le projet actuel
```bash
cd mon-projet-vite
npm run dev
```

## Restauration (si nécessaire)
Pour restaurer l'ancien projet React :
```bash
# Depuis le répertoire racine
mv archive-ancien-projet-react-*/src .
mv archive-ancien-projet-react-*/public .
mv archive-ancien-projet-react-*/package.json .
# etc...
```

**IMPORTANT** : Ne jamais mélanger les deux projets !
EOF

# Mettre à jour le README principal
cat > README.md << 'EOF'
# 🏪 Caisse MyConfort - Application de Gestion

## 🎯 PROJET PRINCIPAL : `mon-projet-vite/`

**⚠️ IMPORTANT** : Utiliser UNIQUEMENT le projet Vite dans le dossier `mon-projet-vite/`

### 🚀 Démarrage

```bash
cd mon-projet-vite
npm run dev
```

**URL** : http://localhost:5173 (ou 5174, 5175 selon disponibilité)

### ✨ Fonctionnalités

- ✅ **Interface factures élégante** avec tableau produits
- ✅ **Déduction automatique du stock** lors de l'arrivée de factures N8N
- ✅ **Synchronisation N8N** en temps réel
- ✅ **Gestion du stock physique** avec alertes visuelles
- ✅ **Traçabilité complète** des mouvements de stock
- ✅ **Interface intuitive** avec onglets dédiés

### 📱 Navigation

- **Onglet Factures** : Visualisation des factures N8N avec interface élégante
- **Onglet Stock > Stock physique** : Gestion du stock avec déductions automatiques
- **Autres onglets** : Ventes, Produits, etc.

### 🔄 Workflow Automatique

1. **Facture N8N reçue** → Synchronisation automatique
2. **Produits détectés** → Déduction automatique du stock
3. **Alertes générées** → Notifications visuelles si stock faible
4. **Traçabilité** → Historique complet des mouvements

### 📚 Documentation

- `DEDUCTION-STOCK-AUTOMATIQUE-v3.0.0.md` : Documentation de la déduction automatique
- `AMELIORATION-INTERFACE-FACTURES-v2.1.0.md` : Documentation de l'interface factures

### 🗂️ Archive

L'ancien projet React a été archivé dans `archive-ancien-projet-react-*/` pour éviter toute confusion.

**Version actuelle** : v3.0.0-deduction-stock-automatique
EOF

echo ""
echo "✅ NETTOYAGE TERMINÉ !"
echo "====================="
echo ""
echo "📁 Ancien projet React archivé dans : $ARCHIVE_DIR/"
echo "🎯 Projet principal : mon-projet-vite/ (Vite + TypeScript)"
echo "🌐 URL du serveur : http://localhost:5175/"
echo ""
echo "🚀 UTILISATION :"
echo "=================="
echo "cd mon-projet-vite"
echo "npm run dev"
echo ""
echo "⚠️  IMPORTANT : N'utiliser QUE le projet Vite désormais !"

# Commit de la réorganisation
if [ -d ".git" ]; then
    echo ""
    echo "💾 Sauvegarde Git de la réorganisation..."
    git add -A
    git commit -m "🧹 NETTOYAGE: Archivage ancien projet React

📦 RÉORGANISATION COMPLÈTE:
- Ancien projet React → archivé dans $ARCHIVE_DIR/
- Projet principal : UNIQUEMENT mon-projet-vite/ (Vite)
- Éviter confusion entre React (port 3000) et Vite (port 5173-5175)

✅ PROJET ACTUEL:
- Serveur: Vite (http://localhost:5175/)
- Code: mon-projet-vite/src/
- Fonctionnalités: Déduction stock N8N + Interface élégante

🎯 WORKFLOW:
cd mon-projet-vite && npm run dev

⚠️ Ne plus jamais utiliser l'ancien projet React archivé !"
    
    echo "✅ Commit de réorganisation créé"
fi

echo ""
echo "🎉 Le projet est maintenant propre et sans confusion !"
echo "   → Utilisez EXCLUSIVEMENT mon-projet-vite/"
