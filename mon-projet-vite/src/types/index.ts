// Types pour l'application Caisse MyConfort
// Version consolidée et compatible IndexedDB

// ============================================================================
// 🔧 TYPES DE BASE - Conservés exactement comme votre original
// ============================================================================

export type ProductCategory = 'Matelas' | 'Sur-matelas' | 'Couettes' | 'Oreillers' | 'Plateau' | 'Accessoires';

export type CartType = 'classique' | 'facturier';

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
  offert?: boolean;
  originalPrice?: number;
}

export interface Vendor {
  id: string;
  name: string;
  dailySales: number;
  totalSales: number;
  color: string;
  email?: string;
}

export interface Sale {
  id: string;
  vendorId: string;
  vendorName: string;
  items: ExtendedCartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  // Autoriser Date ou string pour tolérer des données non normalisées reçues
  date: Date | string;
  canceled: boolean;
  // Mode panier : détermine si la vente doit être synchronisée avec N8N
  cartMode: CartType; // 'classique' = caisse seule, 'facturier' = iPad + N8N
  // Détails des chèques à venir (si applicable)
  checkDetails?: {
    count: number;        // Nombre de chèques
    amount: number;       // Montant par chèque
    totalAmount: number;  // Montant total des chèques
    notes?: string;       // Notes optionnelles
  };
  // Informations facture manuelle (pour matelas en mode classique ou mode secours)
  manualInvoiceData?: {
    clientName: string;
    invoiceNumber: string;
    source: 'matelas-classique' | 'facturier-manual';
  };
}

export type PaymentMethod = 'cash' | 'card' | 'check' | 'multi';
export type TabType = 'vendeuse' | 'produits' | 'stock' | 'ventes' | 'diverses' | 'annulation' | 'ca' | 'raz' | 'factures' | 'reglements' | 'gestion';

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

// ============================================================================
// 📧 TYPES EMAIL / RAZ - Ajoutés pour EmailRAZSystem.tsx
// ============================================================================

export interface VendorStat {
  id: string;
  name: string;
  dailySales: number;
  totalSales: number;
  color?: string;
  sales?: number;
  count?: number;
  percentage?: number;
}

export interface EmailStatus {
  scheduled: boolean;
  success?: boolean;
  error?: string;
}

export type ActionType = 'success' | 'error' | 'info';

export interface ActionStatus {
  type: ActionType;
  message: string;
  details?: string;
  timestamp: number;
}

export interface EmailConfig {
  recipientEmail: string;
  ccEmails: string;
  subject: string;
  autoSendEnabled: boolean;
  autoSendTime: string;
  performRAZ: boolean;
  attachPDF: boolean;
  attachData: boolean;
  includeDetails: boolean;
  isManual?: boolean;
}

// ============================================================================
// 🖨️ TYPES IMPRESSION - Ajoutés pour PrintableCashSheet.tsx
// ============================================================================

export interface DailySummary {
  totalSales: number;
  salesCount: number;
  vendorStats: VendorStat[];
  paymentMethods: Record<string, number>;
  averageBasket?: number;
  date?: string;
}

export interface PrintAction {
  type: 'success' | 'error';
  message: string;
  timestamp: Date;
}

// ============================================================================
// 📦 TYPES STOCK PHYSIQUE - Ajoutés pour PhysicalStockTab.tsx
// ============================================================================

export type StockLevel = 'low' | 'ok' | 'out';

export interface PhysicalStockItem {
  id: string;
  productName: string;
  category: string;
  currentStock: number;
  minStockAlert: number;
  status: StockLevel;
  minStock: number;
}

export interface PinModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onUnlock: (pin: string) => void;
}

// ============================================================================
// 💾 TYPES STOCKAGE - Ajoutés pour useIndexedStorage.ts
// ============================================================================

export type Primitive = string | number | boolean | null;
export type Storable = Primitive | Record<string, unknown> | unknown[];

