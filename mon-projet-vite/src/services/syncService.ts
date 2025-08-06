/**
 * Service de synchronisation avec N8N pour les factures
 * Gère la communication bidirectionnelle entre Caisse et Facturation
 */

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  items: InvoiceItem[];
  totalHT: number;
  totalTTC: number;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'cancelled';
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
  vendorId?: string;
  vendorName?: string;
  notes?: string;
  // Détails du règlement
  paymentDetails?: PaymentDetails;
}

export interface PaymentDetails {
  method: 'cash' | 'card' | 'check' | 'transfer' | 'multi' | 'installments';
  status: 'pending' | 'partial' | 'completed' | 'overdue';
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  // Spécifique aux chèques
  checkDetails?: {
    totalChecks: number;
    checksReceived: number;
    checksRemaining: number;
    nextCheckDate?: Date;
    checkAmounts?: number[];
    characteristics?: string; // ex: "3 chèques de 400€"
  };
  // Spécifique aux virements/CB
  transactionDetails?: {
    reference?: string;
    bankName?: string;
    accountLast4?: string;
  };
  // Échelonnement / Paiement multiple
  installments?: {
    totalInstallments: number;
    completedInstallments: number;
    nextPaymentDate?: Date;
    installmentAmount: number;
  };
  // Notes sur le règlement
  paymentNotes?: string;
}

export interface InvoiceItem {
  id: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'available' | 'delivered' | 'cancelled';
  stockReserved?: boolean;
}

export interface StockItem {
  productName: string;
  category: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  pendingDelivery: number;
  lastUpdated: Date;
}

export interface SyncStats {
  totalInvoices: number;
  pendingInvoices: number;
  partialInvoices: number;
  lastSyncTime: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
}

class SyncService {
  private baseUrl: string;
  private isOnline: boolean = navigator.onLine;
  private syncInterval: number | null = null;
  private listeners: Array<(data: any) => void> = [];

