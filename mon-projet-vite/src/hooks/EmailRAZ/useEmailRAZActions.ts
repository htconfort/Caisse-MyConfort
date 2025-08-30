import { useCallback } from 'react';
import { EmailService } from '../../services/emailService';
import { PrintService } from '../../services/printService';
import { formatDate } from '../../utils/dateUtils';
import type { EmailConfig, DailySummary, VendorStat, Sale, ActionStatus, EmailStatus } from '../../types';

type SendConfig = EmailConfig & { isManual?: boolean; isTest?: boolean };

interface UseEmailRAZActionsProps {
  config: EmailConfig;
  summary: DailySummary | null;
  vendorStats: VendorStat[];
  sales: Sale[];
  errors: string[];
  setIsSending: (b: boolean) => void;
  setShowPreview: (b: boolean) => void;
  setLastAction: (action: ActionStatus | null | ((prev: ActionStatus | null) => ActionStatus | null)) => void;
  setEmailStatus: (status: EmailStatus | null | ((prev: EmailStatus | null) => EmailStatus | null)) => void;
  setPdfUrl: (url: string | null) => void;
  onRAZComplete?: (() => void) | null;
}

const PRINT_ELEMENT_ID = 'email-raz-print-root';

export function useEmailRAZActions({
  config,
  summary,
  vendorStats,
  sales,
  errors,
  setIsSending,
  setShowPreview,
  setLastAction,
  setEmailStatus,
  setPdfUrl,
  onRAZComplete = null,
}: UseEmailRAZActionsProps) {
  
  const handleSendManualEmail = useCallback(async () => {
    try {
      setIsSending(true);
      setLastAction(null);

      if (errors.length > 0) {
        throw new Error('Configuration invalide: ' + errors.join(', '));
      }
      if (!config.recipientEmail) {
        throw new Error('Destinataire requis');
      }
      if (!summary) {
        throw new Error('Aucun résumé disponible');
      }

      // Préparer les données du rapport
      const reportData = {
        ...summary,
        vendors: vendorStats.map((vendor: VendorStat) => ({
          id: vendor.id,
          name: vendor.name,
          dailySales: vendor.dailySales ?? 0,
          totalSales: vendor.totalSales ?? 0,
        })),
        detailedSales: config.includeDetails ? sales.slice(0, 50) : [],
      };

      // Préparer la configuration d'envoi
      const sendConfig: SendConfig = {
        ...config,
        subject: config.subject.replace('[DATE]', formatDate(new Date())),
        isManual: true,
      };

      const result = await EmailService.sendDailyReport(reportData, sendConfig);
      
      if (!result.ok) {
        throw new Error(result.error || 'Erreur inconnue');
      }

      setLastAction({
        type: 'success',
        message: 'Email envoyé avec succès !',
        details: `Envoyé à ${config.recipientEmail}`,
        timestamp: Date.now(),
      });

      // Effectuer RAZ si demandé
      if (config.performRAZ && onRAZComplete) {
        try {
          await EmailService.performRAZ();
          onRAZComplete();
          setLastAction((prev: ActionStatus | null) => prev ? {
            ...prev,
            details: prev.details + ' • RAZ effectuée'
          } : null);
        } catch (razError) {
          console.warn('Erreur RAZ après envoi:', razError);
        }
      }

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur envoi email:', error);
      setLastAction({
        type: 'error',
        message: "Échec de l'envoi de l'email",
        details: errMsg,
        timestamp: Date.now(),
      });
    } finally {
      setIsSending(false);
    }
  }, [errors, config, summary, vendorStats, sales, onRAZComplete, setIsSending, setLastAction]);

  const handleTestEmail = useCallback(async () => {
    try {
      setIsSending(true);
      setLastAction(null);

      if (!config.recipientEmail) {
        throw new Error('Email destinataire requis pour le test');
      }

      const result = await EmailService.testEmailConfiguration(config);
      
      if (!result.ok) {
        throw new Error(result.error || 'Test échoué');
      }

      setLastAction({
        type: 'success',
        message: 'Email de test envoyé !',
        details: 'Vérifiez votre boîte de réception',
        timestamp: Date.now(),
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Test email échoué:', error);
      setLastAction({
        type: 'error',
        message: 'Test email échoué',
        details: errMsg,
        timestamp: Date.now(),
      });
    } finally {
      setIsSending(false);
    }
  }, [config, setIsSending, setLastAction]);

  const handleScheduleAutomatic = useCallback(async () => {
    try {
      setIsSending(true);
      setLastAction(null);

      if (errors.length > 0) {
        throw new Error('Configuration invalide: ' + errors.join(', '));
      }
      if (!config.autoSendEnabled) {
        throw new Error("Active d'abord l'envoi automatique");
      }

      const result = await EmailService.scheduleAutomaticEmail(config);
      
      if (!result.ok) {
        throw new Error(result.error || 'Programmation échouée');
      }

      setLastAction({
        type: 'success',
        message: 'Envoi automatique configuré !',
        details: `Programmé tous les jours à ${config.autoSendTime}`,
        timestamp: Date.now(),
      });

      setEmailStatus((prev: EmailStatus | null) => ({ ...(prev ?? { scheduled: false }), scheduled: true }));
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('❌ Erreur programmation:', error);
      setLastAction({
        type: 'error',
        message: 'Échec de la programmation',
        details: errMsg,
        timestamp: Date.now(),
      });
    } finally {
      setIsSending(false);
    }
  }, [errors, config, setIsSending, setLastAction, setEmailStatus]);

  const handlePreviewEmail = useCallback(() => {
    if (!summary) {
      setLastAction({
        type: 'error',
        message: 'Aucun résumé disponible',
        timestamp: Date.now(),
      });
      return;
    }

    const previewData = {
      ...summary,
      vendors: vendorStats.map((vendor: VendorStat) => ({
        id: vendor.id,
        name: vendor.name,
        dailySales: vendor.dailySales ?? 0,
        totalSales: vendor.totalSales ?? 0,
      })),
    };

    try {
      const emailHTML = EmailService.generateEmailPreview(previewData);
      
      const previewWindow = window.open('', '_blank', 'width=800,height=600');
      if (previewWindow) {
        previewWindow.document.write(emailHTML);
        previewWindow.document.close();
      }
    } catch {
      // Fallback JSON si generateEmailPreview échoue
      const fallbackContent = `
        <!doctype html>
        <html><head><meta charset="utf-8"><title>Aperçu Données</title></head>
        <body style="font-family:monospace;padding:20px;">
        <h2>Aperçu des données (JSON)</h2>
        <pre>${JSON.stringify(previewData, null, 2)}</pre>
        </body></html>
      `;
      
      const previewWindow = window.open('', '_blank', 'width=800,height=600');
      if (previewWindow) {
        previewWindow.document.write(fallbackContent);
        previewWindow.document.close();
      }
    }
  }, [summary, vendorStats, setLastAction]);

  const handleExportPDF = useCallback(async () => {
    try {
      setLastAction({ type: 'info', message: 'Génération du PDF en cours...', timestamp: Date.now() });

      const result = await PrintService.generatePDF({
        elementId: PRINT_ELEMENT_ID,
        fileName: `rapport-caisse-${formatDate(new Date()).replace(/\s/g, '-')}.pdf`,
        format: 'A4',
        marginMm: 15,
        // autoDownload par défaut = true (donc téléchargement direct)
      });

      if (result.ok) {
        setLastAction({ type: 'success', message: 'PDF exporté avec succès !', timestamp: Date.now() });
      } else {
        setLastAction({
          type: 'error',
          message: result.error || 'Erreur lors de l\'export PDF',
          timestamp: Date.now(),
        });
      }
    } catch {
      setLastAction({
        type: 'error',
        message: 'Erreur lors de l\'export PDF',
        timestamp: Date.now(),
      });
    }
  }, [setLastAction]);

  const handlePreviewPDF = useCallback(async () => {
    try {
      setLastAction({ type: 'info', message: 'Génération de l\'aperçu PDF...', timestamp: Date.now() });

      const result = await PrintService.generatePDF({
        elementId: PRINT_ELEMENT_ID,
        fileName: 'apercu-rapport.pdf',
        format: 'A4',
        marginMm: 15,
        autoDownload: false, // 🔑 empêche le téléchargement auto en mode aperçu
      });

      if (result.ok && result.blobUrl) {
        setPdfUrl(result.blobUrl);
        setShowPreview(true);
        setLastAction({ type: 'success', message: 'Aperçu PDF généré !', timestamp: Date.now() });
      } else {
        setLastAction({
          type: 'error',
          message: result.error || 'Erreur lors de la génération de l\'aperçu',
          timestamp: Date.now(),
        });
      }
    } catch {
      setLastAction({
        type: 'error',
        message: 'Erreur lors de la génération de l\'aperçu PDF',
        timestamp: Date.now(),
      });
    }
  }, [setLastAction, setPdfUrl, setShowPreview]);

  const handleClosePdfPreview = useCallback((pdfUrl: string | null) => {
    setShowPreview(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [setShowPreview, setPdfUrl]);

  return {
    handleSendManualEmail,
    handleTestEmail,
    handleScheduleAutomatic,
    handlePreviewEmail,
    handleExportPDF,
    handlePreviewPDF,
    handleClosePdfPreview,
    PRINT_ELEMENT_ID,
  };
}
