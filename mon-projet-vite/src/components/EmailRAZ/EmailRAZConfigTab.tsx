import React from 'react';
import type { EmailConfig } from '../../types';

interface EmailRAZConfigTabProps {
  config: EmailConfig;
  setConfig: (config: EmailConfig) => void;
  errors: string[];
}

export const EmailRAZConfigTab: React.FC<EmailRAZConfigTabProps> = ({ 
  config, 
  setConfig, 
  errors 
}) => {
  const handleChange = (key: keyof EmailConfig, value: string | boolean) => {
    setConfig({ ...config, [key]: value });
  };

  return (
    <div role="tabpanel" id="panel-config" aria-labelledby="tab-config">
      <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>⚙️ Configuration Email</h3>

      <div style={{ display: 'grid', gap: '20px', maxWidth: '500px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            📧 Email destinataire *
          </label>
          <input
            type="email"
            value={config.recipientEmail}
            onChange={(e) => handleChange('recipientEmail', e.target.value)}
            placeholder="exemple@myconfort.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            📝 Sujet de l'email
          </label>
          <input
            type="text"
            value={config.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            placeholder="Rapport de Caisse MyConfort - [DATE]"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <small style={{ color: '#6c757d', fontSize: '12px' }}>
            Utilisez [DATE] pour insérer automatiquement la date
          </small>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            📥 Emails en copie (CC)
          </label>
          <input
            type="text"
            value={config.ccEmails}
            onChange={(e) => handleChange('ccEmails', e.target.value)}
            placeholder="email1@myconfort.com, email2@myconfort.com"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>📎 Options d'envoi</h4>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={config.attachPDF}
              onChange={(e) => handleChange('attachPDF', e.target.checked)}
            />
            <span>Joindre le rapport en PDF</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={config.includeDetails}
              onChange={(e) => handleChange('includeDetails', e.target.checked)}
            />
            <span>Inclure les détails des ventes (max 50)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={config.attachData}
              onChange={(e) => handleChange('attachData', e.target.checked)}
            />
            <span style={{ color: '#6c757d' }}>Joindre les données brutes (bientôt)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={config.performRAZ}
              onChange={(e) => handleChange('performRAZ', e.target.checked)}
            />
            <span style={{ color: '#dc3545', fontWeight: '600' }}>
              Effectuer une RAZ après envoi (Attention!)
            </span>
          </label>
        </div>
      </div>

      {errors.length > 0 && (
        <div
          style={{
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            padding: '12px',
            marginTop: '20px',
          }}
          role="alert"
        >
          <strong style={{ color: '#721c24' }}>⚠️ Erreurs de configuration :</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            {errors.map((error, index) => (
              <li key={index} style={{ color: '#721c24' }}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
