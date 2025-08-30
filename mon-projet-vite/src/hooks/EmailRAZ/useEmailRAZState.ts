import { useState, useEffect, useMemo } from 'react';
import type { EmailConfig, DailySummary, VendorStat, Sale, EmailStatus, ActionStatus } from '../../types';

const STORAGE_KEY = 'myconfort-email-config';

export function useEmailRAZState() {
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

  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [vendorStats, setVendorStats] = useState<VendorStat[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'manual' | 'automatic' | 'config'>('manual');
  const [showPreview, setShowPreview] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [lastAction, setLastAction] = useState<ActionStatus | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        setConfig((prev) => ({ ...prev, ...saved }));
      } catch (e) {
        console.error('Erreur parsing config email:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    const newErrors: string[] = [];
    if (!config.recipientEmail) newErrors.push('Email destinataire requis');
    if (config.subject.trim() === '') newErrors.push('Sujet requis');
    setErrors(newErrors);
  }, [config]);

  const isValid = useMemo(() => errors.length === 0, [errors]);

  return {
    config,
    setConfig,
    summary,
    setSummary,
    vendorStats,
    setVendorStats,
    sales,
    setSales,
    isSending,
    setIsSending,
    errors,
    isValid,
    activeTab,
    setActiveTab,
    showPreview,
    setShowPreview,
    emailStatus,
    setEmailStatus,
    lastAction,
    setLastAction,
    pdfUrl,
    setPdfUrl,
  };
}
