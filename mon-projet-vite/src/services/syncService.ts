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
    
    // En développement, utiliser automatiquement les données N8N
    if (isDevelopment) {
      // En développement : utiliser le proxy Vite pour N8N
      this.baseUrl = '/api/n8n';
      // Activer automatiquement le mode N8N en développement
      localStorage.setItem('n8n-test-mode', 'true');
    } else {
      // En production : URL directe N8N
      this.baseUrl = 'https://n8n.srv765811.hstgr.cloud/webhook';
    }
    
    console.log(`🔧 SyncService mode: ${isDevelopment ? 'DÉVELOPPEMENT' : 'PRODUCTION'}`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    console.log(`🧪 Mode N8N: ACTIVÉ automatiquement`);
    
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

      // En développement, toujours essayer N8N d'abord
      const isDevelopment = import.meta.env.DEV;
      
      console.log(`🔗 Récupération des factures depuis N8N: ${this.baseUrl}/sync/invoices`);
      
      try {
        const response = await fetch(`${this.baseUrl}/sync/invoices`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ N8N connecté, ${data.count || 0} factures reçues`);
          const invoices = this.transformInvoicesData(data);
          
          // Mise en cache pour le mode offline
          this.cacheInvoices(invoices);
          
          return invoices;
        } else {
          console.warn(`❌ N8N non disponible (${response.status}), utilisation des données de démo`);
          return this.getDemoInvoices();
        }
      } catch (networkError) {
        console.warn('🔌 Erreur réseau N8N, utilisation des données de démo:', networkError);
        return this.getDemoInvoices();
      }

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des factures:', error);
      
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
    
    console.log(`🔍 Transformation de ${rawData.length} entrées de factures N8N`);
    
    // Étape 1: Regrouper les factures par numéro pour éviter les doublons
    const invoiceMap = new Map<string, any>();
    
    rawData.forEach((item: any) => {
      const invoiceNumber = item.invoiceNumber || item.number || `INV-${Date.now()}`;
      
      if (invoiceMap.has(invoiceNumber)) {
        // Facture existante : fusionner les produits
        const existing = invoiceMap.get(invoiceNumber);
        const existingProducts = existing.products || [];
        const newProducts = item.products || [];
        
        // Combiner les produits en évitant les doublons
        const allProducts = [...existingProducts];
        newProducts.forEach((newProduct: any) => {
          const isDuplicate = existingProducts.some((existing: any) => 
            existing.name === newProduct.name && 
            existing.category === newProduct.category
          );
          if (!isDuplicate) {
            allProducts.push(newProduct);
          }
        });
        
        // Mettre à jour avec la liste de produits la plus complète
        existing.products = allProducts;
        
        // Prendre les données les plus récentes (lastUpdate le plus récent)
        const existingUpdate = new Date(existing.lastUpdate || 0);
        const newUpdate = new Date(item.lastUpdate || 0);
        
        if (newUpdate > existingUpdate) {
          existing.totalTTC = item.totalTTC || existing.totalTTC;
          existing.totalHT = item.totalHT || existing.totalHT;
          existing.deposit = item.deposit || existing.deposit;
          existing.remaining = item.remaining || existing.remaining;
          existing.paymentMethod = item.paymentMethod || existing.paymentMethod;
          existing.status = item.status || existing.status;
          existing.lastUpdate = item.lastUpdate || existing.lastUpdate;
        }
        
        console.log(`🔄 Fusion facture ${invoiceNumber}: ${allProducts.length} produits`);
      } else {
        // Nouvelle facture
        invoiceMap.set(invoiceNumber, { ...item });
        console.log(`✅ Nouvelle facture ${invoiceNumber}: ${(item.products || []).length} produits`);
      }
    });
    
    // Étape 2: Transformer les factures fusionnées
    const uniqueInvoices = Array.from(invoiceMap.values());
    console.log(`📊 Résultat: ${uniqueInvoices.length} factures uniques`);
    
    return uniqueInvoices.map((item: any) => ({
      id: item.id || item.invoiceNumber || `inv-${Date.now()}`,
      number: item.invoiceNumber || item.number || `INV-${Date.now()}`,
      clientName: item.client?.name || item.clientName || 'Client inconnu',
      clientEmail: item.client?.email || item.clientEmail,
      clientPhone: item.client?.phone || item.clientPhone,
      items: (item.products || []).map((rawItem: any, index: number) => ({
        id: `${item.invoiceNumber || 'inv'}-item-${index}`,
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
    // Extraire depuis le champ paymentMethod qui contient les vraies informations
    const paymentMethodText = item.paymentMethod || '';
    const totalAmount = Number(item.totalTTC) || Number(item.totalPrice) || 0;
    const deposit = Number(item.deposit) || 0;
    const remaining = Number(item.remaining) || (totalAmount - deposit);

    // Si pas d'info de paiement, retourner undefined
    if (!paymentMethodText) return undefined;

    console.log(`💳 Analyse du règlement: "${paymentMethodText}"`);

    const paymentDetails: PaymentDetails = {
      method: 'cash', // sera déterminé ci-dessous
      status: this.mapPaymentStatus(item.status),
      totalAmount: totalAmount,
      paidAmount: deposit,
      remainingAmount: remaining,
      paymentNotes: paymentMethodText
    };

    // Analyser le texte du paymentMethod pour extraire les détails
    const lowerText = paymentMethodText.toLowerCase();

    // Détection des chèques
    if (lowerText.includes('chèque') || lowerText.includes('cheque')) {
      paymentDetails.method = 'check';
      
      // Extraire le nombre de chèques depuis le texte
      // Ex: "Chèques à venir - 9 chèques à venir de 133.89€ chacun"
      const chequesMatch = paymentMethodText.match(/(\d+)\s*chèques?\s*à?\s*venir/i);
      const amountMatch = paymentMethodText.match(/de\s*([\d,]+\.?\d*)\s*€/i);
      
      if (chequesMatch) {
        const totalChecks = parseInt(chequesMatch[1]);
        const checkAmount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
        
        paymentDetails.checkDetails = {
          totalChecks: totalChecks,
          checksReceived: 0, // Aucun reçu pour les "chèques à venir"
          checksRemaining: totalChecks,
          checkAmounts: new Array(totalChecks).fill(checkAmount),
          characteristics: `${totalChecks} chèques de ${checkAmount}€ chacun`
        };
      }
    }
    // Détection CB/Carte
    else if (lowerText.includes('carte') || lowerText.includes('cb') || lowerText.includes('bleue')) {
      paymentDetails.method = 'card';
      paymentDetails.transactionDetails = {
        reference: `CB-${item.invoiceNumber || Date.now()}`
      };
    }
    // Détection virement
    else if (lowerText.includes('virement')) {
      paymentDetails.method = 'transfer';
      paymentDetails.transactionDetails = {
        reference: `VIR-${item.invoiceNumber || Date.now()}`
      };
    }
    // Détection espèces
    else if (lowerText.includes('espèce')) {
      paymentDetails.method = 'cash';
    }
    // Détection échelonnement (si plusieurs montants)
    else if (lowerText.includes('fois') || lowerText.includes('échéance')) {
      paymentDetails.method = 'installments';
      
      const installmentsMatch = paymentMethodText.match(/(\d+)\s*fois/i);
      if (installmentsMatch) {
        const totalInstallments = parseInt(installmentsMatch[1]);
        paymentDetails.installments = {
          totalInstallments: totalInstallments,
          completedInstallments: deposit > 0 ? 1 : 0,
          installmentAmount: remaining / (totalInstallments - (deposit > 0 ? 1 : 0))
        };
      }
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
