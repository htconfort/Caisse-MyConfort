// src/db/schema.ts
// Schéma IndexedDB optimisé pour MyConfort avec Dexie v4.0.11
import Dexie, { Table } from 'dexie';
import type { 
  Sale, 
  ExtendedCartItem, 
  ProductCategory,
  SaleDB,
  VendorDB,
  CartItemDB,
  StockDB,
  StockMovement,
  VendorAnalytics,
  ProductAnalytics,
  SystemSettings,
  CacheEntry,
  SessionDB
} from '../types';

/**
 * Base de données MyConfort avec optimisations pour votre métier
 * - Index optimisés pour vos requêtes fréquentes
 * - Hooks automatiques pour maintenir la cohérence
 * - Migration transparente depuis localStorage
 */
export class MyConfortDB extends Dexie {
  // ============================================================================
  // 📊 TABLES PRINCIPALES - Données métier
  // ============================================================================
  
  /** Ventes avec index temporels optimisés */
  sales!: Table<SaleDB>;
  
  /** Vendeuses avec stats pré-calculées */
  vendors!: Table<VendorDB>;
  
  /** Items de panier avec relations ventes */
  cartItems!: Table<CartItemDB>;
  
  /** Stock physique et général centralisé */
  stock!: Table<StockDB>;
  
  /** Mouvements de stock pour traçabilité */
  stockMovements!: Table<StockMovement>;

  // ============================================================================
  // 📈 TABLES ANALYTICS - Performance optimisée
  // ============================================================================
  
  /** Analytics pré-calculées par vendeur */
  vendorAnalytics!: Table<VendorAnalytics>;
  
  /** Analytics pré-calculées par produit */
  productAnalytics!: Table<ProductAnalytics>;

  // ============================================================================
  // ⚙️ TABLES SYSTÈME - Configuration et cache
  // ============================================================================
  
  /** Configuration système et paramètres */
  settings!: Table<SystemSettings>;
  
  /** Cache applicatif avec expiration */
  cache!: Table<CacheEntry>;

  /** Sessions de caisse */
  sessions!: Table<SessionDB>;

