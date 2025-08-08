# 🎯 PLAN DE DÉVELOPPEMENT BACKEND E-MAIL RAZ
# Version 1.0 - Configuration et implémentation

## 📋 Architecture Backend Recommandée

### 🚀 Stack Technique
```
Backend E-mail Service
├── Node.js + Express       # Serveur API
├── Nodemailer             # Envoi d'e-mails SMTP
├── Node-cron              # Planification automatique
├── Puppeteer              # Génération PDF serveur
├── Multer                 # Gestion fichiers
└── Cors                   # Communication front-end
```

### 📁 Structure du projet
```
email-raz-backend/
├── package.json
├── server.js              # Point d'entrée principal
├── config/
│   ├── email.js          # Configuration SMTP
│   └── scheduler.js      # Configuration cron
├── services/
│   ├── emailService.js   # Logique d'envoi
│   ├── pdfService.js     # Génération PDF
│   └── razService.js     # Logique RAZ
├── routes/
│   ├── email.js          # Routes e-mail
│   └── raz.js            # Routes RAZ
├── middleware/
│   └── auth.js           # Authentification
└── templates/
    └── email.html        # Template e-mail
```

## 🔧 Commandes d'installation

### 1. Création du projet backend
```bash
# Créer le dossier backend
mkdir email-raz-backend
cd email-raz-backend

# Initialiser le projet Node.js
npm init -y

# Installer les dépendances principales
npm install express nodemailer node-cron puppeteer multer cors
npm install --save-dev nodemon

# Installer les dépendances optionnelles
npm install dotenv helmet rate-limiter-flexible
```

### 2. Configuration des scripts package.json
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Tests à implémenter\" && exit 1"
  }
}
```

## 📧 Configuration E-mail SMTP

### Variables d'environnement (.env)
```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app

# Configuration serveur
PORT=3001
NODE_ENV=development

# Configuration application
FRONTEND_URL=http://localhost:5173
API_KEY=votre-cle-api-secrete
```

### Configuration Gmail (recommandée)
1. Activer l'authentification à 2 facteurs
2. Générer un mot de passe d'application
3. Utiliser le mot de passe d'application dans SMTP_PASS

## ⚙️ Implémentation des services

### 1. Service E-mail (emailService.js)
```javascript
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendDailyReport(reportData, pdfBuffer) {
    // Implémentation envoi rapport
  }

  async scheduleEmail(schedule) {
    // Implémentation planification
  }
}
```

### 2. Service PDF (pdfService.js)
```javascript
const puppeteer = require('puppeteer');

class PDFService {
  async generateFromHTML(htmlContent) {
    // Génération PDF côté serveur
  }

  async generateDailyReport(salesData) {
    // Rapport quotidien en PDF
  }
}
```

### 3. Service RAZ (razService.js)
```javascript
const cron = require('node-cron');

class RAZService {
  scheduleRAZ(cronExpression, callback) {
    // Planification RAZ automatique
  }

  executeRAZ() {
    // Exécution de la remise à zéro
  }
}
```

## 🔄 API Endpoints

### Routes E-mail (/api/email)
```
POST /api/email/send-report     # Envoi rapport immédiat
POST /api/email/schedule        # Planifier envoi automatique
GET  /api/email/status          # Status des envois
GET  /api/email/history         # Historique
DELETE /api/email/schedule/:id  # Annuler planification
```

### Routes RAZ (/api/raz)
```
POST /api/raz/schedule          # Planifier RAZ
POST /api/raz/execute           # Exécuter RAZ immédiate
GET  /api/raz/status            # Status RAZ
GET  /api/raz/history           # Historique RAZ
```

## 🔐 Sécurité et authentification

### Middleware de sécurité
```javascript
const helmet = require('helmet');
const rateLimit = require('rate-limiter-flexible');

// Protection headers
app.use(helmet());

// Limitation de débit
const rateLimiter = new rateLimit({
  keyPrefix: 'middleware',
  points: 100,
  duration: 60,
});
```

### Authentification API Key
```javascript
const authenticateAPI = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};
```

## 📅 Planification automatique

### Configuration Cron
```javascript
// Envoi quotidien à 18h00
cron.schedule('0 18 * * *', () => {
  emailService.sendDailyReport();
});

// RAZ quotidienne à 23h59
cron.schedule('59 23 * * *', () => {
  razService.executeRAZ();
});

// Sauvegarde hebdomadaire dimanche 2h00
cron.schedule('0 2 * * 0', () => {
  backupService.weeklyBackup();
});
```

## 🧪 Tests et validation

### 1. Tests unitaires
```bash
npm install --save-dev jest supertest
npm test
```

### 2. Tests d'intégration
```bash
# Test envoi e-mail
curl -X POST http://localhost:3001/api/email/send-report \
  -H "Content-Type: application/json" \
  -H "X-API-Key: votre-cle" \
  -d '{"salesData": {...}}'

# Test planification RAZ
curl -X POST http://localhost:3001/api/raz/schedule \
  -H "Content-Type: application/json" \
  -H "X-API-Key: votre-cle" \
  -d '{"schedule": "0 23 * * *"}'
```

## 🔗 Intégration Frontend

### Configuration service frontend
```javascript
// src/services/emailService.js
const API_BASE = 'http://localhost:3001/api';
const API_KEY = 'votre-cle-api';

const emailService = {
  async sendDailyReport(salesData) {
    const response = await fetch(`${API_BASE}/email/send-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({ salesData })
    });
    return response.json();
  }
};
```

## 📊 Monitoring et logs

### Configuration des logs
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🚀 Déploiement

### 1. Développement local
```bash
npm run dev    # Backend sur port 3001
npm run dev    # Frontend sur port 5173
```

### 2. Production
```bash
# Variables d'environnement production
export NODE_ENV=production
export PORT=3001
export SMTP_HOST=smtp.votre-domaine.com

# Démarrage
npm start
```

## 📈 Étapes de développement

### Phase 1: Backend minimal (1-2h)
- [x] Configuration projet Node.js
- [ ] Service e-mail basique
- [ ] Route envoi rapport
- [ ] Tests de base

### Phase 2: Fonctionnalités avancées (2-3h)
- [ ] Génération PDF serveur
- [ ] Planification cron
- [ ] Service RAZ automatique
- [ ] Authentification API

### Phase 3: Intégration complète (1-2h)
- [ ] Connexion frontend-backend
- [ ] Tests d'intégration
- [ ] Interface utilisateur finale
- [ ] Documentation utilisateur

### Phase 4: Production (1h)
- [ ] Configuration sécurité
- [ ] Optimisation performances
- [ ] Monitoring et logs
- [ ] Déploiement

---

## 🎯 PROCHAINE ACTION RECOMMANDÉE

**Créer le backend Node.js** avec la commande:
```bash
bash "/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-2/create-backend.sh"
```

Une fois le backend créé, l'intégration sera **100% terminée** ! 🚀
