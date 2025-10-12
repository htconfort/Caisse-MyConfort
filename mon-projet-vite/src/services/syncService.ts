/**
 * Service de synchronisation avec N8N pour les factures
 * Gère la communication bidirectionnelle entre Caisse et Facturation
 * NOUVEAU : Déduction automatique du stock lors de l'arrivée de factures N8N
 */

import { RUNTIME } from '@/config/runtime';

// Interface pour le stock physique
export interface PhysicalStock {
  productName: string;
  category: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lastUpdated: Date;
  // Seuil minimal optionnel (calculé ailleurs selon l'UI)
  minStock?: number;
  // Seuil d'alerte utilisé par l'UI stock
  minStockAlert: number;
}

// Interface pour les mouvements de stock
export interface StockMovement {
  id: string;
  productName: string;
  category: string;
  movementType: 'deduction' | 'addition' | 'correction';
  quantity: number;
  reason: string;
  invoiceNumber?: string;
  previousStock: number;
  newStock: number;
  timestamp: Date;
  vendorName?: string;
}

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
  unitPrice: number; // Prix unitaire AVANT remise
  totalPrice: number; // Prix total APRÈS remise
  status: 'pending' | 'available' | 'delivered' | 'cancelled';
  stockReserved?: boolean;
  // Nouvelles propriétés pour les remises
  originalPrice?: number; // Prix original avant remise
  discountPercentage?: number; // Pourcentage de remise (ex: 20 pour -20%)
  discountAmount?: number; // Montant de la remise en euros
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
  private lastProcessedInvoices: Set<string> = new Set(); // Pour éviter le double traitement
  // Fusible: arrêter le polling après 404
  private stopPolling: boolean = false;

  constructor() {
    // Charger les factures déjà traitées
    this.loadProcessedInvoices();
    
    // URL adaptée selon l'environnement
    const isDevelopment = import.meta.env.DEV;
    const forceProductionMode = localStorage.getItem('force-production-mode') === 'true';

    // Configuration basée sur les variables d'environnement Vite
    if (!RUNTIME.N8N_ENABLED || forceProductionMode) {
      // Mode démo/offline ou production forcée: pas d'appels N8N
      this.baseUrl = '';
      this.isOnline = false; // Forcer offline pour éviter le polling
      this.stopPolling = true;
      console.log(`🏠 Mode N8N: DÉSACTIVÉ (${forceProductionMode ? 'production forcée' : 'env'})`);
    } else {
      // N8N activé: utiliser l'URL configurée
      this.baseUrl = RUNTIME.N8N_URL || '/api/n8n';
      console.log(`🛠️ SyncService mode: ${isDevelopment ? 'DÉVELOPPEMENT' : 'PRODUCTION'}`);
      console.log(`🌐 Base URL: ${this.baseUrl}`);
      console.log(`🧪 Mode N8N: ACTIVÉ`);
    }
    
    // Écouter les changements de connectivité
    window.addEventListener('online', () => {
      if (RUNTIME.N8N_ENABLED && !forceProductionMode) {
        this.isOnline = true;
        this.stopPolling = false;
        this.startAutoSync();
      }
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
      // 🚫 DÉSACTIVÉ pour éviter les boucles infinies GET
      console.log('🚫 syncService.getInvoices désactivé pour éviter les boucles infinies');
      return [];
      
      // Si N8N est désactivé par configuration, retourner le cache (ou vide)
      if (!RUNTIME.N8N_ENABLED) {
        return this.getCachedInvoices().map(inv => this.normalizeInvoiceDates(inv));
      }
      const forceProductionMode = localStorage.getItem('force-production-mode') === 'true';
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      // Autoriser les hôtes LAN en DEV (iPad/réseau local)
      const isLanDevHost = /^(localhost|127\.0\.0\.1|192\.168\.|169\.254\.)/i.test(host);
      const isDevBuild = import.meta.env.DEV === true;
      // En DEV, ne pas activer le garde (sauf si production forcée)
      const productionGuard = !isDevBuild && (forceProductionMode || !isLanDevHost);

      if (productionGuard) {
        // En production: ne jamais retourner les démos
        const cached = this.getCachedInvoices();
        return cached.map(inv => this.normalizeInvoiceDates(inv));
      }

      if (!this.isOnline || this.stopPolling) {
        return this.getCachedInvoices().map(inv => this.normalizeInvoiceDates(inv));
      }

      console.log(`🔗 Récupération des factures depuis N8N: ${this.baseUrl}/sync/invoices`);
      
      try {
        const response = await fetch(`${this.baseUrl}/sync/invoices`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.status === 404) {
          console.warn('⚠️ N8N a renvoyé 404. Arrêt du polling jusqu\'au prochain online.');
          this.stopPolling = true;
          this.stopAutoSync();
          return this.getCachedInvoices().map(inv => this.normalizeInvoiceDates(inv));
        }

        if (response.ok) {
          const data = await response.json();
          const invoices = this.transformInvoicesData(data).map(inv => this.normalizeInvoiceDates(inv));
          this.cacheInvoices(invoices);
          await this.processNewInvoicesForStockDeduction(invoices);
          return invoices;
        } else {
          console.warn(`❌ N8N non disponible (${response.status}), aucun fallback démo en production`);
          return this.getCachedInvoices().map(inv => this.normalizeInvoiceDates(inv));
        }
      } catch (networkError) {
        console.warn('🔌 Erreur réseau N8N, fallback cache:', networkError);
        return this.getCachedInvoices().map(inv => this.normalizeInvoiceDates(inv));
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des factures:', error);
      return this.getCachedInvoices().map(inv => this.normalizeInvoiceDates(inv));
    }
  }

  /** Normalise les champs date d'une facture en objets Date */
  private normalizeInvoiceDates(inv: Invoice): Invoice {
    return {
      ...inv,
      dueDate: new Date(inv.dueDate),
      createdAt: new Date(inv.createdAt),
      updatedAt: new Date(inv.updatedAt),
    };
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
    
    // 🚫 DÉSACTIVÉ pour éviter les boucles infinies
    console.log('🚫 syncService.startAutoSync désactivé pour éviter les boucles infinies');
    return;
    
    if (this.isOnline && !this.stopPolling) {
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

  /**
   * Traite les nouvelles factures pour la déduction automatique du stock
   */
  private async processNewInvoicesForStockDeduction(invoices: Invoice[]): Promise<void> {
    console.log(`🔍 Vérification de ${invoices.length} factures pour déduction stock`);
    
    let newInvoicesProcessed = 0;
    
    for (const invoice of invoices) {
      // Vérifier si la facture n'a pas déjà été traitée
      if (!this.lastProcessedInvoices.has(invoice.id)) {
        console.log(`🆕 Nouvelle facture détectée: ${invoice.number} - Déduction en cours...`);
        await this.deductStockFromInvoice(invoice);
        newInvoicesProcessed++;
      }
    }
    
    if (newInvoicesProcessed > 0) {
      console.log(`✅ ${newInvoicesProcessed} nouvelles factures traitées pour déduction stock`);
    } else {
      console.log(`ℹ️ Aucune nouvelle facture à traiter pour déduction stock`);
    }
  }

  // ===== NOUVELLES MÉTHODES POUR LA GESTION DU STOCK PHYSIQUE =====

  /**
   * Récupère le stock physique depuis le localStorage
   */
  private getPhysicalStock(): PhysicalStock[] {
    try {
      const stored = localStorage.getItem('physicalStock');
      return stored ? JSON.parse(stored) : this.initializeDefaultStock();
    } catch {
      return this.initializeDefaultStock();
    }
  }

  /**
   * Sauvegarde le stock physique dans le localStorage
   */
  private savePhysicalStock(stock: PhysicalStock[]): void {
    try {
      localStorage.setItem('physicalStock', JSON.stringify(stock));
      localStorage.setItem('lastStockUpdate', new Date().toISOString());
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du stock:', error);
    }
  }

  /**
   * Initialise un stock par défaut basé sur les produits du catalogue
   */
  private initializeDefaultStock(): PhysicalStock[] {
    console.log('🏪 Initialisation du stock physique par défaut');
    const defaultStock: PhysicalStock[] = [
      // Matelas
      { productName: 'Matelas Memory Foam 160x200', category: 'Matelas', currentStock: 5, reservedStock: 0, availableStock: 5, lastUpdated: new Date(), minStockAlert: 2 },
      { productName: 'MATELAS BAMBOU 160 x 200', category: 'Matelas', currentStock: 3, reservedStock: 0, availableStock: 3, lastUpdated: new Date(), minStockAlert: 1 },
      { productName: 'Matelas Latex 140x190', category: 'Matelas', currentStock: 4, reservedStock: 0, availableStock: 4, lastUpdated: new Date(), minStockAlert: 2 },
      
      // Sur-matelas  
      { productName: 'Sur-matelas climatisé 140x190', category: 'Sur-matelas', currentStock: 8, reservedStock: 0, availableStock: 8, lastUpdated: new Date(), minStockAlert: 3 },
      { productName: 'SURMATELAS BAMBOU 160 x 200', category: 'Sur-matelas', currentStock: 6, reservedStock: 0, availableStock: 6, lastUpdated: new Date(), minStockAlert: 2 },
      
      // Couettes
      { productName: 'Couette 4 saisons 220x240', category: 'Couettes', currentStock: 10, reservedStock: 0, availableStock: 10, lastUpdated: new Date(), minStockAlert: 5 },
      { productName: 'Couette hiver 200x200', category: 'Couettes', currentStock: 8, reservedStock: 0, availableStock: 8, lastUpdated: new Date(), minStockAlert: 3 },
      
      // Oreillers
      { productName: 'Oreiller ergonomique', category: 'Oreillers', currentStock: 20, reservedStock: 0, availableStock: 20, lastUpdated: new Date(), minStockAlert: 10 },
      { productName: 'Pack 2 oreillers confort', category: 'Oreillers', currentStock: 15, reservedStock: 0, availableStock: 15, lastUpdated: new Date(), minStockAlert: 5 },
      
      // Accessoires
      { productName: 'Sommier tapissier 160x200', category: 'Accessoires', currentStock: 6, reservedStock: 0, availableStock: 6, lastUpdated: new Date(), minStockAlert: 2 },
      { productName: 'Protège-matelas imperméable', category: 'Accessoires', currentStock: 12, reservedStock: 0, availableStock: 12, lastUpdated: new Date(), minStockAlert: 5 }
    ];
    
    this.savePhysicalStock(defaultStock);
    return defaultStock;
  }

  /**
   * Déduit automatiquement les produits du stock lors de l'arrivée d'une facture N8N
   */
  private async deductStockFromInvoice(invoice: Invoice): Promise<void> {
    console.log(`📦 DÉDUCTION STOCK: Traitement facture ${invoice.number}`);
    
    // Vérifier si cette facture a déjà été traitée
    if (this.lastProcessedInvoices.has(invoice.id)) {
      console.log(`⏭️ Facture ${invoice.number} déjà traitée, passage...`);
      return;
    }

    const currentStock = this.getPhysicalStock();
    const movements: StockMovement[] = [];
    let stockUpdated = false;

    // Traiter chaque produit de la facture
    for (const item of invoice.items) {
      // Trouver le produit dans le stock physique
      const stockIndex = currentStock.findIndex(stock => 
        this.normalizeProductName(stock.productName) === this.normalizeProductName(item.productName) &&
        stock.category === item.category
      );

      if (stockIndex === -1) {
        console.warn(`⚠️ Produit non trouvé dans le stock: ${item.productName} (${item.category})`);
        // Créer automatiquement une entrée de stock si le produit n'existe pas
        const newStockItem: PhysicalStock = {
          productName: item.productName,
          category: item.category,
          currentStock: Math.max(0, item.quantity), // Éviter les stocks négatifs
          reservedStock: 0,
          availableStock: Math.max(0, item.quantity),
          lastUpdated: new Date(),
          minStockAlert: 2
        };
        currentStock.push(newStockItem);
        console.log(`✅ Nouveau produit ajouté au stock: ${item.productName} avec ${item.quantity} unités`);
        continue;
      }

      const stockItem = currentStock[stockIndex];
      const previousStock = stockItem.currentStock;

      // Déduire la quantité
      const newStock = Math.max(0, stockItem.currentStock - item.quantity);
      const actualDeduction = stockItem.currentStock - newStock;

      stockItem.currentStock = newStock;
      stockItem.availableStock = Math.max(0, newStock - stockItem.reservedStock);
      stockItem.lastUpdated = new Date();

      // Enregistrer le mouvement
      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productName: item.productName,
        category: item.category,
        movementType: 'deduction',
        quantity: actualDeduction,
        reason: `Facture N8N ${invoice.number} - Client: ${invoice.clientName}`,
        invoiceNumber: invoice.number,
        previousStock,
        newStock,
        timestamp: new Date(),
        vendorName: invoice.vendorName
      };
      movements.push(movement);

      console.log(`📉 STOCK DÉDUIT: ${item.productName} - Quantité: ${actualDeduction} (${previousStock} → ${newStock})`);
      
      // Alerte stock faible
      if (newStock <= stockItem.minStockAlert) {
        console.warn(`🚨 ALERTE STOCK FAIBLE: ${item.productName} - Stock restant: ${newStock} (seuil: ${stockItem.minStockAlert})`);
      }

      stockUpdated = true;
    }

    if (stockUpdated) {
      // Sauvegarder le stock mis à jour
      this.savePhysicalStock(currentStock);
      
      // Sauvegarder les mouvements
      this.saveStockMovements(movements);
      
      // Marquer la facture comme traitée
      this.lastProcessedInvoices.add(invoice.id);
      this.saveProcessedInvoices();
      
      console.log(`✅ Stock mis à jour pour la facture ${invoice.number} - ${movements.length} mouvements enregistrés`);
      
      // Notifier les listeners
      this.notifyListeners({ 
        type: 'stock_updated', 
        invoiceNumber: invoice.number,
        movements: movements,
        totalItems: invoice.items.length
      });
    }
  }

  /**
   * Normalise le nom des produits pour faciliter la correspondance
   */
  private normalizeProductName(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Supprimer caractères spéciaux
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .trim();
  }

  /**
   * Sauvegarde les mouvements de stock
   */
  private saveStockMovements(movements: StockMovement[]): void {
    try {
      const existingMovements = this.getStockMovements();
      const allMovements = [...existingMovements, ...movements];
      localStorage.setItem('stockMovements', JSON.stringify(allMovements));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des mouvements:', error);
    }
  }

  /**
   * Récupère les mouvements de stock
   */
  public getStockMovements(): StockMovement[] {
    try {
      const stored = localStorage.getItem('stockMovements');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Sauvegarde la liste des factures traitées
   */
  private saveProcessedInvoices(): void {
    try {
      localStorage.setItem('processedInvoicesIds', JSON.stringify([...this.lastProcessedInvoices]));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des factures traitées:', error);
    }
  }

  /**
   * Charge la liste des factures déjà traitées
   */
  private loadProcessedInvoices(): void {
    try {
      const stored = localStorage.getItem('processedInvoicesIds');
      if (stored) {
        const ids = JSON.parse(stored);
        this.lastProcessedInvoices = new Set(ids);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des factures traitées:', error);
    }
  }

  /**
   * Récupère le stock physique actuel (API publique)
   */
  public getCurrentPhysicalStock(): PhysicalStock[] {
    return this.getPhysicalStock();
  }

  /**
   * Met à jour manuellement le stock d'un produit
   */
  public updateProductStock(productName: string, category: string, newQuantity: number, reason: string = 'Correction manuelle'): boolean {
    try {
      const currentStock = this.getPhysicalStock();
      const stockIndex = currentStock.findIndex(stock => 
        this.normalizeProductName(stock.productName) === this.normalizeProductName(productName) &&
        stock.category === category
      );

      if (stockIndex === -1) {
        console.error(`Produit non trouvé: ${productName} (${category})`);
        return false;
      }

      const stockItem = currentStock[stockIndex];
      const previousStock = stockItem.currentStock;
      
      stockItem.currentStock = Math.max(0, newQuantity);
      stockItem.availableStock = Math.max(0, newQuantity - stockItem.reservedStock);
      stockItem.lastUpdated = new Date();

      // Enregistrer le mouvement
      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productName,
        category,
        movementType: 'correction',
        quantity: Math.abs(newQuantity - previousStock),
        reason,
        previousStock,
        newStock: newQuantity,
        timestamp: new Date()
      };

      this.savePhysicalStock(currentStock);
      this.saveStockMovements([movement]);

      console.log(`✅ Stock mis à jour manuellement: ${productName} (${previousStock} → ${newQuantity})`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      return false;
    }
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * Mappe les noms d'advisors N8N vers les vendorId système
   */
  private mapAdvisorToVendorId(advisor: string): string | undefined {
    const advisorMap: Record<string, string> = {
      'Sylvie': '1',
      'Lucia': '3', 
      'Cathy': '4',
      'Sabrina': '6',
      'Billy': '7',
      'Bruno': '1', // Mapper Bruno vers Sylvie temporairement
      'MYCONFORT': '1' // MYCONFORT par défaut vers Sylvie
    };
    
    // Nettoyer les espaces
    const cleanAdvisor = advisor?.trim();
    const vendorId = advisorMap[cleanAdvisor];
    
    console.log(`🔄 Mapping advisor "${cleanAdvisor}" → vendorId "${vendorId}"`);
    return vendorId;
  }

  private transformInvoicesData(response: any): Invoice[] {
    // Gérer la réponse N8N qui contient { success: true, invoices: [...] }
    const rawData = response.invoices || response || [];
    
    console.log(`🔍 Transformation de ${rawData.length} entrées de factures N8N`);
    
    // Étape 1: Regrouper les factures par numéro pour éviter les doublons
    const invoiceMap = new Map<string, any>();
    
    rawData.forEach((item: any) => {
      const invoiceNumber = item.invoiceNumber || item.number || `INV-${Date.now()}`;
      const clientName = item.client?.name || item.clientName || 'Client inconnu';
      // 🔧 CORRECTION CRITIQUE : Clé unique combinant numéro de facture ET nom du client
      const uniqueKey = `${invoiceNumber}|||${clientName}`;
      
      if (invoiceMap.has(uniqueKey)) {
        // Facture existante pour le MÊME client : fusionner les produits
        const existing = invoiceMap.get(uniqueKey);
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
        
        console.log(`🔄 Fusion facture ${invoiceNumber} pour ${clientName}: ${allProducts.length} produits`);
      } else {
        // Nouvelle facture (nouveau numéro OU nouveau client)
        invoiceMap.set(uniqueKey, { ...item });
        console.log(`✅ Nouvelle facture ${invoiceNumber} pour ${clientName}: ${(item.products || []).length} produits`);
      }
    });
    
    // Étape 2: Transformer les factures fusionnées
    const uniqueInvoices = Array.from(invoiceMap.values());
    console.log(`📊 Résultat: ${uniqueInvoices.length} factures uniques`);
    return uniqueInvoices.map((item: any) => {
      const totalHT = Number(item.totalHT) || Number(item.total_ht) || 0;
      const totalTTC = Number(item.totalTTC) || Number(item.total_ttc) || 0;
      
      return {
        id: item.id || item.invoiceNumber || `inv-${Date.now()}`,
        number: item.invoiceNumber || item.number || `INV-${Date.now()}`,
        clientName: item.client?.name || item.clientName || 'Client inconnu',
        clientEmail: item.client?.email || item.clientEmail,
        clientPhone: item.client?.phone || item.clientPhone,
        items: (item.products || []).map((rawItem: any, index: number) => {
          const quantity = Number(rawItem.quantity) || 1;
          const unitPrice = Number(rawItem.unitPrice) || 0;
          const rawTotalPrice = Number(rawItem.totalPrice) || 0;
          
          // Calcul des remises
          const originalPrice = Number(rawItem.originalPrice) || unitPrice;
          const discountPercentage = rawItem.discountPercentage ? Number(rawItem.discountPercentage) : 
            (originalPrice > 0 && unitPrice < originalPrice) ? Math.round(((originalPrice - unitPrice) / originalPrice) * 100) : 0;
          const discountAmount = originalPrice > unitPrice ? (originalPrice - unitPrice) * quantity : 0;
          
          // Calculer le vrai prix total après remise
          const calculatedTotalPrice = unitPrice * quantity;
          const totalPrice = rawTotalPrice > 0 ? rawTotalPrice : calculatedTotalPrice;
          
          return {
            id: `${item.invoiceNumber || 'inv'}-item-${index}`,
            productName: rawItem.name || rawItem.productName || 'Produit',
            category: rawItem.category || 'Divers',
            quantity,
            unitPrice,
            totalPrice,
            status: this.mapDeliveryStatus(rawItem.deliveryStatus) || 'pending',
            stockReserved: rawItem.deliveryStatus === 'a_livrer',
            // Nouvelles propriétés pour les remises
            originalPrice: originalPrice !== unitPrice ? originalPrice : undefined,
            discountPercentage: discountPercentage > 0 ? discountPercentage : undefined,
            discountAmount: discountAmount > 0 ? discountAmount : undefined
          };
        }),
        totalHT: totalHT,
        totalTTC: totalTTC,
        status: this.mapInvoiceStatus(item.status) || 'draft',
        dueDate: new Date(item.dueDate || item.due_date || Date.now()),
        createdAt: new Date(item.createdAt || item.created_at || Date.now()),
        updatedAt: new Date(item.lastUpdate || item.updated_at || Date.now()),
        vendorId: this.mapAdvisorToVendorId(item.advisor) || item.vendor_id,
        vendorName: item.advisor || item.vendor_name,
        notes: item.notes || `Événement: ${item.eventLocation || 'Non spécifié'}`,
        // Extraction des détails de règlement depuis N8N - PASSER LE TOTAL CALCULÉ
        paymentDetails: this.extractPaymentDetails(item, totalTTC)
      };
    });
  }

  private extractPaymentDetails(item: any, calculatedTotal?: number): PaymentDetails | undefined {
    // Extraire depuis le champ paymentMethod qui contient les vraies informations
    const paymentMethodText = item.paymentMethod || '';
    const totalAmount = calculatedTotal || Number(item.totalTTC) || Number(item.totalPrice) || 0;
    const deposit = Number(item.deposit) || 0;
    
    // Si pas d'info de paiement, retourner undefined
    if (!paymentMethodText) return undefined;

    console.log(`💳 Analyse du règlement: "${paymentMethodText}" - Total: ${totalAmount}€, Acompte: ${deposit}€`);
    
    // Analyser le statut de la facture pour déterminer les montants
    const invoiceStatus = item.status || '';
    const isFullyPaid = invoiceStatus.toLowerCase().includes('paid') || invoiceStatus.toLowerCase().includes('payé');
    
    // Si payé intégralement, paidAmount = totalAmount, remainingAmount = 0
    const paidAmount = isFullyPaid ? totalAmount : deposit;
    const remaining = isFullyPaid ? 0 : (totalAmount - deposit);

    const paymentDetails: PaymentDetails = {
      method: 'cash', // sera déterminé ci-dessous
      status: this.mapPaymentStatus(item.status),
      totalAmount: totalAmount,
      paidAmount: paidAmount,
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
    // Neutralisé: ne plus fournir de données démo
    return [];
  }
}

// Instance singleton
export const syncService = new SyncService();
