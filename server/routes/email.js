const express = require('express');
const router = express.Router();
const EmailService = require('../services/emailService');
const rateLimit = require('express-rate-limit');

// Initialisation du service email
const emailService = new EmailService();

// Limitation du taux d'envoi d'emails
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 emails par 15 minutes
  message: { 
    success: false, 
    error: 'Trop d\'envois d\'emails, veuillez réessayer dans 15 minutes' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Route pour l'envoi manuel d'un rapport
router.post('/send-report', emailLimiter, async (req, res) => {
  try {
    console.log('📧 Demande d\'envoi de rapport reçue');
    
    const { reportData, emailConfig } = req.body;
    
    // Validation des données
    if (!reportData || !emailConfig) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes: reportData et emailConfig requis'
      });
    }
    
    if (!emailConfig.recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email destinataire requis'
      });
    }
    
    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailConfig.recipientEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Format email destinataire invalide'
      });
    }
    
    // Envoi de l'email
    const result = await emailService.sendDailyReport(reportData, emailConfig);
    
    console.log('✅ Email envoyé avec succès');
    
    res.json({
      success: true,
      message: 'Email envoyé avec succès',
      data: {
        messageId: result.messageId,
        timestamp: result.timestamp,
        recipient: result.recipient,
        attachments: result.attachments || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email',
      error: error.message
    });
  }
});

// Route pour la configuration de l'envoi automatique
router.post('/schedule', async (req, res) => {
  try {
    console.log('⏰ Configuration envoi automatique reçue');
    
    const config = req.body;
    
    // Validation de la configuration
    if (config.autoSendEnabled) {
      if (!config.recipientEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email destinataire requis pour l\'envoi automatique'
        });
      }
      
      if (!config.autoSendTime || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.autoSendTime)) {
        return res.status(400).json({
          success: false,
          message: 'Heure d\'envoi automatique invalide (format HH:MM requis)'
        });
      }
    }
    
    // Callback pour récupérer les données d'application
    const getAppDataCallback = async () => {
      // Ici vous devriez récupérer les données réelles de votre application
      // Pour l'instant, on retourne des données de test
      return {
        totalSales: req.app.locals.appData?.totalSales || 0,
        salesCount: req.app.locals.appData?.salesCount || 0,
        vendors: req.app.locals.appData?.vendors || [],
        paymentMethods: req.app.locals.appData?.paymentMethods || {},
        reset: async () => {
          // Fonction de RAZ - adapter selon votre architecture
          if (req.app.locals.appData) {
            req.app.locals.appData.dailySales = 0;
            req.app.locals.appData.cart = [];
          }
        }
      };
    };
    
    const result = emailService.scheduleAutomaticEmail(config, getAppDataCallback);
    
    console.log('✅ Envoi automatique configuré');
    
    res.json({
      success: true,
      message: config.autoSendEnabled 
        ? 'Envoi automatique configuré avec succès' 
        : 'Envoi automatique désactivé',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Erreur configuration automatique:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la configuration de l\'envoi automatique',
      error: error.message
    });
  }
});

// Route pour obtenir le statut du système automatique
router.get('/status', (req, res) => {
  try {
    const scheduledJobs = emailService.getScheduledJobs();
    
    res.json({
      success: true,
      scheduled: scheduledJobs.length > 0,
      jobs: scheduledJobs,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur statut email:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut',
      error: error.message
    });
  }
});

// Route pour tester la configuration email
router.post('/test', emailLimiter, async (req, res) => {
  try {
    console.log('🧪 Test configuration email');
    
    const { emailConfig } = req.body;
    
    if (!emailConfig || !emailConfig.recipientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email destinataire requis pour le test'
      });
    }
    
    // Données de test
    const testData = {
      date: new Date().toLocaleDateString('fr-FR'),
      totalSales: 123.45,
      salesCount: 5,
      vendors: [
        { name: 'Test Vendeuse', sales: 123.45, totalSales: 5 }
      ],
      paymentMethods: {
        'Carte': 100.45,
        'Espèces': 23.00
      }
    };
    
    const testConfig = {
      ...emailConfig,
      subject: `[TEST] ${emailConfig.subject || 'Test MyConfort'}`,
      attachPDF: false, // Pas de PDF pour les tests
      attachData: false
    };
    
    const result = await emailService.sendDailyReport(testData, testConfig);
    
    console.log('✅ Email de test envoyé');
    
    res.json({
      success: true,
      message: 'Email de test envoyé avec succès',
      data: {
        messageId: result.messageId,
        recipient: result.recipient,
        timestamp: result.timestamp
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur test email:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test de l\'email',
      error: error.message
    });
  }
});

// Route pour arrêter tous les jobs programmés
router.post('/stop-all', (req, res) => {
  try {
    emailService.stopAllJobs();
    
    res.json({
      success: true,
      message: 'Tous les envois automatiques ont été arrêtés'
    });
    
  } catch (error) {
    console.error('❌ Erreur arrêt jobs:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'arrêt des jobs',
      error: error.message
    });
  }
});

module.exports = router;
