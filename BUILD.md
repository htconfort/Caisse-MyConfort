# 🏗️ BUILD GUIDE - Caisse MyConfort

## 📁 Structure du projet

```
Caisse-MyConfort/
├── package.json          ← Package racine (délègue aux scripts du sous-projet)
├── .nvmrc               ← Version Node.js (20.19.0)
├── .npmrc               ← Configuration npm
├── netlify.toml         ← Configuration Netlify
├── netlify/
│   └── functions/       ← Fonctions serverless Netlify
└── mon-projet-vite/     ← Application principale
    ├── package.json     ← Package de l'application
    ├── src/            ← Code source
    └── dist/           ← Build output (généré)
```

## 🚀 Build sur Netlify

### Configuration automatique

Le projet est configuré pour fonctionner automatiquement sur Netlify :

**netlify.toml:**
```toml
[build]
  publish = "mon-projet-vite/dist"
  command = "npm install && npm run build:netlify"
```

**package.json (racine):**
```json
{
  "scripts": {
    "build:netlify": "cd mon-projet-vite && npm run build:netlify"
  }
}
```

### Flux de build

1. Netlify clone le repo
2. Lit `.nvmrc` → Utilise Node.js 20.19.0
3. Exécute `npm install` (racine) → Délègue à `mon-projet-vite/`
4. Exécute `npm run build:netlify` (racine) → Délègue à `mon-projet-vite/`
5. Publie le dossier `mon-projet-vite/dist/`

## 🛠️ Build local

### Depuis la racine du projet

```bash
# Installation des dépendances
npm install

# Build de production
npm run build

# Build Netlify (avec optimisations)
npm run build:netlify

# Développement local
npm run dev
```

### Depuis le sous-projet

```bash
cd mon-projet-vite

# Installation
npm install

# Build
npm run build

# Développement
npm run dev
```

## 🐛 Dépannage

### Erreur "Missing script: build:netlify"

**Cause:** Netlify cherche le script à la racine

**Solution:** Le package.json racine a maintenant le script qui délègue :
```json
"build:netlify": "cd mon-projet-vite && npm run build:netlify"
```

### Erreur "ENOENT: no such file or directory"

**Cause:** npm cherche package-lock.json à la racine

**Solution:** `.npmrc` configure `package-lock=false` à la racine

### Cache Netlify

Si le build échoue malgré tout :

1. Aller dans Netlify Dashboard
2. Site settings → Build & deploy
3. Build settings → Clear cache and retry deploy

## ✅ Checklist de déploiement

Avant chaque déploiement, vérifier :

- [ ] `.nvmrc` contient `20.19.0`
- [ ] `package.json` racine a le script `build:netlify`
- [ ] `netlify.toml` pointe vers `mon-projet-vite/dist`
- [ ] Les variables d'environnement sont configurées dans Netlify
- [ ] Le build local fonctionne : `npm run build`

## 📊 Variables d'environnement Netlify

Requises pour le fonctionnement :

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_N8N_URL
VITE_N8N_WEBHOOK_URL
VITE_N8N_TARGET
VITE_N8N_ENABLED
VITE_EXTERNAL_INVOICES_URL
VITE_EXTERNAL_INVOICES_RUN_URL
VITE_EXTERNAL_AUTOSYNC
```

Voir `netlify.toml` pour la liste complète.

## 🔧 Maintenance

### Mise à jour des dépendances

```bash
# Depuis mon-projet-vite/
cd mon-projet-vite
npm update
npm audit fix

# Tester localement
npm run build
```

### Changement de version Node

1. Modifier `.nvmrc`
2. Modifier `netlify.toml` → `[build.environment] NODE_VERSION`
3. Tester localement avec `nvm use`

---

**Date de création:** 18 octobre 2025  
**Version:** 1.0.0  
**Auteur:** Documentation automatique

