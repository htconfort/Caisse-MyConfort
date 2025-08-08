// Types pour l'application Caisse MyConfort
// Version consolidée et compatible IndexedDB

// ============================================================================
// 🔧 TYPES DE BASE - Conservés exactement comme votre original
// ============================================================================

export type ProductCategory = 'Matelas' | 'Sur-matelas' | 'Couettes' | 'Oreillers' | 'Plateau' | 'Accessoires';

export interface CatalogProduct {
  name: string;
  category: ProductCategory;
  priceTTC: number; // 0 = non vendu seul
  autoCalculateHT?: boolean;
  price?: number;
  description?: string;
}

export interface ExtendedCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  addedAt: Date;
}

export interface Vendor {
  id: string;
  name: string;
  dailySales: number;
  totalSales: number;
  color: string;
}

export interface Sale {
  id: string;
  vendorId: string;
  vendorName: string;
  items: ExtendedCartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  date: Date;
  canceled: boolean;
}

export type PaymentMethod = 'cash' | 'card' | 'check' | 'multi';
export type TabType = 'vendeuse' | 'produits' | 'stock' | 'ventes' | 'diverses' | 'annulation' | 'ca' | 'raz' | 'factures';

// ============================================================================
// 🗄️ TYPES INDEXEDDB - Simplifiés et compatibles avec le schéma Dexie
// ============================================================================

/**
 * Version IndexedDB de Sale - compatible avec le schéma
 */
export interface SaleDB extends Omit<Sale, 'date' | 'id'> {
  id?: number;         // ID auto-généré par Dexie (optionnel pour add)
  saleId: string;      // ID original de la vente (pour retrouver)
  date: number;        // Timestamp pour index optimisé
  dateString: string;  // Format ISO pour affichage
  year: number;        // Index par année
  month: number;       // Index par mois (1-12)
  dayOfYear: number;   // Index par jour de l'année
}

/**
 * Version IndexedDB de Vendor - avec stats étendues
 */
export interface VendorDB extends Vendor {
  salesCount: number;      // Nombre total de ventes
  averageTicket: number;   // Panier moyen
  lastSaleDate?: number;   // Timestamp dernière vente
  lastUpdate: number;      // Timestamp dernière mise à jour stats
}

/**
 * Version IndexedDB de ExtendedCartItem - avec relations
 */
export interface CartItemDB extends Omit<ExtendedCartItem, 'addedAt' | 'id'> {
  id?: number;        // ID auto-généré par Dexie (optionnel pour add)
  itemId: string;     // ID original de l'item (pour retrouver)
  addedAt: number;    // Timestamp pour tri et requêtes
  saleId?: string;    // Relation avec Sale pour analytics
}

/**
 * Gestion du stock unifié (physique + général)
 */
export interface StockDB {
  id: string;                    // ID produit unique
  productName: string;           // Nom produit
  category: ProductCategory;     // Catégorie
  generalStock: number;          // Stock général/comptable
  physicalStock: number;         // Stock physique réel
  minStock: number;              // Seuil d'alerte
  lastUpdate: number;            // Timestamp dernière modification
}

/**
 * Mouvement de stock pour traçabilité
 */
export interface StockMovement {
  id?: number;                            // ID auto-généré par Dexie (optionnel pour add)
  productId: string;                      // Référence produit
  type: 'sale' | 'adjustment' | 'restock' | 'invoice' | 'transfer';
  quantity: number;                       // Positif = ajout, Négatif = retrait
  reason: string;                         // Motif du mouvement
  vendorId?: string;                      // Vendeur responsable
  saleId?: string;                        // Vente associée
  timestamp: number;                      // Horodatage précis
  metadata?: Record<string, string | number | boolean>; // Données supplémentaires
}

/**
 * Analytics pré-calculées par vendeur
 */
export interface VendorAnalytics {
  vendorId: string;
  vendorName: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: number;                                // Timestamp de la période
  salesCount: number;                          // Nombre de ventes
  totalAmount: number;                         // CA total
  averageTicket: number;                       // Panier moyen
  topCategories: Array<{                       // Top catégories
    category: ProductCategory;
    count: number;
    amount: number;
  }>;
  paymentMethods: Record<PaymentMethod, number>; // Répartition paiements
}

/**
 * Analytics pré-calculées par produit
 */
export interface ProductAnalytics {
  productId: string;
  productName: string;
  category: ProductCategory;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: number;                                // Timestamp période
  salesCount: number;                          // Nombre de ventes
  totalQuantity: number;                       // Quantité totale vendue
  totalRevenue: number;                        // CA total produit
  averagePrice: number;                        // Prix moyen
  topVendors: Array<{                          // Top vendeurs
    vendorId: string;
    vendorName: string;
    count: number;
  }>;
}

/**
 * Configuration système
 */
export interface SystemSettings {
  key: string;                    // Clé unique
  value: string | number | boolean | object | unknown[]; // Valeur (JSON typé)
  lastUpdate: number;             // Timestamp modification
  version?: string;               // Version pour migrations
}

/**
 * Cache applicatif avec expiration
 */
export interface CacheEntry {
  key: string;                    // Clé cache
  data: string | number | boolean | object | unknown[]; // Données cachées (JSON typé)
  expiry: number;                 // Timestamp expiration
  tags?: string[];                // Tags pour invalidation
}

// ============================================================================
// 📊 TYPES ANALYTICS & REPORTING - Pour vos dashboards
// ============================================================================

/**
 * Requête de ventes avec filtres
 */
export interface SalesQuery {
  vendorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  paymentMethod?: PaymentMethod;
  minAmount?: number;
  maxAmount?: number;
  category?: ProductCategory;
  limit?: number;
  offset?: number;
}

/**
 * Statistiques globales des ventes
 */
export interface SalesStats {
  totalSales: number;
  totalAmount: number;
  averageTransaction: number;
  topVendor: string;
  topProduct: string;
  paymentMethodBreakdown: Record<PaymentMethod, number>;
  categoryBreakdown: Record<ProductCategory, number>;
  dailyTrend: Array<{
    date: string;
    sales: number;
    amount: number;
  }>;
}

/**
 * Configuration de migration
 */
export interface MigrationConfig {
  backupLocalStorage: boolean;    // Sauvegarder localStorage
  validateData: boolean;          // Valider données migrées
  preserveOriginal: boolean;      // Garder localStorage
  batchSize: number;              // Taille lots migration
}

/**
 * Résultat de migration
 */
export interface MigrationResult {
  success: boolean;
  migratedCounts: {
    vendors: number;
    sales: number;
    cartItems: number;
    stock: number;
  };
  errors: string[];
  duration: number;               // Durée en ms
  timestamp: number;              // Horodatage migration
}

// ============================================================================
// 🔄 RÉEXPORTS - Fonctionnalités existantes + nouvelles
// ============================================================================

// Réexports existants - conservés
export * from '../services/syncService';
export * from '../hooks/useSyncInvoices';
export * from '../hooks/useStockManagement';
export * from '../hooks/useNotifications';

// Nouveaux réexports IndexedDB - prêts pour les prochaines étapes
// (Ces lignes seront décommentées au fur et à mesure)
// export * from '../db/schema';
// export * from '../hooks/storage/useIndexedStorage';
// export * from '../hooks/storage/useMyConfortDB';
// export * from '../hooks/useStorage';
