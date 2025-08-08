export class EmailService {
  static async sendDailyReport(data, config) {
    try {
      const response = await fetch('/api/email/send-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          reportData: data,
          emailConfig: config,
          timestamp: new Date().toISOString(),
          source: 'myconfort-pos'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('✅ Email envoyé avec succès:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur service email:', error);
      throw new Error(`Échec de l'envoi de l'email: ${error.message}`);
    }
  }
  
  static async scheduleAutomaticEmail(config) {
    try {
      const response = await fetch('/api/email/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          ...config,
          timezone: 'Europe/Paris',
          source: 'myconfort-pos'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('✅ Email automatique programmé:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur programmation email:', error);
      throw new Error(`Échec de la programmation: ${error.message}`);
    }
  }
  
  static async getEmailStatus() {
    try {
      const response = await fetch('/api/email/status', {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ Erreur statut email:', error);
      return { success: false, scheduled: false, error: error.message };
    }
  }
  
  static async testEmailConfiguration(config) {
    try {
      const testData = {
        date: new Date().toLocaleDateString('fr-FR'),
        totalSales: 123.45,
        salesCount: 5,
        vendors: [{ name: 'Test Vendeuse', sales: 123.45 }],
        paymentMethods: { 'CB': 123.45 }
      };
      
      const testConfig = {
        ...config,
        subject: `[TEST] ${config.subject || 'Test MyConfort'}`,
        isTest: true
      };
      
      return await this.sendDailyReport(testData, testConfig);
    } catch (error) {
      throw new Error(`Test email échoué: ${error.message}`);
    }
  }
  
  static generateEmailPreview(data) {
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
  
  static formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  }
  
  static validateEmailConfig(config) {
    const errors = [];
    
    if (!config.recipientEmail) {
      errors.push('Email destinataire requis');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.recipientEmail)) {
      errors.push('Format email destinataire invalide');
    }
    
    if (!config.subject || config.subject.trim().length === 0) {
      errors.push('Sujet de l\'email requis');
    }
    
    if (config.autoSendEnabled && !config.autoSendTime) {
      errors.push('Heure d\'envoi automatique requise');
    }
    
    if (config.autoSendTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.autoSendTime)) {
      errors.push('Format heure invalide (HH:MM)');
    }
    
    return errors;
  }
}
