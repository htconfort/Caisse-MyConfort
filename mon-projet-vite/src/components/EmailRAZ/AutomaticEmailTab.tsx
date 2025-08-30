import React from 'react';
import { Bell } from 'lucide-react';
import { EmailConfig } from '../../types';

interface AutomaticEmailTabProps {
  config: EmailConfig;
  setConfig: (config: EmailConfig) => void;
  isSending: boolean;
  onScheduleAutomatic: () => void;
}

export const AutomaticEmailTab: React.FC<AutomaticEmailTabProps> = ({
  config,
  setConfig,
  isSending,
  onScheduleAutomatic,
}) => {
  return (
    <div role="tabpanel" id="panel-automatic" aria-labelledby="tab-automatic">
      <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>🔄 Envoi Automatique</h3>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
          <input
            type="checkbox"
            checked={config.autoSendEnabled}
            onChange={(e) => setConfig({ ...config, autoSendEnabled: e.target.checked })}
          />
          <span style={{ fontWeight: '600' }}>Activer l'envoi automatique quotidien</span>
        </label>

        {config.autoSendEnabled && (
          <div style={{ marginLeft: '26px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Heure d'envoi :
            </label>
            <input
              type="time"
              value={config.autoSendTime}
              onChange={(e) => setConfig({ ...config, autoSendTime: e.target.value })}
              style={{
                padding: '8px 12px',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
        )}
      </div>

      <button
        onClick={onScheduleAutomatic}
        disabled={isSending || !config.autoSendEnabled}
        style={{
          padding: '12px 24px',
          background: isSending ? '#6c757d' : '#6f42c1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: isSending ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Bell size={16} />
        {isSending ? 'Configuration...' : 'Configurer Envoi Auto'}
      </button>
    </div>
  );
};
