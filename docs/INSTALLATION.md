# 🚀 Guide d'Installation - Application Caisse MyConfort iPad

## 📋 Prérequis Système

### iPad Configuration
- **iPad** : iPad (6ème génération) ou plus récent
- **iPadOS** : 14.0 ou supérieur
- **Stockage** : 500 MB d'espace libre minimum
- **Connectivité** : Wi-Fi recommandé (application fonctionne hors ligne)

### Environnement de Développement
- **Node.js** : Version 16.x ou 18.x (recommandé)
- **npm** : Version 8.x ou supérieur
- **Git** : Pour le clone du repository
- **VSCode** : IDE recommandé avec extensions

## 🛠️ Installation pour Développement

### 1. Clone du Repository
```bash
git clone https://github.com/votre-compte/ipad-caisse-app.git
cd ipad-caisse-app
```

### 2. Installation des Dépendances
```bash
npm install
```

### 3. Configuration Node.js (si erreur OpenSSL)
```bash
# Créer le fichier .env
echo "NODE_OPTIONS=--openssl-legacy-provider" > .env
```

### 4. Lancement en Développement
```bash
npm start
```

L'application sera accessible à l'adresse :
- **Local** : http://localhost:3000
- **Réseau** : http://[votre-ip]:3000

## 📱 Déploiement sur iPad

### Option 1 : Accès Direct (Recommandé)
1. **Connecter iPad au même réseau** que l'ordinateur de développement
2. **Lancer l'application** : `npm start`
3. **Noter l'adresse IP** affichée dans le terminal
4. **Ouvrir Safari sur iPad** et naviguer vers `http://[ip]:3000`
5. **Ajouter à l'écran d'accueil** pour un accès type app native

### Option 2 : Build de Production
```bash
# Générer le build optimisé
npm run build

# Servir les fichiers statiques
npx serve -s build -p 3000
```

### Option 3 : Hébergement Web
1. **Build de production** : `npm run build`
2. **Upload du dossier build/** sur votre serveur web
3. **Configurer HTTPS** (recommandé pour PWA)
4. **Accéder depuis Safari iPad**

## 🔧 Configuration VSCode

### Extensions Essentielles
Installer automatiquement avec :
```bash
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension GitHub.copilot
```

### Settings VSCode
Le fichier `.vscode/settings.json` est déjà configuré avec :
- Auto-format sur sauvegarde
- ESLint + Prettier
- TypeScript strict
- Extensions optimisées

### Tasks VSCode
Tâches prédéfinies disponibles (`Cmd+Shift+P` > "Tasks: Run Task") :
- **Démarrer l'application** : Lance le serveur de dev
- **Build production** : Génère le build optimisé
- **Type Check** : Vérification TypeScript

## 🌐 Configuration Réseau

### Firewall et Ports
Assurez-vous que le **port 3000** est ouvert :

**macOS :**
```bash
sudo pfctl -d  # Désactiver temporairement le firewall
```

**Windows :**
```cmd
netsh advfirewall firewall add rule name="React Dev Server" dir=in action=allow protocol=TCP localport=3000
```

**Linux :**
```bash
sudo ufw allow 3000
```

### Obtenir l'Adresse IP
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

## 📊 Performance & Optimisation

### Optimisations de Build
Le projet inclut déjà :
- **Code splitting** automatique
- **Minification** CSS/JS
- **Compression** gzip
- **Cache busting** pour les assets

### Optimisations iPad
- **Touch targets** 44px minimum
- **Viewport** optimisé
- **Safe areas** supportées
- **Offline capability** avec localStorage

## 🔒 Sécurité

### Données Locales
- **Stockage** : 100% local sur l'iPad
- **Pas de serveur** : Aucune donnée envoyée sur internet
- **Isolation** : Chaque iPad = instance indépendante

### HTTPS (Production)
Pour un déploiement web sécurisé :
```nginx
server {
    listen 443 ssl;
    server_name votre-domaine.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        root /path/to/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

## 🚨 Dépannage

### Erreurs Communes

#### "Error: digital envelope routines::unsupported"
**Solution** : Ajouter dans `.env`
```
NODE_OPTIONS=--openssl-legacy-provider
```

#### "Port 3000 is already in use"
**Solutions** :
```bash
# Tuer le processus existant
lsof -ti:3000 | xargs kill -9

# Ou utiliser un port différent
npm start -- --port 3001
```

#### Application blanche sur iPad
1. **Vérifier la console** Safari > Développement > iPad > Console
2. **Forcer le rechargement** : Cmd+R sur iPad
3. **Vider le cache** Safari > Paramètres > Effacer données

#### Performances lentes
1. **Redémarrer Safari** sur iPad
2. **Libérer de la mémoire** : fermer autres apps
3. **Vérifier le réseau** : ping de l'ordinateur vers iPad

### Logs de Debug
Activer les logs détaillés :
```bash
# Mode debug complet
REACT_APP_DEBUG=true npm start

# Logs réseau
DEBUG=* npm start
```

### Reset Complet
En cas de problème persistant :
```bash
# Nettoyer les dépendances
rm -rf node_modules package-lock.json
npm install

# Nettoyer le cache
npm start -- --reset-cache
```

## 📱 Configuration iPad Spécifique

### Safari Settings
**Paramètres iPad > Safari :**
- Activer **JavaScript**
- Désactiver **Bloquer les pop-ups** (si nécessaire)
- **Mode Bureau** désactivé
- **Lecteur automatique** désactivé

### Mode Plein Écran
Après avoir ajouté à l'écran d'accueil :
1. **Ouvrir depuis l'icône** (pas Safari)
2. **Mode standalone** automatique
3. **Pas de barre d'adresse** Safari

### Gestion de l'Alimentation
- **Verrouillage automatique** : Jamais (pendant utilisation)
- **Luminosité** : Ajuster selon l'environnement
- **Mode économie d'énergie** : Désactiver pendant utilisation

## 🔄 Mise à Jour

### Procédure de Mise à Jour
1. **Sauvegarder les données** via Export CSV/JSON
2. **Pull des modifications** : `git pull origin main`
3. **Mise à jour des dépendances** : `npm install`
4. **Test en développement** : `npm start`
5. **Nouveau build** : `npm run build`
6. **Déploiement** de la nouvelle version

### Migration des Données
Les données localStorage sont compatibles entre versions.
En cas de breaking change, un script de migration sera fourni.

## 📞 Support Technique

### Informations à Fournir
En cas de problème :
- **Version iPad/iPadOS**
- **Version de Safari**
- **Messages d'erreur** (captures d'écran)
- **Étapes de reproduction**
- **Logs de la console** (si possible)

### Channels de Support
- **Documentation** : Consulter les guides dans `/docs`
- **Issues GitHub** : Reporter les bugs
- **Email** : support@myconfort.com (si configuré)

---

*Guide d'installation - Version 1.0 - Août 2025*
