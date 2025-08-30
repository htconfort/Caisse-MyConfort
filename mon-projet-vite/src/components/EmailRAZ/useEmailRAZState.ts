import { useState, useEffect, useMemo } from 'react';
import type { EmailConfig, EmailStatus, ActionStatus, Sale, VendorStat, DailySummary } from '../../types';

const STORAGE_KEY = 'myconfort-email-config';

export function useEmailRAZState() {
  // —— Configuration email
  const [config, setConfig] = useState<EmailConfig>({
    recipientEmail: '',
    ccEmails: '',
    subject: 'Rapport de Caisse MyConfort - [DATE]',
    autoSendEnabled: false,
    autoSendTime: '20:00',
    performRAZ: false,
    attachPDF: true,
    attachData: false,
    includeDetails: true,
  });

  // —— États UI
  const [activeTab, setActiveTab] = useState<'manual' | 'automatic' | 'config'>('manual');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<ActionStatus | null>(null);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [configErrors, setConfigErrors] = useState<string[]>([]);

  // —— États PDF
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // —— Données
  const [sales, setSales] = useState<Sale[]>([]);
  const [vendorStats, setVendorStats] = useState<VendorStat[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);

  // —— Charger la configuration sauvegardée
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig) as Partial<EmailConfig>;
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Erreur chargement config email:', error);
      }
    }
  }, []);

  // —— Sauvegarder la configuration
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  // —— Validation de la configuration
  useEffect(() => {
    const errors: string[] = [];
    if (!config.recipientEmail) {
      errors.push('Email destinataire requis');
    }
    if (config.subject.trim() === '') {
      errors.push('Sujet requis');
    }
    if (config.ccEmails && !config.ccEmails.split(',').every(email => email.trim().includes('@'))) {
      errors.push('Format des emails en copie invalide');
    }
    setConfigErrors(errors);
  }, [config]);

  // —— Validation globale
  const isValid = useMemo(() => configErrors.length === 0, [configErrors]);

  // —— Effacer le message flash après 5 secondes
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (lastAction) {
      timeout = setTimeout(() => setLastAction(null), 5000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [lastAction]);

  return {
    // Configuration
    config,
    setConfig,
    
    // États UI
    activeTab,
    setActiveTab,
    isSending,
    setIsSending,
    lastAction,
    setLastAction,
    emailStatus,
    setEmailStatus,
    configErrors,
    isValid,
    
    // États PDF
    showPdfPreview,
    setShowPdfPreview,
    pdfUrl,
    setPdfUrl,
    
    // Données
    sales,
    setSales,
    vendorStats,
    setVendorStats,
    dailySummary,
    setDailySummary,
  };
}
