const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const emailRoutes = require('./routes/email');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: false, // Désactivé pour le développement
}));

// CORS - permettre les requêtes depuis le front-end
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging des requêtes
app.use(morgan('combined'));

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre de 15 minutes
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Stockage des données d'application (en mémoire pour le développement)
// En production, utilisez une vraie base de données
app.locals.appData = {
  totalSales: 0,
  salesCount: 0,
  vendors: [],
  paymentMethods: {},
  dailySales: 0,
  cart: []
};

// Routes API
app.use('/api/email', emailRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MyConfort Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      email: 'Available',
      scheduler: 'Available'
    }
  });
});

// Route pour mettre à jour les données d'application
app.post('/api/data/update', (req, res) => {
  try {
    const { data } = req.body;
    
    if (data) {
      app.locals.appData = { ...app.locals.appData, ...data };
      console.log('📊 Données application mises à jour');
    }
    
    res.json({
      success: true,
      message: 'Données mises à jour',
      data: app.locals.appData
    });
    
  } catch (error) {
    console.error('Erreur mise à jour données:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route pour récupérer les données d'application
app.get('/api/data', (req, res) => {
  res.json({
    success: true,
    data: app.locals.appData
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Gestionnaire d'erreur global
app.use((error, req, res, next) => {
  console.error('❌ Erreur serveur:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log('🚀 MyConfort Server démarré avec succès !');
  console.log('🚀 ========================================');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📧 API Email: http://localhost:${PORT}/api/email`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log('🚀 ========================================');
  
  // Vérification des variables d'environnement pour l'email
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  Variables d\'environnement SMTP non configurées');
    console.warn('⚠️  Créez un fichier .env avec SMTP_USER et SMTP_PASS');
  } else {
    console.log('✅ Configuration SMTP détectée');
  }
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur demandé');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Arrêt du serveur (Ctrl+C)');
  process.exit(0);
});

module.exports = app;