  constructor() {
    // URL adaptée selon l'environnement
    const isDevelopment = import.meta.env.DEV;
    const forceApiTest = localStorage.getItem('n8n-test-mode') === 'true';
    
    if (isDevelopment && !forceApiTest) {
      // En développement normal : utiliser le proxy Vite
      this.baseUrl = '/api/n8n';
    } else {
      // En mode test ou production : URL directe N8N (URL CORRECTE!)
      this.baseUrl = 'https://n8n.srv765811.hstgr.cloud/webhook';
    }
    
    console.log(`🔧 SyncService mode: ${isDevelopment ? 'DÉVELOPPEMENT' : 'PRODUCTION'}`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    console.log(`🧪 Mode test N8N: ${forceApiTest ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    
    // Écouter les changements de connectivité
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.startAutoSync();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.stopAutoSync();
    });
  }

  /**
   * Récupère toutes les factures depuis N8N
   */
  async getInvoices(): Promise<Invoice[]> {
    try {
      if (!this.isOnline) {
        return this.getCachedInvoices();
      }

      // Force le test de l'API N8N (même en développement)
      const forceApiTest = localStorage.getItem('n8n-test-mode') === 'true';
      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment && !forceApiTest) {
        console.log('🧪 Mode développement : utilisation des données de démo');
        console.log('💡 Pour tester N8N, tapez: localStorage.setItem("n8n-test-mode", "true"); puis rechargez');
        return this.getDemoInvoices();
      }

      // MODE PRODUCTION ou TEST API : Essayer de récupérer depuis N8N
      const demoData = this.getDemoInvoices();
      console.log(`🔗 Test API N8N sur: ${this.baseUrl}/sync/invoices`);
      
      try {
        const response = await fetch(`${this.baseUrl}/sync/invoices`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const invoices = this.transformInvoicesData(data);
          
          // Mise en cache pour le mode offline
          this.cacheInvoices(invoices);
          
          return invoices;
        } else {
          console.warn('N8N non disponible, utilisation des données de démo');
          return demoData;
        }
      } catch (networkError) {
        console.warn('Erreur réseau N8N, utilisation des données de démo:', networkError);
        return demoData;
      }

    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      
      // Fallback vers le cache en cas d'erreur
      return this.getCachedInvoices();
    }
  }

  /**
   * Met à jour le statut d'un produit dans une facture
   */
  async updateItemStatus(invoiceId: string, itemId: string, newStatus: InvoiceItem['status']): Promise<boolean> {
    try {
      if (!this.isOnline) {
        // En mode offline, stocker la modification pour sync ultérieure
        this.queueOfflineUpdate({ invoiceId, itemId, newStatus, timestamp: Date.now() });
        return true;
      }

      const response = await fetch(`${this.baseUrl}/sync/status-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          invoiceId,
          itemId,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          source: 'caisse'
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Notifier les listeners du changement
      this.notifyListeners({ type: 'item_status_updated', invoiceId, itemId, newStatus });
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      
      // En cas d'erreur, essayer de stocker pour retry
      this.queueOfflineUpdate({ invoiceId, itemId, newStatus, timestamp: Date.now(), error: true });
      return false;
    }
  }

  /**
   * Calcule et retourne les statistiques des stocks
   */
  async getStockOverview(): Promise<StockItem[]> {
    const invoices = await this.getInvoices();
    const stockMap = new Map<string, StockItem>();

    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const key = `${item.category}-${item.productName}`;
        
        if (!stockMap.has(key)) {
          stockMap.set(key, {
            productName: item.productName,
            category: item.category,
            totalQuantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            pendingDelivery: 0,
            lastUpdated: new Date()
          });
        }

        const stock = stockMap.get(key)!;
        
        switch (item.status) {
          case 'pending':
            stock.reservedQuantity += item.quantity;
            break;
          case 'available':
            stock.availableQuantity += item.quantity;
            break;
          case 'delivered':
            stock.pendingDelivery += item.quantity;
            break;
        }
        
        stock.totalQuantity += item.quantity;
      });
    });

    return Array.from(stockMap.values()).sort((a, b) => 
      a.category.localeCompare(b.category) || a.productName.localeCompare(b.productName)
    );
  }

  /**
   * Obtient les statistiques de synchronisation
   */
  async getSyncStats(): Promise<SyncStats> {
    const invoices = await this.getInvoices();
    const lastSyncTime = localStorage.getItem('lastSyncTime');
    
    return {
      totalInvoices: invoices.length,
      pendingInvoices: invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length,
      partialInvoices: invoices.filter(inv => inv.status === 'partial').length,
      lastSyncTime: lastSyncTime ? new Date(lastSyncTime) : null,
      syncStatus: 'idle'
    };
  }

  /**
   * Démarre la synchronisation automatique
   */
  startAutoSync(intervalMs: number = 30000): void {
    this.stopAutoSync();
    
    if (this.isOnline) {
      this.syncInterval = window.setInterval(() => {
        this.getInvoices().then(() => {
          localStorage.setItem('lastSyncTime', new Date().toISOString());
        });
      }, intervalMs);
    }
  }

  /**
   * Arrête la synchronisation automatique
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Ajoute un listener pour les événements de sync
   */
  addListener(callback: (data: any) => void): () => void {
    this.listeners.push(callback);
    
    // Retourne une fonction de cleanup
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Nettoie les ressources du service
   */
  cleanup(): void {
    this.stopAutoSync();
    this.listeners = [];
  }

  // ===== MÉTHODES PRIVÉES =====

  private transformInvoicesData(response: any): Invoice[] {
    // Gérer la réponse N8N qui contient { success: true, invoices: [...] }
    const rawData = response.invoices || response || [];
    
    return rawData.map((item: any) => ({
      id: item.id || item.invoiceNumber || `inv-${Date.now()}`,
      number: item.invoiceNumber || item.number || `INV-${Date.now()}`,
      clientName: item.client?.name || item.clientName || 'Client inconnu',
      clientEmail: item.client?.email || item.clientEmail,
      clientPhone: item.client?.phone || item.clientPhone,
      items: (item.products || item.items || []).map((rawItem: any) => ({
        id: rawItem.id || `item-${Date.now()}`,
        productName: rawItem.name || rawItem.productName || 'Produit',
        category: rawItem.category || 'Divers',
        quantity: Number(rawItem.quantity) || 1,
        unitPrice: Number(rawItem.unitPrice) || 0,
        totalPrice: Number(rawItem.totalPrice) || 0,
        status: this.mapDeliveryStatus(rawItem.deliveryStatus) || 'pending',
        stockReserved: rawItem.deliveryStatus === 'a_livrer'
      })),
      totalHT: Number(item.totalHT) || Number(item.total_ht) || 0,
      totalTTC: Number(item.totalTTC) || Number(item.total_ttc) || 0,
      status: this.mapInvoiceStatus(item.status) || 'draft',
      dueDate: new Date(item.dueDate || item.due_date || Date.now()),
      createdAt: new Date(item.createdAt || item.created_at || Date.now()),
      updatedAt: new Date(item.lastUpdate || item.updated_at || Date.now()),
      vendorId: item.advisor || item.vendor_id,
      vendorName: item.advisor || item.vendor_name,
      notes: item.notes || `Événement: ${item.eventLocation || 'Non spécifié'}`,
      // Extraction des détails de règlement depuis N8N
      paymentDetails: this.extractPaymentDetails(item)
    }));
  }

  private extractPaymentDetails(item: any): PaymentDetails | undefined {
    const payment = item.payment || item.paymentDetails || item.reglement;
    if (!payment) return undefined;

    const paymentDetails: PaymentDetails = {
      method: this.mapPaymentMethod(payment.method || payment.type || payment.mode),
      status: this.mapPaymentStatus(payment.status || payment.etat),
      totalAmount: Number(payment.totalAmount || payment.montant_total || item.totalTTC || 0),
      paidAmount: Number(payment.paidAmount || payment.montant_paye || 0),
      remainingAmount: Number(payment.remainingAmount || payment.montant_restant || 0),
      paymentNotes: payment.notes || payment.remarques
    };

    // Gestion spécifique des chèques
    if (payment.method === 'cheque' || payment.method === 'check' || payment.type === 'cheque') {
      paymentDetails.checkDetails = {
        totalChecks: Number(payment.nombreCheques || payment.total_checks || 0),
        checksReceived: Number(payment.chequesRecus || payment.checks_received || 0),
        checksRemaining: Number(payment.chequesRestants || payment.checks_remaining || 0),
        nextCheckDate: payment.prochaineCheque ? new Date(payment.prochaineCheque) : undefined,
        checkAmounts: payment.montantsCheques || payment.check_amounts || [],
        characteristics: payment.caracteristiques || payment.characteristics
      };
    }

    // Gestion des virements/CB
    if (payment.method === 'virement' || payment.method === 'transfer' || payment.method === 'card') {
      paymentDetails.transactionDetails = {
        reference: payment.reference || payment.transactionId,
        bankName: payment.banque || payment.bank_name,
        accountLast4: payment.derniers4Chiffres || payment.last_4_digits
      };
    }

    // Gestion des échelonnements
    if (payment.echelonnement || payment.installments) {
      const installmentData = payment.echelonnement || payment.installments;
      paymentDetails.installments = {
        totalInstallments: Number(installmentData.nombreEcheances || installmentData.total_installments || 0),
        completedInstallments: Number(installmentData.echeancesPayees || installmentData.completed_installments || 0),
        nextPaymentDate: installmentData.prochaineEcheance ? new Date(installmentData.prochaineEcheance) : undefined,
        installmentAmount: Number(installmentData.montantEcheance || installmentData.installment_amount || 0)
      };
    }

    return paymentDetails;
  }

  private mapPaymentMethod(method: string): PaymentDetails['method'] {
    switch (method?.toLowerCase()) {
      case 'cheque':
      case 'chèque':
      case 'check':
        return 'check';
      case 'carte':
      case 'card':
      case 'cb':
        return 'card';
      case 'especes':
      case 'espèces':
      case 'cash':
        return 'cash';
      case 'virement':
      case 'transfer':
        return 'transfer';
      case 'echelonnement':
      case 'installments':
        return 'installments';
      case 'multiple':
      case 'multi':
        return 'multi';
      default:
        return 'cash';
    }
  }

  private mapPaymentStatus(status: string): PaymentDetails['status'] {
    switch (status?.toLowerCase()) {
      case 'paye':
      case 'payé':
      case 'paid':
      case 'completed':
      case 'termine':
      case 'terminé':
        return 'completed';
      case 'partiel':
      case 'partial':
        return 'partial';
      case 'en_retard':
      case 'retard':
      case 'overdue':
        return 'overdue';
      case 'attente':
      case 'pending':
      default:
        return 'pending';
    }
  }

  private mapDeliveryStatus(deliveryStatus: string): InvoiceItem['status'] {
    switch (deliveryStatus) {
      case 'a_livrer': return 'pending';
      case 'emporte': return 'delivered';
      case 'livre': return 'delivered';
      case 'pending': return 'pending';
      default: return 'available';
    }
  }

  private mapInvoiceStatus(status: string): Invoice['status'] {
    switch (status) {
      case 'to_deliver': return 'sent';
      case 'partial': return 'partial';
      case 'delivered': return 'paid';
      case 'pending': return 'draft';
      default: return 'draft';
    }
  }

  private getCachedInvoices(): Invoice[] {
    try {
      const cached = localStorage.getItem('cachedInvoices');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  private cacheInvoices(invoices: Invoice[]): void {
    try {
      localStorage.setItem('cachedInvoices', JSON.stringify(invoices));
    } catch (error) {
      console.warn('Impossible de mettre en cache les factures:', error);
    }
  }

  private queueOfflineUpdate(update: any): void {
    try {
      const queue = JSON.parse(localStorage.getItem('offlineUpdates') || '[]');
      queue.push(update);
      localStorage.setItem('offlineUpdates', JSON.stringify(queue));
    } catch (error) {
      console.warn('Impossible de mettre en file la mise à jour offline:', error);
    }
  }

  private notifyListeners(data: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Erreur dans le listener:', error);
      }
    });
  }

  /**
   * Génère des données de démo pour tester l'interface
   */
  private getDemoInvoices(): Invoice[] {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return [
      {
        id: 'demo-inv-001',
        number: 'FAC-2025-001',
        clientName: 'Sophie Martin',
        clientEmail: 'sophie.martin@email.com',
        clientPhone: '06 12 34 56 78',
        items: [
          {
            id: 'item-001',
            productName: 'Matelas Memory Foam 160x200',
            category: 'Matelas',
            quantity: 1,
            unitPrice: 899.00,
            totalPrice: 899.00,
            status: 'pending',
            stockReserved: true
          },
          {
            id: 'item-002', 
            productName: 'Sommier tapissier 160x200',
            category: 'Accessoires',
            quantity: 1,
            unitPrice: 299.00,
            totalPrice: 299.00,
            status: 'available',
            stockReserved: false
          }
        ],
        totalHT: 998.33,
        totalTTC: 1198.00,
        status: 'sent',
        dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        createdAt: yesterday,
        updatedAt: now,
        vendorId: 'vendor-sophie',
        vendorName: 'Sophie Dubois',
        notes: 'Livraison prévue la semaine prochaine',
        paymentDetails: {
          method: 'check',
          status: 'partial',
          totalAmount: 1198.00,
          paidAmount: 400.00,
          remainingAmount: 798.00,
          checkDetails: {
            totalChecks: 3,
            checksReceived: 1,
            checksRemaining: 2,
            nextCheckDate: nextWeek,
            checkAmounts: [400, 400, 398],
            characteristics: '3 chèques : 400€ + 400€ + 398€'
          },
          paymentNotes: 'Premier chèque encaissé, 2 chèques à venir'
        }
      },
      {
        id: 'demo-inv-002',
        number: 'FAC-2025-002',
        clientName: 'Jean Dupont',
        clientEmail: 'jean.dupont@email.com',
        items: [
          {
            id: 'item-003',
            productName: 'Couette 4 saisons 220x240',
            category: 'Couettes',
            quantity: 1,
            unitPrice: 189.00,
            totalPrice: 189.00,
            status: 'delivered',
            stockReserved: false
          },
          {
            id: 'item-004',
            productName: 'Oreiller ergonomique x2',
            category: 'Oreillers',
            quantity: 2,
            unitPrice: 59.00,
            totalPrice: 118.00,
            status: 'delivered',
            stockReserved: false
          }
        ],
        totalHT: 255.83,
        totalTTC: 307.00,
        status: 'paid',
        dueDate: yesterday,
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: now,
        vendorId: 'vendor-marie',
        vendorName: 'Marie Lefebvre',
        notes: 'Client satisfait, livraison effectuée',
        paymentDetails: {
          method: 'card',
          status: 'completed',
          totalAmount: 307.00,
          paidAmount: 307.00,
          remainingAmount: 0,
          transactionDetails: {
            reference: 'CB-240125-001',
            bankName: 'Crédit Agricole',
            accountLast4: '1234'
          },
          paymentNotes: 'Paiement CB sans contact'
        }
      },
      {
        id: 'demo-inv-003',
        number: 'FAC-2025-003',
        clientName: 'Pierre & Anne Moreau',
        clientEmail: 'contact@moreau-famille.fr',
        clientPhone: '01 23 45 67 89',
        items: [
          {
            id: 'item-005',
            productName: 'Sur-matelas climatisé 140x190',
            category: 'Sur-matelas',
            quantity: 1,
            unitPrice: 449.00,
            totalPrice: 449.00,
            status: 'available',
            stockReserved: true
          },
          {
            id: 'item-006',
            productName: 'Protège-matelas imperméable',
            category: 'Accessoires',
            quantity: 1,
            unitPrice: 39.00,
            totalPrice: 39.00,
            status: 'pending',
            stockReserved: true
          }
        ],
        totalHT: 406.67,
        totalTTC: 488.00,
        status: 'partial',
        dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
        vendorId: 'vendor-lucie',
        vendorName: 'Lucie Petit',
        notes: 'Commande en cours de préparation',
        paymentDetails: {
          method: 'installments',
          status: 'partial',
          totalAmount: 488.00,
          paidAmount: 200.00,
          remainingAmount: 288.00,
          installments: {
            totalInstallments: 3,
            completedInstallments: 1,
            nextPaymentDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            installmentAmount: 162.67
          },
          paymentNotes: 'Paiement en 3 fois : 200€ + 162,67€ + 125,33€'
        }
      }
    ];
  }
}

// Instance singleton
export const syncService = new SyncService();
