import type { Sale, VendorStat, DailySummary, EmailConfig, EmailStatus, ActionStatus } from '../../types';

// Types spécifiques au système EmailRAZ
export type Tabs = 'manual' | 'automatic' | 'config';

export type SendConfig = EmailConfig & { 
  isManual?: boolean; 
  isTest?: boolean; 
};

// Props du composant principal
export interface EmailRAZSystemProps {
  sales?: Sale[];
  vendorStats?: VendorStat[];
  onRAZComplete?: (() => void) | null;
  className?: string;
}

// État du système EmailRAZ
export interface EmailRAZState {
  emailConfig: EmailConfig;
  activeTab: Tabs;
  isSending: boolean;
  lastAction: ActionStatus | null;
  emailStatus: EmailStatus | null;
  configErrors: string[];
  showPdfPreview: boolean;
  pdfUrl: string | null;
}

// Props des panneaux
export interface EmailRAZPanelProps {
  emailConfig: EmailConfig;
  setEmailConfig: React.Dispatch<React.SetStateAction<EmailConfig>>;
  isSending: boolean;
  configErrors: string[];
  onSendManual: () => void;
  onTestEmail: () => void;
  onPreviewEmail: () => void;
  onExportPDF: () => void;
  onPreviewPDF: () => void;
  onScheduleAutomatic: () => void;
  dailySummary: DailySummary;
  vendorStats: VendorStat[];
  todaySales: Sale[];
  emailStatus?: EmailStatus | null;
}

// Props pour les onglets
export interface EmailRAZTabsProps {
  activeTab: Tabs;
  setActiveTab: (tab: Tabs) => void;
}

// Props pour la modale d'aperçu PDF
export interface EmailRAZPreviewModalProps {
  showPdfPreview: boolean;
  pdfUrl: string | null;
  onClose: () => void;
}

// Constantes
export const STORAGE_KEY = 'myconfort-email-config';
export const PRINT_ELEMENT_ID = 'email-raz-print-root';
