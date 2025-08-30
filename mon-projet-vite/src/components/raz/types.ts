import type { Sale, Vendor } from '../../types';
import type { Invoice } from '@/services/syncService';
import type { SessionDB } from '@/types';
import type { PendingPayment } from '@/services/pendingPaymentsService';

// Props principaux du composant RAZ
export interface FeuilleDeRAZProProps {
  sales: Sale[];
  invoices: Invoice[];
  vendorStats: Vendor[];
  exportDataBeforeReset: () => void;
  executeRAZ: () => void;
}

// Types pour WhatsApp
export interface ReportData {
  date: string;
  totalSales: number;
  salesCount: number;
  topVendor: string;
  topVendorSales: number;
  avgSale: number;
  paymentBreakdown: {
    [key: string]: number;
  };
}

export interface WhatsAppConfig {
  managerNumber: string;
  teamNumbers: string[];
  autoSendEnabled: boolean;
  sendTime: string;
  includeImage: boolean;
  businessNumber: string;
}

// Vendeurs avec détails calculés
export interface VendeusesAvecDetail extends Vendor {
  detailPaiements: { carte: number; especes: number; cheque: number; mixte: number; };
  totalCalcule: number;
  nbVentesCalcule: number;
}

// États du workflow sécurisé
export interface WorkflowSecurityState {
  isViewed: boolean;
  isPrinted: boolean;
  isEmailSent: boolean;
  workflowCompleted: boolean;
}

// États de la session
export interface SessionState {
  session: SessionDB | undefined;
  sessLoading: boolean;
  openingSession: boolean;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  savingEvent: boolean;
  eventSaved: boolean;
  hasUnsavedEventChanges: boolean;
  canEndSessionToday: boolean;
}

// Calculs financiers
export interface CalculsFinanciers {
  parPaiement: { carte: number; especes: number; cheque: number; mixte: number; };
  totalTTC: number;
  totalTVA: number;
  totalHT: number;
  nbVentes: number;
  venteursAvecDetail: VendeusesAvecDetail[];
}
