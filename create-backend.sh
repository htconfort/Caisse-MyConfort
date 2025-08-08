#!/bin/bash

# Script de création automatique du backend E-mail RAZ
# Version 1.0 - Configuration complète

echo "🚀 CRÉATION BACKEND E-MAIL RAZ AUTOMATIQUE"
echo "========================================="

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables
PROJECT_ROOT="/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-2"
BACKEND_DIR="$PROJECT_ROOT/email-raz-backend"

echo -e "${BLUE}📁 Création du backend dans: $BACKEND_DIR${NC}"

# Créer le dossier backend
if [ ! -d "$BACKEND_DIR" ]; then
    mkdir -p "$BACKEND_DIR"
    echo -e "${GREEN}✅ Dossier backend créé${NC}"
else
    echo -e "${YELLOW}⚠️  Dossier backend existe déjà${NC}"
fi

cd "$BACKEND_DIR"

# Initialiser le projet Node.js
echo -e "\n${YELLOW}📦 Initialisation du projet Node.js${NC}"
echo "==================================="

if [ ! -f "package.json" ]; then
    npm init -y
    echo -e "${GREEN}✅ package.json créé${NC}"
else
    echo -e "${YELLOW}⚠️  package.json existe déjà${NC}"
fi

# Installer les dépendances
echo -e "\n${YELLOW}⬇️  Installation des dépendances${NC}"
echo "================================"

echo -e "${BLUE}🔧 Installation des dépendances principales...${NC}"
npm install express nodemailer node-cron puppeteer multer cors dotenv helmet rate-limiter-flexible winston

echo -e "${BLUE}🔧 Installation des dépendances de développement...${NC}"
npm install --save-dev nodemon jest supertest

# Créer la structure des dossiers
echo -e "\n${YELLOW}📁 Création de la structure${NC}"
echo "=========================="

DIRS=("config" "services" "routes" "middleware" "templates" "logs")

for dir in "${DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo -e "${GREEN}✅ Dossier $dir créé${NC}"
    else
        echo -e "${YELLOW}⚠️  Dossier $dir existe déjà${NC}"
    fi
done

# Créer le fichier .env
echo -e "\n${YELLOW}🔧 Configuration environnement${NC}"
echo "=============================="

if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
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
API_KEY=caisse-myconfort-secret-2024

# Configuration logs
LOG_LEVEL=info
EOF
    echo -e "${GREEN}✅ Fichier .env créé${NC}"
else
    echo -e "${YELLOW}⚠️  Fichier .env existe déjà${NC}"
fi

# Créer le serveur principal
echo -e "\n${YELLOW}🖥️  Création du serveur principal${NC}"
echo "==============================="

if [ ! -f "server.js" ]; then
    cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const emailRoutes = require('./routes/email');
const razRoutes = require('./routes/raz');
const { logger } = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Limitation de débit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par windowMs
});
app.use(limiter);

