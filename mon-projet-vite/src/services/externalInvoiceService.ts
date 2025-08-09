/**
 * Service de réception et gestion des factures externes
 * Gère l'intégration avec des systèmes externes (N8N, APIs, webhooks)
 * Version: 3.8.1 - MyConfort
 */

import type { InvoicePayload } from '../types';

/**
 * Fonction d'insertion idempotente locale pour éviter les doublons
 */
const upsertInvoice = (list: InvoicePayload[], incoming: InvoicePayload): InvoicePayload[] => {
  const idx = list.findIndex(i => i.idempotencyKey === incoming.idempotencyKey);
  if (idx === -1) {
    return [incoming, ...list];
  }
  const merged = { ...list[idx], ...incoming };
  const copy = [...list];
  copy[idx] = merged;
  return copy;
};

/**
 * Configuration du service de factures externes
 */
interface ExternalInvoiceConfig {
  apiEndpoint?: string;
  authToken?: string;
  autoSync?: boolean;
  syncInterval?: number; // en millisecondes
}

/**
 * Service de gestion des factures externes
 */
class ExternalInvoiceService {
  private config: ExternalInvoiceConfig;
  private invoices: InvoicePayload[] = [];
  private syncTimer?: number;

  constructor(config: ExternalInvoiceConfig = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || '/api/invoices',
      authToken: config.authToken || 'default-secret',
      autoSync: config.autoSync ?? true,
      syncInterval: config.syncInterval || 30000, // 30 secondes par défaut
      ...config
    };

    // Charger les factures depuis le localStorage au démarrage
    this.loadFromStorage();

    // Démarrer la synchronisation automatique si activée
    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Réceptionner une nouvelle facture depuis un système externe
   */
  receiveInvoice(payload: InvoicePayload): boolean {
    try {
      console.log(`📄 Réception facture externe: ${payload.invoiceNumber}`, payload);

      // Validation des données essentielles
      if (!payload.invoiceNumber || !payload.invoiceDate || !payload.client.name) {
        console.error('❌ Facture externe invalide - données manquantes');
        return false;
      }

      // Définir la clé d'idempotence si non fournie
      if (!payload.idempotencyKey) {
        payload.idempotencyKey = payload.invoiceNumber;
      }

      // Insertion idempotente (évite les doublons)
      this.invoices = upsertInvoice(this.invoices, payload);

      // Sauvegarder dans le localStorage
      this.saveToStorage();

      console.log(`✅ Facture ${payload.invoiceNumber} intégrée avec succès`);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la réception de facture externe:', error);
      return false;
    }
  }

  /**
   * Réceptionner plusieurs factures en batch
   */
  receiveInvoiceBatch(payloads: InvoicePayload[]): { success: number; errors: number } {
    let success = 0;
    let errors = 0;

    payloads.forEach(payload => {
      if (this.receiveInvoice(payload)) {
        success++;
      } else {
        errors++;
      }
    });

    console.log(`📊 Batch traité: ${success} succès, ${errors} erreurs`);
    return { success, errors };
  }

  /**
   * Obtenir toutes les factures externes
   */
  getAllInvoices(): InvoicePayload[] {
    return [...this.invoices];
  }

  /**
   * Obtenir les factures par date
   */
  getInvoicesByDate(date: Date): InvoicePayload[] {
    const targetDate = date.toISOString().split('T')[0];
    return this.invoices.filter(invoice => 
      invoice.invoiceDate.startsWith(targetDate)
    );
  }

  /**
   * Obtenir les factures d'aujourd'hui
   */
  getTodayInvoices(): InvoicePayload[] {
    return this.getInvoicesByDate(new Date());
  }

  /**
   * Rechercher une facture par numéro
   */
  getInvoiceByNumber(invoiceNumber: string): InvoicePayload | undefined {
    return this.invoices.find(inv => inv.invoiceNumber === invoiceNumber);
  }

  /**
   * Supprimer une facture
   */
  removeInvoice(invoiceNumber: string): boolean {
    const initialLength = this.invoices.length;
    this.invoices = this.invoices.filter(inv => inv.invoiceNumber !== invoiceNumber);
    
    if (this.invoices.length < initialLength) {
      this.saveToStorage();
      console.log(`🗑️ Facture ${invoiceNumber} supprimée`);
      return true;
    }
    return false;
  }

  /**
   * Vider toutes les factures (pour la RAZ)
   */
  clearAllInvoices(): void {
    this.invoices = [];
    this.saveToStorage();
    console.log('🧹 Toutes les factures externes effacées');
  }

  /**
   * Synchronisation avec l'API externe
   */
  async syncWithAPI(): Promise<boolean> {
    try {
      if (!this.config.apiEndpoint) {
        console.warn('⚠️ Aucun endpoint configuré pour la synchronisation');
        return false;
      }

      console.log('🔄 Synchronisation avec l\'API externe...');
      
      const response = await fetch(this.config.apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': this.config.authToken || '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        const result = this.receiveInvoiceBatch(data);
        console.log(`✅ Synchronisation terminée: ${result.success} factures`);
        return true;
      } else if (data.invoices && Array.isArray(data.invoices)) {
        const result = this.receiveInvoiceBatch(data.invoices);
        console.log(`✅ Synchronisation terminée: ${result.success} factures`);
        return true;
      }

      console.log('✅ Synchronisation terminée - aucune nouvelle facture');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      return false;
    }
  }

  /**
   * Démarrer la synchronisation automatique
   */
  startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = window.setInterval(() => {
      this.syncWithAPI();
    }, this.config.syncInterval);

    console.log(`🔄 Synchronisation automatique démarrée (${this.config.syncInterval}ms)`);
  }

  /**
   * Arrêter la synchronisation automatique
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
      console.log('⏹️ Synchronisation automatique arrêtée');
    }
  }

  /**
   * Sauvegarder les factures dans le localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('myconfort_external_invoices', JSON.stringify(this.invoices));
    } catch (error) {
      console.error('❌ Erreur sauvegarde localStorage:', error);
    }
  }

  /**
   * Charger les factures depuis le localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('myconfort_external_invoices');
      if (stored) {
        this.invoices = JSON.parse(stored);
        console.log(`📦 ${this.invoices.length} factures externes chargées depuis le localStorage`);
      }
    } catch (error) {
      console.error('❌ Erreur chargement localStorage:', error);
      this.invoices = [];
    }
  }

  /**
   * Obtenir les statistiques des factures externes
   */
  getStatistics() {
    const todayInvoices = this.getInvoicesByDate(new Date());
    
    return {
      total: this.invoices.length,
      today: todayInvoices.length,
      totalAmount: this.invoices.reduce((sum, inv) => sum + inv.totals.ttc, 0),
      todayAmount: todayInvoices.reduce((sum, inv) => sum + inv.totals.ttc, 0),
      paidCount: this.invoices.filter(inv => inv.payment?.paid).length,
      pendingCount: this.invoices.filter(inv => !inv.payment?.paid).length
    };
  }
}

// Instance singleton du service
export const externalInvoiceService = new ExternalInvoiceService({
  apiEndpoint: '/api/invoices',
  authToken: import.meta.env.VITE_INVOICE_AUTH_TOKEN || 'myconfort-secret-2025',
  autoSync: true,
  syncInterval: 30000 // 30 secondes
});

// Exposer le service dans la console pour les tests (mode développement)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).externalInvoiceService = externalInvoiceService;
  console.log('🔧 ExternalInvoiceService exposé dans window.externalInvoiceService pour les tests');
}

export default ExternalInvoiceService;
