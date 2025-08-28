# 🔄 GUIDE DE SAUVEGARDE AUTOMATIQUE GIT

## 📋 Vue d'ensemble
Système de sauvegarde automatique qui effectue `git add`, `git commit` et `git push` en une seule commande.

## 🚀 Utilisation

### Sauvegarde avec message automatique
```bash
./auto-git-save.sh
```
**Résultat :** Commit avec timestamp automatique

### Sauvegarde avec message personnalisé
```bash
./auto-git-save.sh "IMPLEMENTATION: Système RAZ à deux niveaux terminé"
./auto-git-save.sh "FIX: Correction bugs TypeScript"
./auto-git-save.sh "FEATURE: Nouveau service pendingPayments"
```

## 🎯 Ce que fait le script

1. **📦 git add .** - Ajoute tous les fichiers modifiés
2. **💾 git commit** - Commit avec message horodaté ou personnalisé  
3. **🌐 git push origin main** - Pousse vers le serveur
4. **📊 Affichage du statut** - Montre les derniers commits

## ⚡ Commandes rapides

### Sauvegardes fréquentes
```bash
# Après chaque modification importante
./auto-git-save.sh "RAZ: Ajout boutons deux niveaux"

# Après tests réussis
./auto-git-save.sh "TEST: Validation fonctionnalités RAZ"

# Après corrections
./auto-git-save.sh "FIX: Résolution erreurs TypeScript"
```

### Alias recommandés (à ajouter dans ~/.zshrc)
```bash
alias gitsave='./auto-git-save.sh'
alias gs='./auto-git-save.sh'
```

## 🔍 Vérifications automatiques

- ✅ Vérification que c'est un repo Git
- ✅ Contrôle des changements à commiter  
- ✅ Gestion des erreurs de push
- ✅ Affichage du statut détaillé

## 📈 Bonnes pratiques

### Messages de commit recommandés
- `FEATURE: Description de la nouvelle fonctionnalité`
- `FIX: Description du bug corrigé`
- `UPDATE: Description de la mise à jour`
- `REFACTOR: Description du refactoring`
- `TEST: Description des tests`
- `DOC: Description de la documentation`

### Fréquence recommandée
- ✅ Après chaque fonctionnalité terminée
- ✅ Après chaque correction de bug
- ✅ Avant de changer de contexte de travail
- ✅ En fin de session de développement

## 🛠️ Dépannage

### Le push échoue
```bash
# Vérifier le statut
git status

# Pousser manuellement
git push origin main

# Si conflits, récupérer d'abord
git pull origin main
```

### Annuler le dernier commit (si erreur)
```bash
# Annuler le commit mais garder les changements
git reset --soft HEAD~1

# Annuler complètement le commit
git reset --hard HEAD~1
```

## 📊 Exemple d'utilisation complète

```bash
# 1. Développement terminé
./auto-git-save.sh "FEATURE: Système RAZ deux niveaux complet"

# 2. Tests effectués  
./auto-git-save.sh "TEST: Validation boutons RAZ Journée et Fin Session"

# 3. Documentation mise à jour
./auto-git-save.sh "DOC: Guide utilisation RAZ utilisateur"

# 4. Corrections mineures
./auto-git-save.sh "FIX: Amélioration messages utilisateur"
```

## 🎖️ Avantages

- ⚡ **Rapidité** : Une seule commande pour tout
- 🛡️ **Sécurité** : Sauvegarde automatique des changements
- 📝 **Traçabilité** : Historique détaillé des modifications
- 🔄 **Simplicité** : Pas besoin de retenir les commandes Git
- ⏰ **Horodatage** : Timestamps automatiques