// Middleware de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api/email', emailRoutes);
app.use('/api/raz', razRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Email RAZ Backend'
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  logger.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  logger.info(`🚀 Serveur backend démarré sur le port ${PORT}`);
  console.log(`🚀 Backend E-mail RAZ démarré: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
EOF
    echo -e "${GREEN}✅ Serveur principal créé${NC}"
else
    echo -e "${YELLOW}⚠️  server.js existe déjà${NC}"
fi

# Créer la configuration des logs
if [ ! -f "config/logger.js" ]; then
    cat > config/logger.js << 'EOF'
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'email-raz-backend' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log') 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = { logger };
EOF
    echo -e "${GREEN}✅ Configuration logger créée${NC}"
fi

# Créer le middleware d'authentification
if [ ! -f "middleware/auth.js" ]; then
    cat > middleware/auth.js << 'EOF'
const { logger } = require('../config/logger');

const authenticateAPI = (req, res, next) => {
  const apiKey = req.header('X-API-Key') || req.query.apiKey;
  
  if (!apiKey) {
    logger.warn('Tentative d\'accès sans clé API', { ip: req.ip });
    return res.status(401).json({ error: 'Clé API requise' });
  }
  
  if (apiKey !== process.env.API_KEY) {
    logger.warn('Tentative d\'accès avec clé API invalide', { ip: req.ip, apiKey });
    return res.status(401).json({ error: 'Clé API invalide' });
  }
  
  logger.debug('Authentification réussie', { ip: req.ip });
  next();
};

module.exports = { authenticateAPI };
EOF
    echo -e "${GREEN}✅ Middleware auth créé${NC}"
fi

# Créer les routes e-mail
if [ ! -f "routes/email.js" ]; then
    cat > routes/email.js << 'EOF'
const express = require('express');
const { authenticateAPI } = require('../middleware/auth');
const { EmailService } = require('../services/emailService');
const { logger } = require('../config/logger');

const router = express.Router();
const emailService = new EmailService();

// Envoi de rapport immédiat
router.post('/send-report', authenticateAPI, async (req, res) => {
  try {
    const { salesData, reportDate } = req.body;
    
    logger.info('Demande d\'envoi de rapport', { reportDate });
    
    const result = await emailService.sendDailyReport(salesData, reportDate);
    
    res.json({
      success: true,
      message: 'Rapport envoyé avec succès',
      result
    });
  } catch (error) {
    logger.error('Erreur envoi rapport:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi du rapport',
      details: error.message
    });
  }
});

// Planification d'envoi automatique
router.post('/schedule', authenticateAPI, async (req, res) => {
  try {
    const { cronExpression, emailConfig } = req.body;
    
    logger.info('Demande de planification', { cronExpression });
    
    const result = await emailService.scheduleEmail(cronExpression, emailConfig);
    
    res.json({
      success: true,
      message: 'Planification configurée',
      scheduleId: result.id
    });
  } catch (error) {
    logger.error('Erreur planification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la planification',
      details: error.message
    });
  }
});

// Status des envois
router.get('/status', authenticateAPI, async (req, res) => {
  try {
    const status = await emailService.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Erreur récupération status:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du status'
    });
  }
});

// Historique des envois
router.get('/history', authenticateAPI, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const history = await emailService.getHistory(parseInt(limit), parseInt(offset));
    res.json(history);
  } catch (error) {
    logger.error('Erreur récupération historique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

module.exports = router;
EOF
    echo -e "${GREEN}✅ Routes e-mail créées${NC}"
fi

# Créer les routes RAZ
if [ ! -f "routes/raz.js" ]; then
    cat > routes/raz.js << 'EOF'
const express = require('express');
const { authenticateAPI } = require('../middleware/auth');
const { RAZService } = require('../services/razService');
const { logger } = require('../config/logger');

const router = express.Router();
const razService = new RAZService();

// Planification de RAZ
router.post('/schedule', authenticateAPI, async (req, res) => {
  try {
    const { cronExpression, razConfig } = req.body;
    
    logger.info('Demande de planification RAZ', { cronExpression });
    
    const result = await razService.scheduleRAZ(cronExpression, razConfig);
    
    res.json({
      success: true,
      message: 'RAZ planifiée avec succès',
      scheduleId: result.id
    });
  } catch (error) {
    logger.error('Erreur planification RAZ:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la planification RAZ',
      details: error.message
    });
  }
});

// Exécution immédiate de RAZ
router.post('/execute', authenticateAPI, async (req, res) => {
  try {
    const { razConfig } = req.body;
    
    logger.info('Demande d\'exécution RAZ immédiate');
    
    const result = await razService.executeRAZ(razConfig);
    
    res.json({
      success: true,
      message: 'RAZ exécutée avec succès',
      result
    });
  } catch (error) {
    logger.error('Erreur exécution RAZ:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'exécution de la RAZ',
      details: error.message
    });
  }
});

// Status de la RAZ
router.get('/status', authenticateAPI, async (req, res) => {
  try {
    const status = await razService.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Erreur récupération status RAZ:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du status RAZ'
    });
  }
});

module.exports = router;
EOF
    echo -e "${GREEN}✅ Routes RAZ créées${NC}"
fi

# Créer le service e-mail
if [ ! -f "services/emailService.js" ]; then
    cat > services/emailService.js << 'EOF'
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const { logger } = require('../config/logger');
const { PDFService } = require('./pdfService');

class EmailService {
  constructor() {
    this.transporter = null;
    this.pdfService = new PDFService();
    this.scheduledJobs = new Map();
    this.history = [];
    
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      logger.info('Transporteur e-mail initialisé');
    } catch (error) {
      logger.error('Erreur initialisation transporteur:', error);
    }
  }

  async sendDailyReport(salesData, reportDate = new Date()) {
    try {
      if (!this.transporter) {
        throw new Error('Transporteur e-mail non initialisé');
      }

      // Générer le PDF du rapport
      const pdfBuffer = await this.pdfService.generateDailyReport(salesData, reportDate);
      
      // Préparer l'e-mail
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: 'direction@myconfort.com', // À configurer
        subject: `Rapport quotidien - ${reportDate.toLocaleDateString('fr-FR')}`,
        html: this.generateEmailHTML(salesData, reportDate),
        attachments: [{
          filename: `rapport-${reportDate.toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      };

      // Envoyer l'e-mail
      const result = await this.transporter.sendMail(mailOptions);
      
      // Enregistrer dans l'historique
      this.addToHistory({
        type: 'report',
        status: 'success',
        timestamp: new Date(),
        recipient: mailOptions.to,
        subject: mailOptions.subject,
        messageId: result.messageId
      });

      logger.info('Rapport envoyé avec succès', { messageId: result.messageId });
      return result;
      
    } catch (error) {
      this.addToHistory({
        type: 'report',
        status: 'error',
        timestamp: new Date(),
        error: error.message
      });
      
      logger.error('Erreur envoi rapport:', error);
      throw error;
    }
  }

  async scheduleEmail(cronExpression, emailConfig) {
    try {
      const scheduleId = `email_${Date.now()}`;
      
      const job = cron.schedule(cronExpression, async () => {
        logger.info('Exécution envoi planifié', { scheduleId });
        try {
          // Récupérer les données actuelles (à implémenter selon votre logique)
          const currentSalesData = await this.getCurrentSalesData();
          await this.sendDailyReport(currentSalesData);
        } catch (error) {
          logger.error('Erreur envoi planifié:', error);
        }
      }, {
        scheduled: true
      });

      this.scheduledJobs.set(scheduleId, {
        job,
        cronExpression,
        config: emailConfig,
        createdAt: new Date()
      });

      logger.info('E-mail planifié', { scheduleId, cronExpression });
      return { id: scheduleId };
      
    } catch (error) {
      logger.error('Erreur planification e-mail:', error);
      throw error;
    }
  }

  generateEmailHTML(salesData, reportDate) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Rapport Quotidien - ${reportDate.toLocaleDateString('fr-FR')}</h2>
          <p>Veuillez trouver en pièce jointe le rapport détaillé des ventes.</p>
          <h3>Résumé:</h3>
          <ul>
            <li>Total des ventes: ${salesData.totalRevenue || 0}€</li>
            <li>Nombre de transactions: ${salesData.totalTransactions || 0}</li>
            <li>Vendeuses actives: ${salesData.activeVendors || 0}</li>
          </ul>
          <p>Cordialement,<br/>Système MyConfort</p>
        </body>
      </html>
    `;
  }

  async getCurrentSalesData() {
    // À implémenter selon votre logique de récupération des données
    // Pour l'instant, retourner des données de test
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      activeVendors: 0,
      sales: []
    };
  }

  addToHistory(entry) {
    this.history.unshift(entry);
    // Garder seulement les 1000 dernières entrées
    if (this.history.length > 1000) {
      this.history = this.history.slice(0, 1000);
    }
  }

  async getStatus() {
    return {
      transporterReady: !!this.transporter,
      scheduledJobs: this.scheduledJobs.size,
      lastSent: this.history.find(h => h.status === 'success')?.timestamp || null
    };
  }

  async getHistory(limit = 50, offset = 0) {
    return {
      total: this.history.length,
      entries: this.history.slice(offset, offset + limit)
    };
  }
}

module.exports = { EmailService };
EOF
    echo -e "${GREEN}✅ Service e-mail créé${NC}"
fi

# Créer le service PDF
if [ ! -f "services/pdfService.js" ]; then
    cat > services/pdfService.js << 'EOF'
const puppeteer = require('puppeteer');
const { logger } = require('../config/logger');

class PDFService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async generateDailyReport(salesData, reportDate) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      const htmlContent = this.generateReportHTML(salesData, reportDate);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      await page.close();
      
      logger.info('PDF généré avec succès');
      return pdfBuffer;
      
    } catch (error) {
      logger.error('Erreur génération PDF:', error);
      throw error;
    }
  }

  generateReportHTML(salesData, reportDate) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Rapport Quotidien</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .summary { margin: 20px 0; }
            .vendor-stats { margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; background-color: #e7f3ff; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MyConfort - Rapport Quotidien</h1>
            <h2>${reportDate.toLocaleDateString('fr-FR')}</h2>
          </div>
          
          <div class="summary">
            <h3>Résumé des ventes</h3>
            <table>
              <tr><td>Chiffre d'affaires total</td><td>${salesData.totalRevenue || 0}€</td></tr>
              <tr><td>Nombre de transactions</td><td>${salesData.totalTransactions || 0}</td></tr>
              <tr><td>Vendeuses actives</td><td>${salesData.activeVendors || 0}</td></tr>
              <tr><td>Ticket moyen</td><td>${salesData.averageTicket || 0}€</td></tr>
            </table>
          </div>

          <div class="vendor-stats">
            <h3>Performance par vendeuse</h3>
            <table>
              <thead>
                <tr>
                  <th>Vendeuse</th>
                  <th>Ventes (€)</th>
                  <th>Transactions</th>
                  <th>Ticket moyen</th>
                </tr>
              </thead>
              <tbody>
                ${this.generateVendorRows(salesData.vendorStats || [])}
              </tbody>
            </table>
          </div>
          
          <div style="margin-top: 40px; text-align: center; color: #666;">
            <p>Rapport généré automatiquement le ${new Date().toLocaleString('fr-FR')}</p>
          </div>
        </body>
      </html>
    `;
  }

  generateVendorRows(vendorStats) {
    return vendorStats.map(vendor => `
      <tr>
        <td>${vendor.name}</td>
        <td>${vendor.sales || 0}€</td>
        <td>${vendor.transactions || 0}</td>
        <td>${vendor.averageTicket || 0}€</td>
      </tr>
    `).join('');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = { PDFService };
EOF
    echo -e "${GREEN}✅ Service PDF créé${NC}"
fi

# Créer le service RAZ
if [ ! -f "services/razService.js" ]; then
    cat > services/razService.js << 'EOF'
const cron = require('node-cron');
const { logger } = require('../config/logger');

class RAZService {
  constructor() {
    this.scheduledJobs = new Map();
    this.history = [];
  }

  async scheduleRAZ(cronExpression, razConfig) {
    try {
      const scheduleId = `raz_${Date.now()}`;
      
      const job = cron.schedule(cronExpression, async () => {
        logger.info('Exécution RAZ planifiée', { scheduleId });
        try {
          await this.executeRAZ(razConfig);
        } catch (error) {
          logger.error('Erreur RAZ planifiée:', error);
        }
      }, {
        scheduled: true
      });

      this.scheduledJobs.set(scheduleId, {
        job,
        cronExpression,
        config: razConfig,
        createdAt: new Date()
      });

      logger.info('RAZ planifiée', { scheduleId, cronExpression });
      return { id: scheduleId };
      
    } catch (error) {
      logger.error('Erreur planification RAZ:', error);
      throw error;
    }
  }

  async executeRAZ(razConfig) {
    try {
      logger.info('Démarrage exécution RAZ');
      
      const result = {
        timestamp: new Date(),
        actions: [],
        success: true
      };

      // Simuler les actions de RAZ
      // À remplacer par la logique réelle selon votre application
      
      if (razConfig.resetSales) {
        // Réinitialiser les ventes
        result.actions.push('Ventes réinitialisées');
      }
      
      if (razConfig.resetVendors) {
        // Réinitialiser les statistiques vendeuses
        result.actions.push('Statistiques vendeuses réinitialisées');
      }
      
      if (razConfig.backupData) {
        // Sauvegarder les données avant RAZ
        result.actions.push('Données sauvegardées');
      }

      // Enregistrer dans l'historique
      this.addToHistory({
        type: 'raz',
        status: 'success',
        timestamp: result.timestamp,
        actions: result.actions,
        config: razConfig
      });

      logger.info('RAZ exécutée avec succès', { actions: result.actions });
      return result;
      
    } catch (error) {
      this.addToHistory({
        type: 'raz',
        status: 'error',
        timestamp: new Date(),
        error: error.message
      });
      
      logger.error('Erreur exécution RAZ:', error);
      throw error;
    }
  }

  addToHistory(entry) {
    this.history.unshift(entry);
    // Garder seulement les 500 dernières entrées
    if (this.history.length > 500) {
      this.history = this.history.slice(0, 500);
    }
  }

  async getStatus() {
    return {
      scheduledJobs: this.scheduledJobs.size,
      lastExecution: this.history.find(h => h.status === 'success')?.timestamp || null,
      totalExecutions: this.history.filter(h => h.type === 'raz').length
    };
  }

  async getHistory(limit = 50, offset = 0) {
    return {
      total: this.history.length,
      entries: this.history.slice(offset, offset + limit)
    };
  }
}

module.exports = { RAZService };
EOF
    echo -e "${GREEN}✅ Service RAZ créé${NC}"
fi

# Mettre à jour le package.json avec les scripts
echo -e "\n${YELLOW}📝 Mise à jour des scripts${NC}"
echo "========================="

# Utiliser jq si disponible, sinon modification manuelle
if command -v jq &> /dev/null; then
    jq '.scripts.start = "node server.js" | .scripts.dev = "nodemon server.js" | .scripts.test = "jest"' package.json > package.json.tmp && mv package.json.tmp package.json
    echo -e "${GREEN}✅ Scripts mis à jour avec jq${NC}"
else
    # Créer un nouveau package.json avec les scripts appropriés
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.scripts = {
      ...pkg.scripts,
      start: 'node server.js',
      dev: 'nodemon server.js',
      test: 'jest'
    };
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    echo -e "${GREEN}✅ Scripts mis à jour avec Node.js${NC}"
fi

# Créer un README pour le backend
if [ ! -f "README.md" ]; then
    cat > README.md << 'EOF'
# Backend E-mail RAZ - MyConfort

## 🚀 Démarrage rapide

```bash
# Installation des dépendances
npm install

# Configuration
cp .env.example .env
# Éditer .env avec vos paramètres SMTP

# Développement
npm run dev

# Production
npm start
```

## 📧 Configuration SMTP

1. Modifier le fichier `.env`
2. Configurer votre serveur SMTP (Gmail recommandé)
3. Utiliser un mot de passe d'application pour Gmail

## 🔧 API Endpoints

- `POST /api/email/send-report` - Envoyer un rapport
- `POST /api/email/schedule` - Planifier un envoi
- `POST /api/raz/execute` - Exécuter une RAZ
- `GET /health` - Status du serveur

## 🔐 Authentification

Inclure la clé API dans les headers:
```
X-API-Key: votre-cle-api
```

## 📊 Logs

Les logs sont stockés dans le dossier `logs/`
EOF
    echo -e "${GREEN}✅ README créé${NC}"
fi

# Résumé final
echo -e "\n${GREEN}🎉 BACKEND CRÉÉ AVEC SUCCÈS !${NC}"
echo "=============================="

echo -e "${BLUE}📁 Structure créée dans: $BACKEND_DIR${NC}"
echo -e "${BLUE}📦 Dépendances installées: express, nodemailer, node-cron, puppeteer, etc.${NC}"
echo -e "${BLUE}🔧 Services prêts: EmailService, PDFService, RAZService${NC}"
echo -e "${BLUE}🛣️  Routes configurées: /api/email, /api/raz${NC}"

echo -e "\n${YELLOW}🚀 PROCHAINES ÉTAPES:${NC}"
echo "1. Configurer le fichier .env avec vos paramètres SMTP"
echo "2. Démarrer le backend: cd '$BACKEND_DIR' && npm run dev"
echo "3. Tester avec: curl http://localhost:3001/health"

echo -e "\n${YELLOW}📧 Configuration Gmail recommandée:${NC}"
echo "1. Activer l'authentification à 2 facteurs"
echo "2. Générer un mot de passe d'application"
echo "3. Utiliser ce mot de passe dans SMTP_PASS"

echo -e "\n${GREEN}✅ Le backend est prêt à être utilisé !${NC}"
EOF
    chmod +x "$PROJECT_ROOT/create-backend.sh"
    echo -e "${GREEN}✅ Script de création du backend créé${NC}"
fi

# Créer le script de création du backend
if [ ! -f "$PROJECT_ROOT/create-backend.sh" ]; then
    cat > "$PROJECT_ROOT/create-backend.sh" << 'EOF'
#!/bin/bash
bash "/Users/brunopriem/CAISSE MYCONFORT/Caisse-MyConfort-2/create-backend.sh"