  constructor() {
    super('MyConfortCaisseV2');
    
    // ========================================================================
    // 🗂️ DÉFINITION DES SCHÉMAS AVEC INDEX OPTIMISÉS
    // ========================================================================
    
    this.version(1).stores({
      // 🛒 VENTES - Index optimisés pour dashboard et rapports
      sales: '++id, saleId, vendorId, date, year, month, dayOfYear, totalAmount, paymentMethod, canceled, [vendorId+year], [vendorId+month], [year+month]',
      
      // 👥 VENDEUSES - Index pour stats et performance (clé primaire string fournie par l\'app)
      vendors: 'id, name, lastSaleDate, totalSales, dailySales, lastUpdate',
      
      // 🛍️ ITEMS PANIER - Relations et analytics produits
      cartItems: '++id, itemId, saleId, category, name, addedAt, [saleId+category], [category+addedAt]',
      
      // 📦 STOCK - Gestion stock physique/général (clé primaire string = productId)
      stock: 'id, category, productName, generalStock, physicalStock, minStock, lastUpdate, [category+lastUpdate]',
      
      // 📊 MOUVEMENTS STOCK - Traçabilité complète
      stockMovements: '++id, productId, type, vendorId, saleId, timestamp, [productId+timestamp], [type+timestamp], [vendorId+timestamp]',
      
      // 📈 ANALYTICS VENDEURS - Dashboard temps réel (pas d'auto-incrément sur clé composée)
      vendorAnalytics: '++id, [vendorId+period+date], vendorId, period, date, salesCount, totalAmount',
      
      // 📊 ANALYTICS PRODUITS - Performance produits (pas d'auto-incrément sur clé composée)
      productAnalytics: '++id, [productId+period+date], productId, category, period, date, salesCount, totalRevenue',
      
      // ⚙️ SYSTÈME - Configuration et paramètres (clé string type KV)
      settings: 'key, lastUpdate, version',
      
      // 💾 CACHE - Cache applicatif avec expiration (clé string type KV) + multiEntry sur tags
      cache: 'key, expiry, *tags'
    });

    // Nouvelle version: ajout des sessions de caisse
    this.version(2).stores({
      sessions: 'id, status, openedAt, closedAt, openedBy'
    });

    // ========================================================================
    // 🔄 HOOKS AUTOMATIQUES - Maintien de la cohérence des données
    // ========================================================================

    // Hook création vente : enrichissement automatique des données temporelles
    this.sales.hook('creating', (primKey, obj) => {
      const now = Date.now();
      const date = new Date(obj.date || now);
      
      // Enrichissement automatique des index temporels
      obj.date = now;
      obj.dateString = date.toISOString();
      obj.year = date.getFullYear();
      obj.month = date.getMonth() + 1;
      obj.dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
      
      console.log(`📝 Nouvelle vente créée: ${obj.id} (${obj.vendorName})`);
    });

    // Hook modification vente : mise à jour stats si annulation
    this.sales.hook('updating', async (modifications, primKey, obj) => {
      const mods = modifications as Partial<SaleDB>;
      if (mods.canceled !== undefined) {
        console.log(`🔄 Vente ${primKey} ${mods.canceled ? 'annulée' : 'réactivée'}`);
        
        // Programmer la mise à jour des stats vendeur (asynchrone)
        setTimeout(() => {
          if (obj?.vendorId) {
            this.updateVendorStats(obj.vendorId);
          }
        }, 100);
      }
    });

    // Hook création mouvement stock : mise à jour stock automatique
    this.stockMovements.hook('creating', async (primKey, obj) => {
      console.log(`📦 Mouvement stock: ${obj.productId} (${obj.quantity > 0 ? '+' : ''}${obj.quantity})`);
      
      // Mise à jour automatique du stock après création du mouvement
      setTimeout(() => {
        this.applyStockMovement(obj);
      }, 50);
    });
  }

  // ============================================================================
  // 🚀 MÉTHODES MÉTIER OPTIMISÉES - Requêtes fréquentes de votre app
  // ============================================================================

  /**
   * Récupérer les ventes d'un vendeur avec filtres optionnels
   * Optimisé avec index [vendorId+year] et [vendorId+month]
   */
  async getVendorSales(vendorId: string, startDate?: Date, endDate?: Date): Promise<SaleDB[]> {
    let query = this.sales.where('vendorId').equals(vendorId);
    
    if (startDate && endDate) {
      query = query.and(sale => 
        sale.date >= startDate.getTime() && 
        sale.date <= endDate.getTime()
      );
    }
    
    return query.reverse().sortBy('date');
  }

  /**
   * CA journalier avec performance optimisée
   * Utilise l'index [year+month+dayOfYear] pour requête ultra-rapide
   */
  async getDailySales(date: Date = new Date()): Promise<SaleDB[]> {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / 86400000);
    
