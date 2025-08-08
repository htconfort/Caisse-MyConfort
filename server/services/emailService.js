const nodemailer = require('nodemailer');
const cron = require('node-cron');
const puppeteer = require('puppeteer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true pour 465, false pour autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    this.scheduledJobs = new Map();
    this.testEmailConnection();
  }
  
  async testEmailConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Serveur email configuré et prêt');
    } catch (error) {
      console.error('❌ Erreur configuration email:', error.message);
    }
  }
  
  async sendDailyReport(reportData, emailConfig) {
    try {
      console.log('📧 Préparation envoi email rapport...');
      
      const htmlContent = this.generateHTMLReport(reportData);
      
      const mailOptions = {
        from: `"MyConfort POS" <${process.env.SMTP_USER}>`,
        to: emailConfig.recipientEmail,
        cc: emailConfig.ccEmails || undefined,
        subject: emailConfig.subject || `Rapport MyConfort - ${reportData.date}`,
        html: htmlContent,
        attachments: []
      };
      
      // Ajouter des pièces jointes si configurées
      if (emailConfig.attachPDF) {
        try {
          const pdfBuffer = await this.generatePDFBuffer(reportData);
          mailOptions.attachments.push({
            filename: `rapport-caisse-${reportData.date.replace(/\//g, '-')}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          });
          console.log('📎 PDF joint au rapport');
        } catch (pdfError) {
          console.warn('⚠️ Erreur génération PDF:', pdfError.message);
        }
      }
      
      if (emailConfig.attachData) {
        mailOptions.attachments.push({
          filename: `donnees-caisse-${reportData.date.replace(/\//g, '-')}.json`,
          content: JSON.stringify(reportData, null, 2),
          contentType: 'application/json'
        });
        console.log('📎 Données JSON jointes');
      }
      
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email envoyé avec succès: ${result.messageId}`);
      console.log(`📧 Destinataire: ${emailConfig.recipientEmail}`);
      
      return {
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
        recipient: emailConfig.recipientEmail,
        attachments: mailOptions.attachments.length
      };
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      throw new Error(`Échec envoi email: ${error.message}`);
    }
  }
  
  scheduleAutomaticEmail(config, getAppDataCallback) {
    const jobId = 'daily-email-raz';
    
    // Supprimer le job existant s'il y en a un
    if (this.scheduledJobs.has(jobId)) {
      this.scheduledJobs.get(jobId).destroy();
      console.log('🗑️ Ancien job supprimé');
    }
    
    if (!config.autoSendEnabled) {
      console.log('⏸️ Envoi automatique désactivé');
      return { success: true, message: 'Envoi automatique désactivé' };
    }
    
    const [hours, minutes] = config.autoSendTime.split(':');
    const cronPattern = `${minutes} ${hours} * * *`; // Tous les jours à l'heure spécifiée
    
    console.log(`⏰ Programmation envoi automatique: ${cronPattern} (${config.autoSendTime})`);
    
    const job = cron.schedule(cronPattern, async () => {
      try {
        console.log('🕐 Déclenchement envoi automatique...');
        
        // Récupération des données actuelles via callback
        const appData = await getAppDataCallback();
        const reportData = this.prepareReportData(appData);
        
        // Envoi de l'email
        const emailResult = await this.sendDailyReport(reportData, config);
        console.log('✅ Email automatique envoyé:', emailResult.messageId);
        
        // Exécution de la RAZ si configurée
        if (config.performRAZ) {
          await this.performAutomaticRAZ(appData);
          console.log('🔄 RAZ automatique effectuée');
        }
        
        // Log de succès
        console.log(`🎉 Cycle automatique terminé avec succès à ${new Date().toLocaleString('fr-FR')}`);
        
      } catch (error) {
        console.error('❌ Erreur cycle automatique:', error);
        
        // Optionnel: Envoyer un email d'erreur aux administrateurs
        try {
          await this.sendErrorNotification(error, config);
        } catch (notifError) {
          console.error('❌ Erreur notification erreur:', notifError);
        }
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Paris'
    });
    
    this.scheduledJobs.set(jobId, job);
    
    console.log(`✅ Envoi automatique programmé: tous les jours à ${config.autoSendTime}`);
    
    return {
      success: true,
      message: `Envoi programmé tous les jours à ${config.autoSendTime}`,
      cronPattern,
      timezone: 'Europe/Paris'
    };
  }
  
  async sendErrorNotification(error, config) {
    if (!config.recipientEmail) return;
    
    const errorMailOptions = {
      from: `"MyConfort POS - Erreur" <${process.env.SMTP_USER}>`,
      to: config.recipientEmail,
      subject: '⚠️ Erreur Système MyConfort - Envoi Automatique',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
            <h1>⚠️ ERREUR SYSTÈME MYCONFORT</h1>
          </div>
          <div style="padding: 20px; background: #f8f9fa;">
            <h3>Une erreur s'est produite lors de l'envoi automatique</h3>
            <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
            <p><strong>Erreur:</strong> ${error.message}</p>
            <p><strong>Action recommandée:</strong> Vérifiez la configuration du système et contactez le support technique si nécessaire.</p>
          </div>
        </div>
      `
    };
    
    await this.transporter.sendMail(errorMailOptions);
    console.log('📧 Notification d\'erreur envoyée');
  }
  
  generateHTMLReport(data) {
    const totalCA = data.totalSales || 0;
    const salesCount = data.salesCount || 0;
    const avgBasket = salesCount > 0 ? totalCA / salesCount : 0;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport de Caisse - MyConfort</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
                margin: 0; 
                padding: 20px; 
                background-color: #f8f9fa; 
                line-height: 1.6;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 12px; 
                overflow: hidden; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header { 
                background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); 
                color: white; 
                padding: 30px 20px; 
                text-align: center; 
            }
            .header h1 { 
                margin: 0 0 10px 0; 
                font-size: 28px; 
                font-weight: 700; 
            }
            .header h2 { 
                margin: 0; 
                font-size: 18px; 
                opacity: 0.9; 
                font-weight: 400; 
            }
            .content { 
                padding: 30px 20px; 
            }
            .summary { 
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
                border-radius: 10px; 
                padding: 25px; 
                margin: 20px 0; 
                border-left: 4px solid #007bff;
            }
            .summary h3 { 
                margin: 0 0 20px 0; 
                color: #495057; 
                font-size: 20px; 
            }
            .stats { 
                display: flex; 
                justify-content: space-around; 
                margin: 20px 0; 
                flex-wrap: wrap;
            }
            .stat { 
                text-align: center; 
                padding: 10px; 
                min-width: 120px;
            }
            .stat-value { 
                font-size: 32px; 
                font-weight: bold; 
                color: #007bff; 
                margin-bottom: 5px;
                display: block;
            }
            .stat-label { 
                font-size: 12px; 
                color: #6c757d; 
                text-transform: uppercase; 
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            .vendor-section { 
                margin: 25px 0; 
            }
            .vendor-section h3 { 
                color: #495057; 
                border-bottom: 2px solid #e9ecef; 
                padding-bottom: 10px; 
                margin-bottom: 15px;
            }
            .vendor-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 15px 0; 
                border-radius: 8px; 
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .vendor-table th { 
                padding: 15px 12px; 
                background: #495057; 
                color: white; 
                text-align: left; 
                font-weight: 600;
                font-size: 14px;
            }
            .vendor-table td { 
                padding: 12px; 
                border-bottom: 1px solid #e9ecef; 
                text-align: left; 
            }
            .vendor-table tr:last-child td { 
                border-bottom: none; 
            }
            .vendor-table tr:nth-child(even) { 
                background-color: #f8f9fa; 
            }
            .payment-methods { 
                background: #fff3cd; 
                border: 1px solid #ffeaa7; 
                border-radius: 8px; 
                padding: 20px; 
                margin: 20px 0;
            }
            .payment-methods h3 { 
                margin: 0 0 15px 0; 
                color: #856404; 
            }
            .payment-methods ul { 
                margin: 0; 
                padding-left: 20px; 
            }
            .payment-methods li { 
                margin: 8px 0; 
                color: #856404; 
                font-weight: 500;
            }
            .footer { 
                background: #495057; 
                color: white; 
                padding: 25px 20px; 
                text-align: center; 
                font-size: 14px; 
            }
            .footer p { 
                margin: 5px 0; 
            }
            .footer .company-name { 
                font-weight: bold; 
                font-size: 16px; 
                margin-bottom: 10px;
            }
            .confidential { 
                background: #dc3545; 
                color: white; 
                padding: 8px 15px; 
                border-radius: 20px; 
                font-size: 12px; 
                display: inline-block; 
                margin-top: 10px;
                font-weight: 600;
            }
            
            @media (max-width: 600px) {
                .stats { 
                    flex-direction: column; 
                    gap: 15px; 
                }
                .stat { 
                    border-bottom: 1px solid #e9ecef; 
                    padding-bottom: 15px; 
                }
                .stat:last-child { 
                    border-bottom: none; 
                }
                .vendor-table { 
                    font-size: 14px; 
                }
                .vendor-table th, .vendor-table td { 
                    padding: 8px; 
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 RAPPORT DE CAISSE QUOTIDIEN</h1>
                <h2>MyConfort - ${data.date}</h2>
            </div>
            
            <div class="content">
                <div class="summary">
                    <h3>📈 Résumé de la journée</h3>
                    <div class="stats">
                        <div class="stat">
                            <span class="stat-value">${this.formatCurrency(totalCA)}</span>
                            <div class="stat-label">CHIFFRE D'AFFAIRES</div>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${salesCount}</span>
                            <div class="stat-label">VENTES</div>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${this.formatCurrency(avgBasket)}</span>
                            <div class="stat-label">PANIER MOYEN</div>
                        </div>
                    </div>
                </div>

                ${data.vendors && data.vendors.length > 0 ? `
                <div class="vendor-section">
                    <h3>👥 Performances par vendeuse</h3>
                    <table class="vendor-table">
                        <thead>
                            <tr>
                                <th>Vendeuse</th>
                                <th>Chiffre d'affaires</th>
                                <th>% du total</th>
                                <th>Ventes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.vendors.map(vendor => {
                              const percentage = totalCA > 0 ? ((vendor.sales || 0) / totalCA * 100) : 0;
                              return `
                              <tr>
                                  <td><strong>${vendor.name}</strong></td>
                                  <td>${this.formatCurrency(vendor.sales || 0)}</td>
                                  <td>${percentage.toFixed(1)}%</td>
                                  <td>${vendor.totalSales || 0}</td>
                              </tr>
                              `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                ` : ''}

                ${data.paymentMethods && Object.keys(data.paymentMethods).length > 0 ? `
                <div class="payment-methods">
                    <h3>💳 Répartition des paiements</h3>
                    <ul>
                        ${Object.entries(data.paymentMethods).map(([method, amount]) => {
                          const percentage = totalCA > 0 ? ((amount || 0) / totalCA * 100) : 0;
                          return `<li><strong>${method}:</strong> ${this.formatCurrency(amount || 0)} (${percentage.toFixed(1)}%)</li>`;
                        }).join('')}
                    </ul>
                </div>
                ` : ''}

                <div style="background: #e8f5e8; border: 1px solid #28a745; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <h3 style="margin: 0 0 10px 0; color: #155724;">✅ Système MyConfort</h3>
                    <p style="margin: 0; color: #155724; font-weight: 500;">
                        Rapport généré automatiquement par votre système de caisse intelligent
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <div class="company-name">MyConfort - Système de Caisse Automatisé</div>
                <p>Rapport généré automatiquement le ${new Date().toLocaleString('fr-FR')}</p>
                <p>Version 1.0 - Tous droits réservés</p>
                <div class="confidential">DOCUMENT CONFIDENTIEL</div>
            </div>
        </div>
    </body>
    </html>
    `;
  }
  
  async generatePDFBuffer(data) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      const htmlContent = this.generateHTMLReport(data);
      
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true
      });
      
      return pdfBuffer;
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
  
  prepareReportData(appData) {
    const today = new Date().toLocaleDateString('fr-FR');
    
    return {
      date: today,
      totalSales: appData.totalSales || 0,
      salesCount: appData.salesCount || 0,
      vendors: appData.vendors || [],
      paymentMethods: appData.paymentMethods || {},
      detailedSales: appData.detailedSales || []
    };
  }
  
  async performAutomaticRAZ(appData) {
    console.log('🔄 Exécution RAZ automatique...');
    
    // Simulation de la RAZ - adapter selon votre architecture
    if (appData.reset) {
      await appData.reset();
    }
    
    console.log('✅ RAZ automatique effectuée');
    return true;
  }
  
  formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  }
  
  getScheduledJobs() {
    return Array.from(this.scheduledJobs.keys());
  }
  
  stopAllJobs() {
    for (const [jobId, job] of this.scheduledJobs) {
      job.destroy();
      console.log(`🛑 Job ${jobId} arrêté`);
    }
    this.scheduledJobs.clear();
  }
}

module.exports = EmailService;
