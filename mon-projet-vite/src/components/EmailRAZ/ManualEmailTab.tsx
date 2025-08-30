import React from 'react';
import { Mail, Send, Download, FileDown, Eye } from 'lucide-react';
import { formatCurrency } from '../../utils/dateUtils';
import type { EmailConfig, DailySummary, VendorStat, Sale } from '../../types';

interface ManualEmailTabProps {
  config: EmailConfig;
  summary: DailySummary | null;
  vendorStats: VendorStat[];
  sales: Sale[];
  isSending: boolean;
  printElementId: string;
  onSendManualEmail: () => void;
  onTestEmail: () => void;
  onPreviewEmail: () => void;
  onExportPDF: () => void;
  onPreviewPDF: () => void;
}

export const ManualEmailTab: React.FC<ManualEmailTabProps> = ({
  config,
  summary,
  vendorStats,
  sales,
  isSending,
  printElementId,
  onSendManualEmail,
  onTestEmail,
  onPreviewEmail,
  onExportPDF,
  onPreviewPDF,
}) => {
  if (!summary) {
    return (
      <div role="tabpanel" id="panel-manual" aria-labelledby="tab-manual">
        <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>📤 Envoi Manuel du Rapport</h3>
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          Aucune donnée disponible pour l'envoi
        </div>
      </div>
    );
  }

  return (
    <div role="tabpanel" id="panel-manual" aria-labelledby="tab-manual">
      <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>📤 Envoi Manuel du Rapport</h3>

      {/* Aperçu des données */}
      <div
        id={printElementId}
        style={{
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Données à envoyer</h4>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
              {formatCurrency(summary.totalSales)}
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>CA du jour</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
              {summary.salesCount}
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>Ventes</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6f42c1' }}>
              {vendorStats.length}
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>Vendeuses</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fd7e14' }}>
              {config.includeDetails ? sales.length : 0}
            </div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>Détails inclus</div>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <button
          onClick={onSendManualEmail}
          disabled={isSending || !config.recipientEmail}
          style={{
            padding: '12px 24px',
            background: isSending ? '#6c757d' : '#28a745',
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
          <Send size={16} />
          {isSending ? 'Envoi...' : 'Envoyer Rapport'}
        </button>

        <button
          onClick={onTestEmail}
          disabled={isSending || !config.recipientEmail}
          style={{
            padding: '12px 24px',
            background: isSending ? '#6c757d' : '#007bff',
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
          <Mail size={16} />
          {isSending ? 'Test...' : 'Test Email'}
        </button>

        <button
          onClick={onPreviewEmail}
          style={{
            padding: '12px 24px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Download size={16} />
          Aperçu
        </button>

        <button
          onClick={onExportPDF}
          style={{
            padding: '12px 24px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileDown size={16} />
          Exporter PDF
        </button>

        <button
          onClick={onPreviewPDF}
          style={{
            padding: '12px 24px',
            background: '#fd7e14',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Eye size={16} />
          Aperçu PDF
        </button>
      </div>
    </div>
  );
};
