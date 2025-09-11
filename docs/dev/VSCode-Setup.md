# ⚡ VS Code Turbo – Setup MyConfort

Configuration optimisée pour le développement React + Vite + TypeScript + Tailwind avec productivité maximale.

## 📋 Extensions recommandées

| Extension | Rôle |
|-----------|------|
| **ESLint** | Linter TypeScript/JavaScript |
| **Prettier** | Formatage automatique du code |
| **Tailwind CSS IntelliSense** | Autocomplétion classes Tailwind |
| **GitHub Copilot** | Suggestions IA inline |
| **GitLens** | Historique Git intelligent |
| **Error Lens** | Affichage erreurs inline |
| **Import Cost** | Poids des imports affichés |
| **Path Intellisense** | Autocomplétion chemins de fichiers |
| **Firebase Explorer** | Si Firestore utilisé |

## 🚀 Commandes utiles

```bash
# Nettoyage cache Vite
rm -rf node_modules/.vite

# Démarrage développement
npm run dev

# Démarrage avec accès iPad
npm run dev:ipad

# Linting et formatage
npm run lint
npm run lint:fix
npm run format
```

## 🎯 Configuration Flow (dictée vocale)

Pour éviter les interférences avec VS Code lors de l'utilisation de Flow :

### ❌ À désactiver dans Flow :
- **Smart formatting** - Peut interferer avec le formatage automatique
- **Command Mode** - Peut déclencher des commandes VS Code involontaires  
- **IDE Variable Recognition** - Reconnaissance variables IDE
- **IDE File Tagging** - Étiquetage fichiers IDE

### ✅ À configurer :
- **Ajouter VS Code à l'Ignore List** - Pour éviter les interférences
- **Utiliser le mode dictée simple** pour les commentaires et texte

## ⚙️ Optimisations appliquées

- **Startup épuré** : Pas d'éditeur par défaut ni de prévisualisation
- **Format on save** : ESLint + Prettier automatique
- **Copilot ciblé** : Activé pour le code, désactivé pour markdown/texte
- **Port 5173 exclusif** : Configuration stricte
- **Performance TS** : Logs désactivés, diagnostics optimisés
- **Explorer optimisé** : Confirmations désactivées, fichiers cachés filtrés

## 🔧 Dépannage

### Si Vite ne démarre pas :
```bash
# Forcer le port 5173
lsof -ti:5173 | xargs kill -9
npm run dev
```

### Si les imports sont lents :
```bash
# Nettoyer et reconstruire
rm -rf node_modules/.vite
npm install
npm run dev
```

### Si Copilot ne fonctionne pas :
1. Vérifier la connexion GitHub
2. Redémarrer VS Code
3. Cmd+Shift+P → "GitHub Copilot: Reload"
