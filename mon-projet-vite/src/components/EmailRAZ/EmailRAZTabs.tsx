import React from 'react';
import { Send, Bell, Settings } from 'lucide-react';
import { ManualEmailTab } from './ManualEmailTab';
import { AutomaticEmailTab } from './AutomaticEmailTab';
import { EmailRAZConfigTab } from './EmailRAZConfigTab';
import type { EmailConfig, DailySummary, VendorStat, Sale } from '../../types';

interface EmailRAZTabsProps {
  config: EmailConfig;
  setConfig: (conf: EmailConfig) => void;
  summary: DailySummary | null;
  vendorStats: VendorStat[];
  sales: Sale[];
  isSending: boolean;
  errors: string[];
  activeTab: 'manual' | 'automatic' | 'config';
  setActiveTab: (t: 'manual' | 'automatic' | 'config') => void;
  printElementId: string;
  onSendManualEmail: () => void;
  onTestEmail: () => void;
  onPreviewEmail: () => void;
  onExportPDF: () => void;
  onPreviewPDF: () => void;
  onScheduleAutomatic: () => void;
}

export const EmailRAZTabs: React.FC<EmailRAZTabsProps> = ({
  config,
  setConfig,
  summary,
  vendorStats,
  sales,
  isSending,
  errors,
  activeTab,
  setActiveTab,
  printElementId,
  onSendManualEmail,
  onTestEmail,
  onPreviewEmail,
  onExportPDF,
  onPreviewPDF,
  onScheduleAutomatic,
}) => {
  const tabs = [
    { id: 'manual' as const, label: 'Envoi Manuel', icon: Send },
    { id: 'automatic' as const, label: 'Envoi Automatique', icon: Bell },
    { id: 'config' as const, label: 'Configuration', icon: Settings },
  ];

  return (
    <div>
      {/* Navigation par onglets */}
      <div style={{ display: 'flex', marginBottom: '25px', borderBottom: '2px solid #e9ecef' }} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: activeTab === tab.id ? '#6f42c1' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6c757d',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      <div
        style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '25px',
        }}
      >
        {/* Onglet Envoi Manuel */}
        {activeTab === 'manual' && (
          <ManualEmailTab
            config={config}
            summary={summary}
            vendorStats={vendorStats}
            sales={sales}
            isSending={isSending}
            printElementId={printElementId}
            onSendManualEmail={onSendManualEmail}
            onTestEmail={onTestEmail}
            onPreviewEmail={onPreviewEmail}
            onExportPDF={onExportPDF}
            onPreviewPDF={onPreviewPDF}
          />
        )}

        {/* Onglet Envoi Automatique */}
        {activeTab === 'automatic' && (
          <AutomaticEmailTab
            config={config}
            setConfig={setConfig}
            isSending={isSending}
            onScheduleAutomatic={onScheduleAutomatic}
          />
        )}

        {/* Onglet Configuration */}
        {activeTab === 'config' && (
          <EmailRAZConfigTab 
            config={config} 
            setConfig={setConfig} 
            errors={errors} 
          />
        )}
      </div>
    </div>
  );
};
