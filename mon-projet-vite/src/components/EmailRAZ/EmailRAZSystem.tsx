import React from 'react';
import { useEmailRAZState } from '../../hooks/EmailRAZ/useEmailRAZState';
import { useEmailRAZActions } from '../../hooks/EmailRAZ/useEmailRAZActions';
import { EmailRAZTabs } from './EmailRAZTabs';
import { Loader } from 'lucide-react';
import type { Sale, VendorStat } from '../../types';

interface Props {
  sales?: Sale[];
  vendorStats?: VendorStat[];
  onRAZComplete?: (() => void) | null;
  className?: string;
}

export const EmailRAZSystem: React.FC<Props> = ({
  sales = [],
  vendorStats = [],
  onRAZComplete = null,
  className = '',
}) => {
  const {
    config,
    setConfig,
    summary,
    vendorStats: hookVendorStats,
    sales: hookSales,
    isSending,
    setIsSending,
    errors,
    activeTab,
    setActiveTab,
    setShowPreview,
    setLastAction,
    setEmailStatus,
    setPdfUrl,
  } = useEmailRAZState();

  const actions = useEmailRAZActions({
    config,
    summary,
    vendorStats: vendorStats.length > 0 ? vendorStats : hookVendorStats,
    sales: sales.length > 0 ? sales : hookSales,
    errors,
    setIsSending,
    setShowPreview,
    setLastAction,
    setEmailStatus,
    setPdfUrl,
    onRAZComplete,
  });

  return (
    <div
      className={className}
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        background: 'white',
      }}
    >
      {isSending && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#007bff',
            marginBottom: '20px',
            padding: '12px',
            background: '#e7f3ff',
            borderRadius: '6px',
            border: '1px solid #b8daff',
          }}
        >
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Envoi en cours...</span>
        </div>
      )}

      <EmailRAZTabs
        config={config}
        setConfig={setConfig}
        summary={summary}
        vendorStats={vendorStats.length > 0 ? vendorStats : hookVendorStats}
        sales={sales.length > 0 ? sales : hookSales}
        isSending={isSending}
        errors={errors}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        printElementId="email-raz-print-root"
        onSendManualEmail={actions.handleSendManualEmail}
        onTestEmail={actions.handleTestEmail}
        onPreviewEmail={actions.handlePreviewEmail}
        onExportPDF={actions.handleExportPDF}
        onPreviewPDF={actions.handlePreviewPDF}
        onScheduleAutomatic={actions.handleScheduleAutomatic}
      />
    </div>
  );
};

export default EmailRAZSystem;
