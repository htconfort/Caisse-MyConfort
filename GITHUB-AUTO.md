# 🔄 Système de Sauvegarde Automatique GitHub

Ce projet inclut un système de sauvegarde automatique sur GitHub pour conserver un historique complet de toutes les modifications.

## 🚀 Utilisation

### Option 1: Script automatique simple
```bash
./auto-commit.sh
```
Effectue une sauvegarde avec un message automatique incluant la date/heure.

### Option 2: Script avec message personnalisé
```bash
./auto-commit.sh "✨ Ajout nouvelle fonctionnalité panier"
```

### Option 3: Via npm (recommandé)
```bash
# Sauvegarde automatique
npm run save

# Avec message personnalisé
npm run save:msg "🐛 Correction bug affichage vendeuses"
```

## 📋 Ce que fait le script automatiquement

1. **Vérification** : Contrôle s'il y a des changements à sauvegarder
2. **Ajout** : `git add .` - Ajoute tous les fichiers modifiés
3. **Commit** : `git commit -m "message"` - Crée un point de sauvegarde local
4. **Push** : `git push origin main` - Envoie vers GitHub
5. **Confirmation** : Affiche le statut et l'URL du repository

## 🎯 Avantages

- ✅ **Sécurité** : Aucune perte de code possible
- ✅ **Historique complet** : Toutes les modifications sont tracées
- ✅ **Collaboration** : Partage facile avec l'équipe
- ✅ **Rollback** : Retour en arrière possible à tout moment
- ✅ **Automatisation** : Une seule commande pour tout faire

## 📊 Messages de commit recommandés

Utilisez des émojis et préfixes clairs :

```bash
✨ feat: Nouvelle fonctionnalité
🐛 fix: Correction de bug
🎨 style: Amélioration visuelle
♻️  refactor: Refactoring code
📝 docs: Mise à jour documentation
🔧 config: Modification configuration
🚀 deploy: Déploiement
🔄 save: Sauvegarde automatique
```

## 🔍 Vérification du statut

```bash
# Voir l'historique des commits
git log --oneline -10

# Voir les changements non sauvegardés
git status

# Voir les différences
git diff
```

## 🌐 Repository GitHub

**URL** : https://github.com/htconfort/Caisse-MyConfort
**Branche principale** : `main`

## ⚡ Workflow recommandé

1. **Développement** : Modifier le code selon les besoins
2. **Test** : Vérifier que l'application fonctionne (`npm start`)
3. **Sauvegarde** : `npm run save` ou `./auto-commit.sh "description"`
4. **Répéter** : Pour chaque modification importante

## 🚨 Gestion des erreurs

Si le push échoue :
```bash
# Récupérer les dernières modifications
git pull origin main

# Résoudre les conflits si nécessaire
# Puis relancer la sauvegarde
./auto-commit.sh "🔄 Résolution conflit et sauvegarde"
```

## 📈 Bonnes pratiques

- **Fréquence** : Sauvegarder après chaque fonctionnalité terminée
- **Messages** : Utiliser des messages descriptifs et clairs
- **Test** : Toujours tester avant de sauvegarder
- **Organisation** : Un commit = une fonctionnalité/correction

---

*Système mis en place le 3 août 2025 pour le projet Caisse MyConfort* 🛒