export interface SystemSettings {
  darkMode: boolean;
  outletName: string;
  [key: string]: unknown;
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
  salesCount: number;                           // Nombre de ventes
  totalQuantity: number;                        // Quantité totale vendue
  totalRevenue: number;                         // CA total produit
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
// 🧾 SESSIONS DE CAISSE
// ============================================================================

export type SessionStatus = 'open' | 'closed';

export interface SessionDB {
  id: string;                // ex: session-2025-08-10T10:15:00.123Z
  status: SessionStatus;     // open | closed
  openedAt: number;          // timestamp ouverture
  openedBy?: string;         // vendorId ou nom
  closedAt?: number;         // timestamp fermeture
  closedBy?: string;         // qui a clôturé
  note?: string;             // remarque ouverture/fermeture
  metadata?: Record<string, unknown>; // infos additionnelles
  totals?: { card: number; cash: number; cheque: number }; // totaux lors de la clôture
  // Nouveaux champs événement
  eventName?: string;        // Nom de l'événement (saisi le premier jour)
  eventStart?: number;       // Timestamp du premier jour (00:00)
  eventEnd?: number;         // Timestamp du dernier jour (00:00)
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
export * from '@/services/syncService';
export * from '../hooks/useSyncInvoices';
export * from '../hooks/useStockManagement';
export * from '../hooks/useNotifications';

// Nouveaux réexports IndexedDB - prêts pour les prochaines étapes
// (Ces lignes seront décommentées au fur et à mesure)
// ============================================================================
// 📄 TYPES FACTURATION EXTERNE - Réception depuis systèmes externes
// ============================================================================

/**
 * Item de facture reçu depuis un système externe (N8N, API, etc.)
 */
export interface InvoiceItem {
  sku?: string;           // Code produit/SKU (optionnel)
  name: string;           // Nom du produit
  qty: number;            // Quantité
  unitPriceHT: number;    // Prix unitaire HT
  tvaRate: number;        // Taux de TVA (ex: 0.20 pour 20%)
}

/**
 * Client pour facture externe
 */
export interface InvoiceClient {
  name: string;           // Nom du client (obligatoire)
  email?: string;         // Email du client
  phone?: string;         // Téléphone du client
  address?: string;       // Adresse du client
  postalCode?: string;    // Code postal
  city?: string;          // Ville
  siret?: string;         // SIRET pour les entreprises
}

/**
 * Totaux de facture
 */
export interface InvoiceTotals {
  ht: number;             // Total HT
  tva: number;            // Total TVA
  ttc: number;            // Total TTC
}

/**
 * Informations de paiement
 */
export interface InvoicePayment {
  method?: string;        // Méthode de paiement
  paid?: boolean;         // Facture payée ou non
  paidAmount?: number;    // Montant payé
  depositRate?: number;   // Taux d'acompte (ex: 0.30 pour 30%)
}

/**
 * Canaux de distribution/origine
 */
export interface InvoiceChannels {
  source?: string;        // Source de la facture (site web, boutique, etc.)
  via?: string;           // Intermédiaire (N8N, API directe, etc.)
}

/**
 * Payload complet de facture reçue depuis un système externe
 * Structure normalisée pour éviter les doublons et faciliter l'intégration
 */
export interface InvoicePayload {
  invoiceNumber: string;     // Numéro de facture (unique)
  invoiceDate: string;       // Date de facture (format ISO 8601)
  client: InvoiceClient;     // Informations client
  items: InvoiceItem[];      // Items de la facture
  totals: InvoiceTotals;     // Totaux calculés
  payment?: InvoicePayment;  // Informations de paiement (optionnel)
  channels?: InvoiceChannels; // Canaux de distribution (optionnel)
  pdfBase64?: string;        // PDF de la facture en base64 (optionnel)
  idempotencyKey: string;    // Clé d'idempotence (= invoiceNumber par défaut)
}

// ============================================================================
// 🔧 FONCTIONS UTILITAIRES POUR INVOICES
// ============================================================================

/**
 * Fonction d'insertion idempotente pour éviter les doublons
 * Fusionne les données si la facture existe déjà
 */
export const upsertInvoice = (list: InvoicePayload[], incoming: InvoicePayload): InvoicePayload[] => {
  const idx = list.findIndex(i => i.idempotencyKey === incoming.idempotencyKey);
  if (idx === -1) {
    // Nouvelle facture : ajouter en début de liste
    return [incoming, ...list];
  }
  // Facture existante : fusionner les données
  const merged = { ...list[idx], ...incoming };
  const copy = [...list];
  copy[idx] = merged;
  return copy;
};

/**
 * Conversion d'une InvoicePayload vers le format Invoice interne
 */
export const convertInvoicePayloadToInvoice = (payload: InvoicePayload): Partial<Sale> => {
  return {
    id: payload.idempotencyKey,
    vendorId: 'external',
    vendorName: 'Système Externe',
    items: payload.items.map(item => ({
      id: `${payload.invoiceNumber}-${item.sku || item.name}`,
      name: item.name,
      price: item.unitPriceHT * (1 + item.tvaRate), // Conversion en TTC
      quantity: item.qty,
      category: 'Externe',
      addedAt: new Date()
    })),
    totalAmount: payload.totals.ttc,
    paymentMethod: 'card', // Valeur par défaut
    date: new Date(payload.invoiceDate),
    canceled: false
  };
};

// export * from '../db/schema';
// export * from '../hooks/storage/useIndexedStorage';
// export * from '../hooks/storage/useMyConfortDB';
// export * from '../hooks/useStorage';
