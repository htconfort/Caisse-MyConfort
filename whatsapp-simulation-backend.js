// Simulation Backend WhatsApp pour tests - MyConfort v3.8.0
// Ce fichier peut être utilisé pour créer des routes de simulation
// si vous voulez tester WhatsApp sans configurer l'API réelle

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simulation des routes WhatsApp
const whatsappRoutes = express.Router();

// Route de test de connexion (simulation)
whatsappRoutes.get('/test-connection', (req, res) => {
  console.log('📡 Test de connexion WhatsApp demandé');
  
  // Simulation d'un délai d'API
  setTimeout(() => {
    res.json({
      success: true,
      message: 'Connexion WhatsApp Business simulée réussie',
      businessNumber: '+33123456789',
      timestamp: new Date().toISOString()
    });
  }, 1500);
});

// Route d'envoi de rapport quotidien (simulation)
whatsappRoutes.post('/send-report', (req, res) => {
  console.log('📱 Simulation envoi rapport WhatsApp:', req.body);
  
  const { reportData, config } = req.body;
  
  // Validation basique
  if (!reportData || !config) {
    return res.status(400).json({
      success: false,
      error: 'Données manquantes pour le rapport'
    });
  }
  
  // Simulation du formatage du message
  const message = `🏪 *MYCONFORT - RAPPORT QUOTIDIEN*

📅 *Date :* ${reportData.date}
💰 *CA Total :* ${reportData.totalSales.toFixed(2)}€
🛒 *Ventes :* ${reportData.salesCount} transactions
📊 *Panier moyen :* ${reportData.avgSale.toFixed(2)}€

👑 *Top Vendeuse :* ${reportData.topVendor}
💎 *Performance :* ${reportData.topVendorSales.toFixed(2)}€

💳 *Paiements :*
• CB : ${reportData.paymentBreakdown.CB.toFixed(2)}€ (${((reportData.paymentBreakdown.CB / reportData.totalSales) * 100).toFixed(1)}%)
• Espèces : ${reportData.paymentBreakdown.Espèces.toFixed(2)}€ (${((reportData.paymentBreakdown.Espèces / reportData.totalSales) * 100).toFixed(1)}%)

✅ _Rapport généré automatiquement_
🔄 _RAZ effectuée pour demain_`;

  console.log('📝 Message formaté pour WhatsApp :', message);
  
  // Simulation d'un délai d'envoi
  setTimeout(() => {
    res.json({
      success: true,
      messageId: `wa_sim_${Date.now()}`,
      recipient: config.managerNumber,
      message: 'Rapport envoyé avec succès (simulation)',
      timestamp: new Date().toISOString(),
      previewMessage: message
    });
  }, 2000);
});

// Route d'envoi d'alerte objectif (simulation)
whatsappRoutes.post('/send-target-alert', (req, res) => {
  console.log('🎯 Simulation alerte objectif WhatsApp:', req.body);
  
  const { targetData, recipients } = req.body;
  
  if (!targetData || !recipients || recipients.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Données manquantes pour l\'alerte objectif'
    });
  }
  
  const alertMessage = `🎉 *OBJECTIF ATTEINT - MYCONFORT*

🎯 *Objectif :* ${targetData.target}€
💰 *Réalisé :* ${targetData.currentSales.toFixed(2)}€
🚀 *Dépassement :* +${targetData.excess.toFixed(2)}€

👏 *Félicitations à toute l'équipe !*

📅 ${new Date().toLocaleDateString('fr-FR')}`;

  console.log('🎯 Message d\'alerte formaté :', alertMessage);
  
  // Simulation d'envoi multiple
  setTimeout(() => {
    res.json({
      success: true,
      totalSent: recipients.length,
      recipients: recipients,
      message: 'Alerte objectif envoyée à l\'équipe (simulation)',
      timestamp: new Date().toISOString(),
      previewMessage: alertMessage
    });
  }, 1500);
});

// Route d'historique des messages (simulation)
whatsappRoutes.get('/message-history', (req, res) => {
  console.log('📋 Récupération historique messages WhatsApp');
  
  const history = [
    {
      id: 'wa_001',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // Hier
      type: 'Rapport quotidien',
      recipient: '+33123456789',
      status: 'Délivré',
      messagePreview: 'MYCONFORT - RAPPORT QUOTIDIEN...'
    },
    {
      id: 'wa_002',
      timestamp: new Date(Date.now() - 172800000).toISOString(), // Avant-hier
      type: 'Alerte objectif',
      recipient: '+33123456789',
      status: 'Lu',
      messagePreview: 'OBJECTIF ATTEINT - MYCONFORT...'
    }
  ];
  
  res.json({
    success: true,
    messages: history,
    total: history.length
  });
});

// Route de configuration WhatsApp (simulation)
whatsappRoutes.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      businessNumber: '+33123456789',
      webhookConfigured: true,
      templatesApproved: ['daily_report', 'target_alert'],
      apiLimits: {
        dailyLimit: 1000,
        used: 5
      }
    }
  });
});

// Mount des routes WhatsApp
app.use('/api/whatsapp', whatsappRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'WhatsApp Simulation Backend',
    version: '3.8.0',
    timestamp: new Date().toISOString()
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    name: 'MyConfort WhatsApp Simulation Backend',
    version: '3.8.0',
    description: 'Backend de simulation pour tests WhatsApp Business',
    endpoints: {
      health: '/health',
      whatsapp: {
        testConnection: 'GET /api/whatsapp/test-connection',
        sendReport: 'POST /api/whatsapp/send-report',
        sendTargetAlert: 'POST /api/whatsapp/send-target-alert',
        messageHistory: 'GET /api/whatsapp/message-history',
        config: 'GET /api/whatsapp/config'
      }
    }
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur',
    message: err.message
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`
🚀 Serveur WhatsApp Simulation démarré sur le port ${PORT}
📱 Endpoints WhatsApp disponibles :
   - GET  /api/whatsapp/test-connection
   - POST /api/whatsapp/send-report  
   - POST /api/whatsapp/send-target-alert
   - GET  /api/whatsapp/message-history
   - GET  /api/whatsapp/config

🔧 Pour tester depuis votre frontend :
   fetch('http://localhost:${PORT}/api/whatsapp/test-connection')

📋 Documentation complète : GET http://localhost:${PORT}/
  `);
});

module.exports = app;