    return this.sales
      .where('[year+month]').equals([year, month])
      .and(sale => sale.dayOfYear === dayOfYear && !sale.canceled)
      .toArray();
  }

  /**
   * CA mensuel avec pré-calculs optimisés
   */
  async getMonthlySales(year: number, month: number): Promise<SaleDB[]> {
    return this.sales
      .where('[year+month]').equals([year, month])
      .and(sale => !sale.canceled)
      .toArray();
  }

  /**
   * Top produits par catégorie - requête analytics optimisée
   */
  async getTopProductsByCategory(category: ProductCategory, limit: number = 10): Promise<Array<{productName: string, totalSold: number, revenue: number}>> {
    const items = await this.cartItems
      .where('category').equals(category)
      .toArray();
    
    // Groupement et calculs
    const productStats = new Map<string, {quantity: number, revenue: number}>();
    
    items.forEach(item => {
      const current = productStats.get(item.name) || {quantity: 0, revenue: 0};
      current.quantity += item.quantity;
      current.revenue += item.price * item.quantity;
      productStats.set(item.name, current);
    });
    
    // Tri par quantité vendue
    return Array.from(productStats.entries())
      .map(([name, stats]) => ({
        productName: name,
        totalSold: stats.quantity,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);
  }

  /**
   * Mise à jour des statistiques vendeur
   * Recalcule toutes les métriques de performance
   */
  async updateVendorStats(vendorId: string): Promise<void> {
    try {
      const vendor = await this.vendors.get(vendorId);
      if (!vendor) {
        console.warn(`⚠️ Vendeur ${vendorId} non trouvé pour mise à jour stats`);
        return;
      }

      // Récupérer toutes les ventes du vendeur
      const allSales = await this.getVendorSales(vendorId);
      const validSales = allSales.filter(s => !s.canceled);
      
      // Calculs de base
      const totalSales = validSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const salesCount = validSales.length;
      const averageTicket = salesCount > 0 ? totalSales / salesCount : 0;
      
      // CA journalier (aujourd'hui)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dailySales = validSales
        .filter(sale => sale.date >= today.getTime())
        .reduce((sum, sale) => sum + sale.totalAmount, 0);
      
      // Dernière vente
      const lastSaleDate = validSales.length > 0 
        ? Math.max(...validSales.map(s => s.date))
        : undefined;

      // Mise à jour
      await this.vendors.update(vendorId, {
        totalSales,
        dailySales,
        salesCount,
        averageTicket,
        lastSaleDate,
        lastUpdate: Date.now()
      });

      console.log(`✅ Stats vendeur ${vendor.name} mises à jour: ${salesCount} ventes, ${totalSales.toFixed(2)}€ total`);
      
    } catch (error) {
      console.error(`❌ Erreur mise à jour stats vendeur ${vendorId}:`, error);
    }
  }

  /**
   * Application d'un mouvement de stock
   * Met à jour automatiquement les quantités
   */
  private async applyStockMovement(movement: StockMovement): Promise<void> {
    try {
      const stock = await this.stock.get(movement.productId);
      if (!stock) {
        console.warn(`⚠️ Produit ${movement.productId} non trouvé en stock`);
        return;
      }

      // Calcul nouvelle quantité selon le type de mouvement
      let newPhysicalStock = stock.physicalStock;
      
      switch (movement.type) {
        case 'sale':
          newPhysicalStock = Math.max(0, stock.physicalStock - Math.abs(movement.quantity));
          break;
        case 'restock':
        case 'adjustment':
          newPhysicalStock = movement.quantity > 0 
            ? stock.physicalStock + movement.quantity
            : Math.max(0, stock.physicalStock + movement.quantity);
          break;
        case 'invoice':
          // Les factures N8N peuvent décrémenter le stock physique
          newPhysicalStock = Math.max(0, stock.physicalStock - Math.abs(movement.quantity));
          break;
      }

      // Mise à jour du stock
      await this.stock.update(movement.productId, {
        physicalStock: newPhysicalStock,
        lastUpdate: Date.now()
      });

      console.log(`📦 Stock ${movement.productId}: ${stock.physicalStock} → ${newPhysicalStock} (${movement.reason})`);
      
    } catch (error) {
      console.error(`❌ Erreur application mouvement stock:`, error);
    }
  }

  /**
   * Nettoyage du cache expiré
   * Supprime automatiquement les entrées expirées
   */
  async cleanExpiredCache(): Promise<number> {
    const now = Date.now();
    const expiredItems = await this.cache.where('expiry').below(now).toArray();
    
    if (expiredItems.length > 0) {
      await this.cache.where('expiry').below(now).delete();
      console.log(`🧹 ${expiredItems.length} entrées cache supprimées`);
    }
    
    return expiredItems.length;
  }

  // ============================================================================
  // 🧾 GESTION DES SESSIONS DE CAISSE
  // ============================================================================

  /** Retourne la session ouverte courante (s'il y en a une) */
  async getCurrentSession(): Promise<SessionDB | undefined> {
    return this.sessions.where('status').equals('open').first();
  }

  /** Ouvre une session si aucune n'est ouverte. Retourne la session courante. */
  async openSession(openedByOrOpts?: string | { openedBy?: string; note?: string }): Promise<SessionDB> {
    const { openedBy, note } = typeof openedByOrOpts === 'object' && openedByOrOpts !== null
      ? { openedBy: openedByOrOpts.openedBy, note: openedByOrOpts.note }
      : { openedBy: openedByOrOpts as string | undefined, note: undefined };

    return this.transaction('rw', this.sessions, async () => {
      const existing = await this.sessions.where('status').equals('open').first();
      if (existing) return existing;
      const now = Date.now();
      const newSession: SessionDB = {
        id: `session-${new Date(now).toISOString()}`,
        status: 'open',
        openedAt: now,
        openedBy,
        ...(note ? { note } : {})
      };
      await this.sessions.add(newSession);
      // Mémoriser pour debug / UI
      await this.settings.put({ key: 'current_session_id', value: newSession.id, lastUpdate: now, version: '1.0' });
      console.log(`🔐 Session ouverte: ${newSession.id}`);
      return newSession;
    });
  }

  /** Version sûre: évite toute double session ouverte, ferme les doublons au besoin */
  async openSessionSafe(openedByOrOpts?: string | { openedBy?: string; note?: string }): Promise<SessionDB> {
    const { openedBy, note } = typeof openedByOrOpts === 'object' && openedByOrOpts !== null
      ? { openedBy: openedByOrOpts.openedBy, note: openedByOrOpts.note }
      : { openedBy: openedByOrOpts as string | undefined, note: undefined };

    return this.transaction('rw', this.sessions, this.settings, async () => {
      const openOnes = await this.sessions.where('status').equals('open').toArray();
      if (openOnes.length >= 1) {
        // Garder la plus récente et fermer les doublons éventuels
        const sorted = openOnes.sort((a, b) => (b.openedAt || 0) - (a.openedAt || 0));
        const keep = sorted[0];
        const dupes = sorted.slice(1);
        if (dupes.length) {
          const closedAt = Date.now();
          for (const d of dupes) {
            await this.sessions.update(d.id, { status: 'closed', closedAt, note: `${(d as SessionDB).note ?? ''} (auto-closed duplicate)` });
          }
          console.warn(`⚠️ ${dupes.length} session(s) en double auto-fermée(s)`);
        }
        // Mettre à jour le pointeur UI
        await this.settings.put({ key: 'current_session_id', value: keep.id, lastUpdate: Date.now(), version: '1.0' });
        return keep;
      }
      // Aucune ouverte: en créer une nouvelle
      const now = Date.now();
      const newSession: SessionDB = {
        id: `session-${new Date(now).toISOString()}`,
        status: 'open',
        openedAt: now,
        openedBy,
        ...(note ? { note } : {})
      };
      await this.sessions.add(newSession);
      await this.settings.put({ key: 'current_session_id', value: newSession.id, lastUpdate: now, version: '1.0' });
      console.log(`🔐 Session ouverte (safe): ${newSession.id}`);
      return newSession;
    });
  }

  /** Ferme la session ouverte courante (si trouvée) */
  async closeSession(args?: { closedBy?: string; note?: string; totals?: { card: number; cash: number; cheque: number } } | { card: number; cash: number; cheque: number }): Promise<void> {
    const { closedBy, note, totals } = ((): { closedBy?: string; note?: string; totals?: { card: number; cash: number; cheque: number } } => {
      if (!args) return {};
      if ('card' in (args as any)) {
        const t = args as { card: number; cash: number; cheque: number };
        return { totals: { card: t.card, cash: t.cash, cheque: t.cheque } };
      }
      return args as { closedBy?: string; note?: string; totals?: { card: number; cash: number; cheque: number } };
    })();

    return this.transaction('rw', this.sessions, async () => {
      const current = await this.sessions.where('status').equals('open').first();
      if (!current) return;
      const closedAt = Date.now();
      await this.sessions.update(current.id, { status: 'closed', closedAt, ...(closedBy ? { closedBy } : {}), ...(note ? { note } : {}), ...(totals ? { totals } : {}) });
      await this.settings.put({ key: 'current_session_id', value: null as unknown as string, lastUpdate: closedAt, version: '1.0' });
      console.log(`🔒 Session fermée: ${current.id}`);
    });
  }

  /** Retourne la session courante si ouverte, sinon l'ouvre */
  async ensureSession(openedBy?: string): Promise<SessionDB> {
    const current = await this.getCurrentSession();
    if (current) return current;
    return this.openSession(openedBy);
  }

  // ============================================================================
  // 🔄 MIGRATION DEPUIS LOCALSTORAGE
  // ============================================================================

  /**
   * Migration complète depuis localStorage
   * Conserve vos données existantes avec enrichissement
   */
  async migrateFromLocalStorage(): Promise<void> {
    console.log('🚀 Début migration complète localStorage → IndexedDB...');
    
    try {
      // Migration dans l'ordre des dépendances
      await this.migrateVendors();
      await this.migrateSales();
      await this.migrateStock();
      
      // Marquer la migration comme terminée
      await this.settings.put({
        key: 'migration_completed',
        value: true,
        lastUpdate: Date.now(),
        version: '1.0'
      });
      
      console.log('✅ Migration complète terminée avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur durant la migration:', error);
      throw error;
    }
  }

  private async migrateVendors(): Promise<void> {
    const vendorsData = localStorage.getItem('myconfort-vendors');
    if (vendorsData) {
      const vendors = JSON.parse(vendorsData);
      const actualVendors = vendors.data || vendors;
      
      if (Array.isArray(actualVendors)) {
        const vendorsDB: VendorDB[] = actualVendors.map(vendor => ({
          ...vendor,
          salesCount: 0,
          averageTicket: 0,
          lastUpdate: Date.now()
        }));
        
        await this.vendors.bulkAdd(vendorsDB);
        console.log(`✅ ${vendorsDB.length} vendeuses migrées`);
      }
    }
  }

  private async migrateSales(): Promise<void> {
    const salesData = localStorage.getItem('myconfort-sales');
    if (salesData) {
      const sales = JSON.parse(salesData);
      const actualSales = sales.data || sales;
      
      if (Array.isArray(actualSales)) {
        const salesDB: SaleDB[] = actualSales.map(sale => {
          const date = new Date(sale.date);
          return {
            ...sale,
            date: date.getTime(),
            dateString: date.toISOString(),
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            dayOfYear: Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
          };
        });
        
        await this.sales.bulkAdd(salesDB);
        console.log(`✅ ${salesDB.length} ventes migrées`);
        
        // Migrer les items de panier
        const allCartItems: CartItemDB[] = actualSales.flatMap(sale => 
          sale.items.map((item: ExtendedCartItem) => ({
            ...item,
            addedAt: new Date(item.addedAt).getTime(),
            saleId: sale.id
          }))
        );
        
        await this.cartItems.bulkAdd(allCartItems);
        console.log(`✅ ${allCartItems.length} items de panier migrés`);
        
        // Recalculer les stats vendeurs
        const vendorIds = [...new Set(actualSales.map(s => s.vendorId))];
        for (const vendorId of vendorIds) {
          await this.updateVendorStats(vendorId);
        }
        console.log(`✅ Stats recalculées pour ${vendorIds.length} vendeurs`);
      }
    }
  }

  private async migrateStock(): Promise<void> {
    const stockData = localStorage.getItem('physical-stock-quantities');
    if (stockData) {
      const stock = JSON.parse(stockData);
      const actualStock = stock.data || stock;
      
      const stockEntries: StockDB[] = Object.entries(actualStock).map(([id, quantity]) => ({
        id,
        productName: id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: this.inferCategory(id),
        generalStock: quantity as number,
        physicalStock: quantity as number,
        minStock: 5,
        lastUpdate: Date.now()
      }));
      
      await this.stock.bulkAdd(stockEntries);
      console.log(`✅ ${stockEntries.length} produits stock migrés`);
    }
  }

  private inferCategory(productId: string): ProductCategory {
    if (productId.includes('matelas') && !productId.includes('sur')) return 'Matelas';
    if (productId.includes('sur-matelas')) return 'Sur-matelas';
    if (productId.includes('couette')) return 'Couettes';
    if (productId.includes('oreiller')) return 'Oreillers';
    if (productId.includes('plateau')) return 'Plateau';
    return 'Accessoires';
  }
}

// ============================================================================
// 🎯 INSTANCE SINGLETON - Utilisation globale
// ============================================================================

declare global {
  interface Window {
    __MYCONFORT_DB__?: MyConfortDB;
  }
}

/** Instance unique de la base de données MyConfort (singleton via window) */
export const db: MyConfortDB =
  window.__MYCONFORT_DB__ ?? (window.__MYCONFORT_DB__ = new MyConfortDB());

console.debug('DB singleton loaded from:', import.meta.url);

// Nettoyage automatique du cache au démarrage (Dexie v4+)
if (!db.isOpen()) {
  db.open()
    .then(() => {
      console.log('MyConfort Database is ready');
      db.cleanExpiredCache();
    })
    .catch((error) => {
      console.error('Failed to open database:', error);
    });
} else {
  console.log('MyConfort Database is ready (already open)');
  db.cleanExpiredCache();
}

// ============================================================================
// 🛠️ UTILITAIRES DE CONVERSION - Helpers pour vos composants
// ============================================================================

/** Parse any date-like input to a valid Date without using `any` */
const toDateSafe = (input: unknown): Date => {
  if (input instanceof Date) return input;
  if (typeof input === 'string' || typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }
  return new Date(0);
};

/** Convertir Sale → SaleDB */
export const saleToSaleDB = (sale: Sale): Omit<SaleDB, 'id'> => {
  const d = toDateSafe(sale.date);
  const safe = isNaN(d.getTime()) ? new Date(0) : d;
  return {
    ...sale,
    saleId: sale.id,     // Garder l'ID original comme saleId
    date: safe.getTime(),
    dateString: safe.toISOString(),
    year: safe.getFullYear(),
    month: safe.getMonth() + 1,
    dayOfYear: Math.floor((safe.getTime() - new Date(safe.getFullYear(), 0, 0).getTime()) / 86400000)
  } as Omit<SaleDB, 'id'>;
};

/** Convertir SaleDB → Sale */
export const saleDBToSale = (saleDB: SaleDB): Sale => {
  return {
    ...saleDB,
    id: saleDB.saleId,   // Restaurer l'ID original
    date: new Date(saleDB.date)
  } as unknown as Sale;
};

/** Convertir ExtendedCartItem → CartItemDB */
export const cartItemToCartItemDB = (item: ExtendedCartItem, saleId?: string): Omit<CartItemDB, 'id'> => {
  return {
    ...item,
    itemId: item.id,     // Garder l'ID original comme itemId
    addedAt: item.addedAt.getTime(),
    saleId
  };
};

/** Convertir CartItemDB → ExtendedCartItem */
export const cartItemDBToCartItem = (itemDB: CartItemDB): ExtendedCartItem => {
  return {
    ...itemDB,
    id: itemDB.itemId,   // Restaurer l'ID original
    addedAt: new Date(itemDB.addedAt)
  } as unknown as ExtendedCartItem;
};
