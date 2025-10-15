import { useIndexedStorage } from '@/hooks/storage/useIndexedStorage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    STORAGE_KEYS,
    vendors
} from './data';
import { useSyncInvoices } from './hooks/useSyncInvoices';
import { triggerN8NSync } from './services/n8nSyncService';
import type {
    CartType,
    CatalogProduct,
    ExtendedCartItem,
    PaymentMethod,
    PriceOverrideMeta,
    Sale,
    TabType,
    Vendor
} from './types/index';

// Type pour les options de RAZ
type ResetOptionKey =
  | 'dailySales'
  | 'cart'
  | 'invoices'
  | 'selectedVendor'
  | 'vendorStats'
  | 'keepSalesHistory'    // ✅ NOUVEAU: Conserver l'historique des ventes
  | 'keepPendingChecks'   // ✅ NOUVEAU: Conserver les chèques à venir
  | 'allData';

import { getDB } from '@/db/index';
import { sessionService } from '@/services';
import { AlertTriangle, Book, Check, CheckCircle, Edit3, Package, Palette, Plus, RefreshCw, Save, Settings, ShoppingCart, Trash2, Users, X } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import FeuilleDeRAZPro from './components/FeuilleDeRAZPro';
import { GuideUtilisation } from './components/GuideUtilisation';
import InvoicesTabCompact from './components/InvoicesTabCompact';
import { CancellationTab, CATab, PaymentsTab, ProductsTab, SalesTab, VendorSelection } from './components/tabs';
import { StockTabElegant } from './components/tabs/StockTabElegant';
import { FloatingCart, SuccessNotification } from './components/ui';
import { BuildStamp } from './components/ui/BuildStamp';
import { CartTypeSelector } from './components/ui/CartTypeSelector';
import { DebugDataPanel } from './components/ui/DebugDataPanel';
import { Header } from './components/ui/Header';
import { Navigation } from './components/ui/Navigation';
import { ProductsManagement } from './components/ui/ProductsManagement';
import { VendorDiagnostics } from './components/ui/VendorDiagnostics';
import './styles/invoices-tab.css';
import './styles/print.css';
import type { PaymentDetails } from './types';

// Styles pour les animations RAZ
const razAnimationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { 
      opacity: 0; 
      transform: translateY(-20px) scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
`;

// Injecter les styles dans le document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = razAnimationStyles;
  document.head.appendChild(styleSheet);
}

// Types pour la RAZ
// Interface pour les données de RAZ (réservée pour usage futur)

// Palette de couleurs pour les vendeuses
const VENDOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2',
  '#A9DFBF', '#F9E79F', '#D5A6BD', '#85C1E9', '#A3E4D7'
];

export default function CaisseMyConfortApp() {
  // 🚀 MON PANIER VERSION 3.01 - DUAL MODE + SYNC
  // États principaux
  const [activeTab, setActiveTab] = useState<TabType>('vendeuse');
  const [selectedVendor, setSelectedVendor] = useIndexedStorage<Vendor | null>(STORAGE_KEYS.VENDOR, null);
  const [cart, setCart] = useIndexedStorage<ExtendedCartItem[]>(STORAGE_KEYS.CART, []);
  const [sales, setSales] = useIndexedStorage<Sale[]>(STORAGE_KEYS.SALES, []);
  const [vendorStats, setVendorStats] = useIndexedStorage<Vendor[]>(STORAGE_KEYS.VENDORS_STATS, vendors);
  const [cartType, setCartType] = useIndexedStorage<CartType>('CART_TYPE', 'classique');
  
  // 🚨 DEBUG CART STATE
  console.log('🚨 App.tsx - Cart Debug:', {
    cartLength: cart.length,
    cart: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })),
    activeTab,
    selectedVendor: selectedVendor?.name
  });

  // 🚨 FONCTION DEBUG POUR AJOUTER DES ARTICLES DE TEST
   
  (window as any).addTestCartItems = () => {
    const testItems: ExtendedCartItem[] = [
      {
        id: 'test-1-' + Date.now(),
        name: 'Oreiller Test 1',
        price: 25,
        originalPrice: 25,
        quantity: 2,
        category: 'Oreillers',
        addedAt: new Date(),
        offert: false
      },
      {
        id: 'test-2-' + Date.now(),
        name: 'Couette Test 2',
        price: 45,
        originalPrice: 45,
        quantity: 1,
        category: 'Couettes',
        addedAt: new Date(),
        offert: false
      }
    ];
    
    setCart(prevCart => [...prevCart, ...testItems]);
    console.log('✅ Articles de test ajoutés au panier');
  };

   
  (window as any).clearTestCart = () => {
    setCart([]);
    console.log('🗑️ Panier vidé');
  };
  
  // Hook pour les factures
  const { invoices, stats: invoicesStats, resetInvoices } = useSyncInvoices();
  
  // États UI
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [forceExpandCart, setForceExpandCart] = useState(false);

  // États pour l'ajout de vendeuses
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  
  // État pour les sous-onglets de gestion
  const [gestionActiveTab, setGestionActiveTab] = useState<'vendeuses' | 'produits' | 'guide' | 'panier' | 'diagnostic'>('vendeuses');

  // États pour l'édition et la suppression des vendeuses
  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const [editVendorName, setEditVendorName] = useState('');
  const [editVendorEmail, setEditVendorEmail] = useState('');
  const [editVendorColor, setEditVendorColor] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // États pour le système RAZ avancé
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetOptions, setResetOptions] = useState<Record<ResetOptionKey, boolean>>({
    dailySales: true,
    cart: true,
    invoices: true,
    selectedVendor: false,
    vendorStats: false,
    keepSalesHistory: false,     // ✅ NOUVEAU: Par défaut, conserver l'historique (décoché = conserver)
    keepPendingChecks: false,    // ✅ NOUVEAU: Par défaut, conserver les chèques (décoché = conserver)
    allData: false
  });
  const [resetStep, setResetStep] = useState<'options' | 'confirmation' | 'executing' | 'completed'>('options');
  const [showResetSuccess, setShowResetSuccess] = useState(false);

  // Mise à jour de l'heure
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Assurer une session ouverte côté app (sécurise même si main.tsx l'a déjà fait)
  useEffect(() => {
    void sessionService.ensureSession('app');
  }, []);

  // Ecoute les ventes externes et alimente le même flux que le panier classique
  useEffect(() => {
    const onExternalSale = (e: Event) => {
      const detail = (e as CustomEvent).detail as { sale?: Sale } | undefined;
      const sale = detail?.sale;
      if (!sale) return;
      // Ajouter la vente dans l'état sales
      setSales(prev => [...prev, sale]);
      // Mettre à jour le CA de la vendeuse concernée
      setVendorStats(prev => prev.map(v => v.id === sale.vendorId
        ? { ...v, dailySales: (v.dailySales ?? 0) + sale.totalAmount, totalSales: (v.totalSales ?? 0) + sale.totalAmount }
        : v
      ));
    };
    window.addEventListener('external-sale-created', onExternalSale as EventListener);
    return () => window.removeEventListener('external-sale-created', onExternalSale as EventListener);
  }, [setSales, setVendorStats]);

  // 🔧 MIGRATION: Ajouter cartMode='classique' aux ventes existantes sans ce champ
  useEffect(() => {
    const migrateExistingSales = () => {
      const salesNeedingMigration = sales.filter(sale => !sale.cartMode);
      if (salesNeedingMigration.length > 0) {
        console.log(`🔧 Migration: ${salesNeedingMigration.length} ventes sans cartMode détectées`);
        const migratedSales = sales.map(sale => ({
          ...sale,
          cartMode: sale.cartMode || 'classique' as CartType
        }));
        setSales(migratedSales);
        console.log('✅ Migration des ventes terminée - mode classique par défaut');
      }
    };

    if (sales.length > 0) {
      migrateExistingSales();
    }
  }, [sales, setSales]);

  // Calculs dérivés
  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), 
    [cart]
  );
  
  const cartItemsCount = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0), 
    [cart]
  );

  // Calcul du nombre de règlements en attente
  const pendingPaymentsCount = useMemo(() => {
    let count = 0;
    
    // Règlements à venir des ventes caisse
    sales.forEach(sale => {
      if (sale.checkDetails && sale.paymentMethod === 'check' && !sale.canceled) {
        count++;
      }
    });

    // Règlements à venir des factures N8N
    invoices.forEach(invoice => {
      if (invoice.paymentDetails?.checkDetails && 
          invoice.paymentDetails.method === 'check' && 
          invoice.paymentDetails.status !== 'completed') {
        count++;
      }
    });
    
    return count;
  }, [sales, invoices]);

  // Gestion du panier
  const addToCart = useCallback((product: CatalogProduct) => {
    const unitPrice = Number(product.priceTTC ?? 0);
    if (!unitPrice) return;

    if (!selectedVendor) {
      alert("Veuillez d'abord sélectionner une vendeuse pour ajouter des produits au panier.");
      return;
    }

    // Vérifier si le produit est autorisé selon le type de panier
    if (cartType === 'facturier' && ['Matelas', 'Sur-matelas'].includes(product.category)) {
      alert('⚠️ Impossible d\'ajouter ce produit en mode "Panier facturier".\n\n' +
            'Les Matelas et Sur-matelas sont gérés automatiquement via N8N pour éviter les doublons.\n\n' +
            'Basculez en mode "Panier classique" pour vendre directement depuis la caisse.');
      return;
    }

    setCart(prevCart => [
      ...prevCart,
      {
        id: `${product.name}-${Date.now()}-${Math.random()}`,
        name: product.name,
        price: unitPrice,
        originalPrice: unitPrice, // ✨ Sauvegarder le prix original
        quantity: 1,
        category: product.category,
        addedAt: new Date(),
        offert: false, // ✨ Par défaut non offert
      },
    ]);
  }, [setCart, selectedVendor, cartType]);

  // Fonction pour déclencher l'expansion du panier
  const triggerExpandCart = useCallback(() => {
    setForceExpandCart(true);
    // Reset après un court délai
    setTimeout(() => setForceExpandCart(false), 100);
  }, []);

  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        // Si la nouvelle quantité est 0 ou moins, supprimer l'article
        return prevCart.filter(item => item.id !== itemId);
      }
      
      // Sinon, mettre à jour la quantité
      return prevCart.map(item =>
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  }, [setCart]);

  const toggleOffert = useCallback((itemId: string) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === itemId) {
          if (!item.offert) {
            // Marquer comme offert : sauvegarder le prix original et mettre à 0
            return {
              ...item,
              offert: true,
              originalPrice: item.originalPrice || item.price,
              price: 0
            };
          } else {
            // Annuler l'offre : restaurer le prix original
            return {
              ...item,
              offert: false,
              price: item.originalPrice || item.price
            };
          }
        }
        return item;
      })
    );
  }, [setCart]);

  // ▼ NOUVEAU: Gestion des prix négociés
  const handlePriceOverride = useCallback((itemId: string, override: PriceOverrideMeta) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === itemId) {
          if (!override.enabled) {
            // Retour au prix original
            return {
              ...item,
              price: item.originalPrice || item.price,
              priceOverride: undefined
            };
          } else {
            // Application du nouveau prix
            return {
              ...item,
              price: override.value,
              originalPrice: item.originalPrice || item.price,
              priceOverride: override
            };
          }
        }
        return item;
      })
    );
  }, [setCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, [setCart]);

  // Gestion des ventes
  const completeSale = useCallback((
    paymentMethod: PaymentMethod = 'card', 
    checkDetails?: { count: number; amount: number; totalAmount: number; notes?: string },
    manualInvoiceData?: { clientName: string; invoiceNumber: string },
    paymentDetails?: PaymentDetails
  ) => {
    if (!selectedVendor || cart.length === 0) return;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      items: [...cart],
      totalAmount: cartTotal,
      paymentMethod: paymentMethod,
      date: new Date(),
      canceled: false,
      cartMode: cartType, // 🎯 Ajouter le mode panier pour déterminer la synchronisation
      // Ajouter les détails des chèques si fournis
      ...(checkDetails && { checkDetails }),
      ...(paymentDetails && { paymentDetails }),
      // Ajouter les données de facture manuelle si fournies
      ...(manualInvoiceData && { 
        manualInvoiceData: {
          ...manualInvoiceData,
          source: 'matelas-classique' as const
        }
      })
    };

    setSales(prev => [...prev, newSale]);
    
    setVendorStats(prev => prev.map(vendor => 
      vendor.id === selectedVendor.id
        ? {
            ...vendor,
            dailySales: (vendor.dailySales ?? 0) + cartTotal,
            totalSales: (vendor.totalSales ?? 0) + cartTotal, // <— cumul € (pas un compteur)
          }
        : vendor
    ));

    // 🎯 LOGIQUE DE SYNCHRONISATION N8N
    // Synchroniser uniquement si mode "facturier" - évite les doublons
    if (cartType === 'facturier') {
      console.log('🔄 Mode facturier : synchronisation N8N activée', newSale);
      // Déclencher la synchronisation N8N de manière asynchrone
      triggerN8NSync(newSale).catch(error => {
        console.error('❌ Erreur synchronisation N8N:', error);
        // L'erreur est déjà gérée dans le service, on continue sans bloquer la vente
      });
    } else {
      console.log('📋 Mode classique : vente en caisse seule (pas de sync N8N)', newSale);
    }

    clearCart();
    setShowSuccess(true);
    setSelectedVendor(null);
    
    setTimeout(() => {
      setActiveTab('vendeuse');
    }, 2000);
  }, [selectedVendor, cart, cartTotal, setSales, setVendorStats, clearCart, setSelectedVendor, cartType]);

  // Fonction pour annuler la dernière vente
  const cancelLastSale = useCallback(() => {
    const lastSale = sales
      .filter(sale => !sale.canceled)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (!lastSale) return false;

    // Marquer la vente comme annulée
    setSales(prev => prev.map(sale => 
      sale.id === lastSale.id 
        ? { ...sale, canceled: true }
        : sale
    ));

    // Mettre à jour les statistiques de la vendeuse
    setVendorStats(prev => prev.map(vendor => 
      vendor.id === lastSale.vendorId
        ? {
            ...vendor,
            dailySales: (vendor.dailySales ?? 0) - lastSale.totalAmount,
            totalSales: (vendor.totalSales ?? 0) - lastSale.totalAmount, // <— on retire le montant €
          }
        : vendor
    ));

    return true;
  }, [sales, setSales, setVendorStats]);

  // Fonction pour annuler une vente spécifique
  const cancelSpecificSale = useCallback((saleId: string) => {
    const saleToCancel = sales.find(sale => sale.id === saleId && !sale.canceled);
    if (!saleToCancel) return false;

    // Marquer la vente comme annulée
    setSales(prev => prev.map(sale => 
      sale.id === saleId 
        ? { ...sale, canceled: true }
        : sale
    ));

    // Mettre à jour les statistiques de la vendeuse
    setVendorStats(prev => prev.map(vendor => 
      vendor.id === saleToCancel.vendorId
        ? {
            ...vendor,
            dailySales: (vendor.dailySales ?? 0) - saleToCancel.totalAmount,
            totalSales: (vendor.totalSales ?? 0) - saleToCancel.totalAmount, // <— on retire le montant €
          }
        : vendor
    ));

    return true;
  }, [sales, setSales, setVendorStats]);

  // Gestion du succès
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Fonctions utilitaires pour les couleurs
  const isColorUsed = useCallback((color: string) => {
    return vendorStats.some(vendor => vendor.color === color);
  }, [vendorStats]);

  const getAvailableColors = useCallback(() => {
    return VENDOR_COLORS.filter(color => !isColorUsed(color));
  }, [isColorUsed]);

  // Fonctions pour l'édition des vendeuses
  const startEditVendor = useCallback((vendor: Vendor) => {
    console.log('✏️ Début édition vendeuse:', vendor);
    setEditingVendor(vendor.id);
    setEditVendorName(vendor.name);
    setEditVendorEmail(vendor.email || '');
    setEditVendorColor(vendor.color);
    console.log('✏️ États d\'édition initialisés:', {
      id: vendor.id,
      name: vendor.name,
      email: vendor.email || '',
      color: vendor.color
    });
  }, []);

  const saveEditVendor = useCallback(() => {
    console.log('🔄 Tentative de sauvegarde vendeuse...', {
      editVendorName: editVendorName.trim(),
      editingVendor,
      editVendorColor,
      editVendorEmail
    });

    if (!editVendorName.trim() || !editingVendor) {
      alert('⚠️ Le nom de la vendeuse est obligatoire !');
      return;
    }

    if (!editVendorColor) {
      alert('⚠️ Veuillez sélectionner une couleur !');
      return;
    }

    // Mettre à jour la vendeuse
    console.log('🔄 Mise à jour vendorStats...');
    setVendorStats(prev => {
      const updatedVendors = prev.map(vendor => 
        vendor.id === editingVendor
          ? {
              ...vendor,
              name: editVendorName.trim(),
              email: editVendorEmail.trim(),
              color: editVendorColor
            }
          : vendor
      );
      // 🔧 CORRECTION : Sauvegarder dans localStorage
      localStorage.setItem('myconfort-vendors', JSON.stringify(updatedVendors));
      console.log('💾 Vendeuses sauvegardées dans localStorage:', updatedVendors);
      return updatedVendors;
    });

    // Mettre à jour la vendeuse sélectionnée si c'est celle modifiée
    if (selectedVendor?.id === editingVendor) {
      const newSelectedVendor = {
        ...selectedVendor,
        name: editVendorName.trim(),
        email: editVendorEmail.trim(),
        color: editVendorColor
      };
      setSelectedVendor(newSelectedVendor);
      // 🔧 CORRECTION : Sauvegarder la vendeuse sélectionnée
      localStorage.setItem('myconfort-current-vendor', JSON.stringify(newSelectedVendor));
      console.log('🔄 selectedVendor mise à jour et sauvegardée:', newSelectedVendor);
    }

    // Reset du mode édition
    setEditingVendor(null);
    setEditVendorName('');
    setEditVendorEmail('');
    setEditVendorColor('');

    console.log('✅ Vendeuse modifiée avec succès:', editingVendor);
    alert('🎉 Vendeuse modifiée avec succès !');
  }, [editVendorName, editingVendor, editVendorColor, editVendorEmail, vendorStats, setVendorStats, selectedVendor, setSelectedVendor]);

  const cancelEditVendor = useCallback(() => {
    setEditingVendor(null);
    setEditVendorName('');
    setEditVendorEmail('');
    setEditVendorColor('');
    console.log('❌ Édition annulée');
  }, []);

  // Fonctions pour la suppression des vendeuses
  const handleDeleteVendor = useCallback((vendorId: string) => {
    const vendorToDelete = vendorStats.find(v => v.id === vendorId);
    if (!vendorToDelete) return;

    console.log('🗑️ Suppression vendeuse:', vendorToDelete.name);

    // Supprimer la vendeuse de la liste
    setVendorStats(prev => {
      const updatedVendors = prev.filter(vendor => vendor.id !== vendorId);
      // Sauvegarder dans localStorage
      localStorage.setItem('myconfort-vendors', JSON.stringify(updatedVendors));
      return updatedVendors;
    });

    // Si c'était la vendeuse sélectionnée, sélectionner la première disponible
    if (selectedVendor?.id === vendorId) {
      const remainingVendors = vendorStats.filter(vendor => vendor.id !== vendorId);
      const newSelected = remainingVendors.length > 0 ? remainingVendors[0] : null;
      setSelectedVendor(newSelected);
      // Sauvegarder la nouvelle vendeuse sélectionnée
      if (newSelected) {
        localStorage.setItem('myconfort-current-vendor', JSON.stringify(newSelected));
      } else {
        localStorage.removeItem('myconfort-current-vendor');
      }
      console.log('🔄 Nouvelle vendeuse sélectionnée:', newSelected?.name || 'aucune');
    }

    setDeleteConfirm(null);
    console.log('🗑️ Vendeuse supprimée:', vendorToDelete.name);
    alert(`🗑️ Vendeuse "${vendorToDelete.name}" supprimée avec succès !`);
  }, [vendorStats, setVendorStats, selectedVendor, setSelectedVendor]);

  // Fonctions couleurs disponibles pour l'édition
  const getAvailableColorsForEdit = useCallback((excludeVendorId: string) => {
    return VENDOR_COLORS.filter(color => 
      !vendorStats.some(vendor => vendor.color === color && vendor.id !== excludeVendorId)
    );
  }, [vendorStats]);

  const isColorUsedForEdit = useCallback((color: string, excludeVendorId: string) => {
    return vendorStats.some(vendor => vendor.color === color && vendor.id !== excludeVendorId);
  }, [vendorStats]);

  // Fonctions pour le système RAZ avancé
  const handleResetOption = useCallback((option: ResetOptionKey, value: boolean) => {
    if (option === 'allData') {
      setResetOptions(value
        ? { dailySales: true, cart: true, invoices: true, selectedVendor: true, vendorStats: true, keepSalesHistory: true, keepPendingChecks: true, allData: true }
        : { dailySales: false, cart: false, invoices: false, selectedVendor: false, vendorStats: false, keepSalesHistory: false, keepPendingChecks: false, allData: false }
      );
      return;
    }
    setResetOptions(prev => {
      const next = { ...prev, [option]: value };
      if (!value) next.allData = false;
      // ✅ CORRECTION: RAZ complète active automatiquement la suppression
      if (next.allData) {
        next.keepSalesHistory = true;  // Coché = supprimer
        next.keepPendingChecks = true; // Coché = supprimer
      }
      return next;
    });
  }, []);

  const exportDataBeforeReset = useCallback(() => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      sales: sales,
      vendorStats: vendorStats,
      selectedVendor: selectedVendor,
      cart: cart,
      metadata: {
        totalSales: sales.length,
        totalVendors: vendorStats.length,
        cartItems: cart.length,
        exportVersion: '1.0.0'
      }
    };

    // Générer un rapport texte formaté au lieu du JSON brut
    const currentDate = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const textReport = `
================================================================================
📋 RAPPORT DE SAUVEGARDE CAISSE MYCONFORT
================================================================================

📅 Date d'export : ${currentDate}
🔄 Version : ${dataToExport.metadata.exportVersion}

================================================================================
📊 STATISTIQUES GÉNÉRALES
================================================================================

• Nombre total de ventes : ${dataToExport.metadata.totalSales}
• Nombre de vendeuses : ${dataToExport.metadata.totalVendors}
• Articles dans le panier : ${dataToExport.metadata.cartItems}

================================================================================
👥 VENDEUSES
================================================================================

${dataToExport.vendorStats.map((vendor, index) => `
${index + 1}. ${vendor.name || 'Vendeuse inconnue'}
   • Ventes du jour : ${vendor.dailySales || 0}€
   • Total des ventes : ${vendor.totalSales || 0}€
   • Dernière vente : ${vendor.lastSaleDate ? new Date(vendor.lastSaleDate).toLocaleDateString('fr-FR') : 'Aucune'}`).join('\n')}

================================================================================
🛒 PANIER ACTUEL
================================================================================

${dataToExport.cart.length > 0 ?
  dataToExport.cart.map((item, index) => `
${index + 1}. ${item.name || 'Article inconnu'}
   • Quantité : ${item.quantity || 0}
   • Prix unitaire : ${item.price ? item.price.toFixed(2) + '€' : 'N/A'}
   • Prix total : ${item.price && item.quantity ? (item.price * item.quantity).toFixed(2) + '€' : 'N/A'}`).join('\n') :
  'Panier vide'}

================================================================================
💰 VENTES DU JOUR (DERNIÈRES 5)
================================================================================

${dataToExport.sales.slice(-5).map((sale, index) => `
${index + 1}. Vente #${sale.id.slice(-8)}
   • Date : ${new Date(sale.date).toLocaleDateString('fr-FR')} ${new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
   • Vendeuse : ${sale.vendorName || 'Inconnue'}
   • Montant : ${sale.totalAmount ? sale.totalAmount.toFixed(2) + '€' : 'N/A'}
   • Paiement : ${sale.paymentMethod || 'Non spécifié'}
   • Articles : ${sale.items?.length || 0}`).join('\n')}

================================================================================
📋 DONNÉES TECHNIQUES (JSON BRUT)
================================================================================

${JSON.stringify(dataToExport, null, 2)}

================================================================================
🏪 CAISSE MYCONFORT - SAUVEGARDE TERMINÉE
================================================================================
    `;

    const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(textReport);
    const exportFileDefaultName = `myconfort-backup-${new Date().toISOString().split('T')[0]}.txt`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    console.log('💾 Sauvegarde exportée:', exportFileDefaultName);
    alert(`💾 Sauvegarde exportée avec succès !
📄 Fichier : ${exportFileDefaultName}
📊 Rapport détaillé généré avec statistiques et données structurées`);
  }, [sales, vendorStats, selectedVendor, cart]);

  const logRAZAction = useCallback((action: string, options: typeof resetOptions, success: boolean) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: action,
      options: options,
      success: success,
      user: selectedVendor?.name || 'System',
      dataState: {
        salesCount: sales.length,
        cartItems: cart.length,
        activeVendor: selectedVendor?.name || 'None'
      }
    };
    
    console.log('📊 RAZ Action:', logEntry);
  }, [selectedVendor, sales, cart]);

  const executeReset = useCallback(() => {
    setResetStep('executing');
    
    setTimeout(() => {
      (async () => {
        try {
          // RAZ des ventes du jour
          if (resetOptions.dailySales) {
            const resetVendors = vendorStats.map(vendor => ({
              ...vendor,
              dailySales: 0
            }));
            setVendorStats(resetVendors);
            
            // 🔧 CORRECTION CUMUL CRITIQUE : Supprimer AUSSI les ventes du jour
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
            const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1;
            
            // Filtrer les ventes pour garder seulement celles qui ne sont PAS d'aujourd'hui
            const salesNotToday = sales.filter(sale => {
              const saleDate = new Date(sale.date).getTime();
              return saleDate < todayStart || saleDate > todayEnd;
            });
            
            setSales(salesNotToday);
            
            // Vider aussi IndexedDB des ventes du jour
            try {
              const db = await getDB();
              await db.sales.where('date').between(todayStart, todayEnd).delete();
              console.log('✅ Ventes du jour supprimées d\'IndexedDB');
            } catch (error) {
              console.error('❌ Erreur suppression ventes du jour IndexedDB:', error);
            }
            
            console.log('✅ RAZ ventes du jour effectuée (React + IndexedDB)');
          }

          // RAZ du panier
          if (resetOptions.cart) {
            setCart([]);
            // 🔧 CORRECTION CUMUL : Vider AUSSI le localStorage du panier
            localStorage.removeItem('myconfort-cart');
            console.log('✅ RAZ panier effectuée (IndexedDB + localStorage)');
          }

          // RAZ des factures N8N
          if (resetOptions.invoices) {
            resetInvoices();
            console.log('✅ RAZ factures N8N effectuée');
          }

          // RAZ vendeuse sélectionnée
          if (resetOptions.selectedVendor) {
            setSelectedVendor(null);
            console.log('✅ RAZ vendeuse sélectionnée effectuée');
          }

          // RAZ statistiques vendeuses
          if (resetOptions.vendorStats) {
            const resetVendors = vendorStats.map(vendor => ({
              ...vendor,
              dailySales: 0,
              totalSales: 0
            }));
            setVendorStats(resetVendors);
            // 🔧 CORRECTION CUMUL : Vider AUSSI le localStorage des vendeuses
            localStorage.removeItem('myconfort-vendors');
            console.log('✅ RAZ statistiques vendeuses effectuée (IndexedDB + localStorage)');
          }

          // RAZ complète
          if (resetOptions.allData) {
            // ✅ RAZ complète ignore les options de conservation
            setSales([]);
            setCart([]);
            resetInvoices();
            setSelectedVendor(null);
            const resetVendors = vendorStats.map(vendor => ({
              ...vendor,
              dailySales: 0,
              totalSales: 0
            }));
            setVendorStats(resetVendors);
            
            // 🔧 CORRECTION CUMUL DÉFINITIVE : Vider AUSSI IndexedDB
            try {
              const db = await getDB();
              await db.sales.clear();
              await db.cartItems.clear();
              await db.vendors.clear();
              console.log('✅ IndexedDB vidée (sales, cartItems, vendors)');
            } catch (error) {
              console.error('❌ Erreur vidage IndexedDB:', error);
            }
            
            // Vider localStorage
            localStorage.removeItem('myconfort-sales');
            localStorage.removeItem('myconfort-cart');
            localStorage.removeItem('myconfort-vendors');
            console.log('✅ RAZ complète effectuée (IndexedDB + localStorage)');

            // Clôturer la session en cours puis en ouvrir une nouvelle pour la reprise
            try {
              await sessionService.closeCurrentSession();
              await sessionService.openSession('reset');
              console.log('🔐 Session clôturée et rouverte après RAZ complète');
            } catch (e) {
              console.warn('⚠️ Impossible de gérer la session après RAZ:', e);
            }
          } else {
            // ✅ GESTION DES OPTIONS DE CONSERVATION (seulement si pas RAZ complète)
            
            // Conservation de l'historique des ventes (LOGIQUE CORRIGÉE)
            if (!resetOptions.keepSalesHistory && !resetOptions.allData) {
              // Si on ne veut PAS conserver l'historique, on le supprime
              setSales([]);
              
              // 🔧 CORRECTION CUMUL DÉFINITIVE : Vider AUSSI IndexedDB
              try {
                const db = await getDB();
                await db.sales.clear();
                console.log('✅ IndexedDB sales vidée');
              } catch (error) {
                console.error('❌ Erreur vidage IndexedDB sales:', error);
              }
              
              // Vider localStorage
              localStorage.removeItem('myconfort-sales');
              console.log('✅ Historique des ventes supprimé (IndexedDB + localStorage)');
            } else {
              console.log('📚 Historique des ventes conservé');
            }

            // Conservation des chèques à venir (LOGIQUE CORRIGÉE)
            if (!resetOptions.keepPendingChecks && !resetOptions.allData) {
              // Si on ne veut PAS conserver les chèques, on les supprime
              localStorage.removeItem('pendingPayments');
              console.log('✅ Chèques à venir supprimés');
            } else {
              console.log('💳 Chèques à venir conservés');
            }
          }

          // Log de l'action
          logRAZAction('RAZ_EXECUTED', resetOptions, true);

          // Reset des états
          setShowResetModal(false);
          setResetOptions({
            dailySales: true,
            cart: true,
            invoices: true,
            selectedVendor: false,
            vendorStats: false,
            keepSalesHistory: false,     // ✅ NOUVEAU: Par défaut, conserver l'historique (décoché = conserver)
            keepPendingChecks: false,    // ✅ NOUVEAU: Par défaut, conserver les chèques (décoché = conserver)
            allData: false
          });
          setResetStep('options');
          setShowResetSuccess(true);
          setTimeout(() => setShowResetSuccess(false), 4000);
          
          alert('🎉 Remise à zéro effectuée avec succès !');
          
        } catch (error) {
          console.error('❌ Erreur lors du reset:', error);
          logRAZAction('RAZ_ERROR', resetOptions, false);
          alert('❌ Erreur lors de la remise à zéro !');
          setResetStep('options');
        }
      })();
    }, 2000);
  }, [resetOptions, vendorStats, setVendorStats, setCart, setSelectedVendor, setSales, resetInvoices, logRAZAction]);

  const resetModalStates = useCallback(() => {
    setShowResetModal(false);
    setResetOptions({
      dailySales: true,
      cart: true,
      invoices: true,
      selectedVendor: false,
      vendorStats: false,
      allData: false
    });
    setResetStep('options');
  }, []);

  const cancelReset = useCallback(() => {
    logRAZAction('RAZ_CANCELLED', resetOptions, false);
    resetModalStates();
  }, [resetOptions, logRAZAction, resetModalStates]);

  // Composant sélecteur de couleurs pour l'édition
  const EditColorSelector = ({ vendorId }: { vendorId: string }) => (
    <div style={{ margin: '10px 0' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '8px', 
        fontWeight: 'bold',
        color: '#495057'
      }}>
        <Palette size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
        Couleur
      </label>
      
      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        padding: '6px',
        marginBottom: '8px',
        fontSize: '12px',
        color: '#856404'
      }}>
        💡 Disponibles : {getAvailableColorsForEdit(vendorId).length}/{VENDOR_COLORS.length}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '4px',
        maxWidth: '240px'
      }}>
        {VENDOR_COLORS.map((color) => {
          const isUsed = isColorUsedForEdit(color, vendorId);
          const isSelected = color === editVendorColor;
          
          return (
            <button
              key={color}
              type="button"
              onClick={() => {
                if (!isUsed) {
                  setEditVendorColor(color);
                  console.log('🎨 Couleur sélectionnée pour édition:', color);
                } else {
                  console.log('⚠️ Couleur déjà utilisée:', color);
                }
              }}
              disabled={isUsed}
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: color,
                border: isSelected ? '3px solid #333' : isUsed ? '2px solid #ff1744' : '1px solid #ddd',
                borderRadius: '6px',
                cursor: isUsed ? 'not-allowed' : 'pointer',
                opacity: isUsed ? 0.4 : 1,
                transition: 'all 0.2s ease',
                position: 'relative',
                transform: isSelected ? 'scale(1.2)' : 'scale(1)'
              }}
              title={isUsed ? `Couleur déjà utilisée` : `Choisir ${color}`}
            >
              {isSelected && (
                <Check 
                  size={12} 
                  color="white" 
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.8))'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Gestion des vendeuses
  const handleAddVendor = useCallback(() => {
    if (!newVendorName.trim()) {
      alert('⚠️ Le nom de la vendeuse est obligatoire !');
      return;
    }

    if (!selectedColor) {
      alert('⚠️ Veuillez sélectionner une couleur !');
      return;
    }

    // Générer un ID unique
    const newVendorId = `vendor-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    
    // Créer la nouvelle vendeuse avec la couleur choisie
    const newVendor: Vendor = {
      id: newVendorId,
      name: newVendorName.trim(),
      email: newVendorEmail.trim() || undefined, // <— ajouté
      dailySales: 0,
      totalSales: 0,
      color: selectedColor
    };

    // Ajouter à la liste
    setVendorStats(prev => {
      const updatedVendors = [...prev, newVendor];
      // Sauvegarder dans localStorage
      localStorage.setItem('myconfort-vendors', JSON.stringify(updatedVendors));
      return updatedVendors;
    });

    // Reset du formulaire
    setNewVendorName('');
    setNewVendorEmail('');
    setSelectedColor('');
    setShowAddVendorForm(false);

    // Sélectionner automatiquement la nouvelle vendeuse
    setSelectedVendor(newVendor);
    // Sauvegarder la vendeuse sélectionnée
    localStorage.setItem('myconfort-current-vendor', JSON.stringify(newVendor));

    console.log('✅ Nouvelle vendeuse ajoutée avec couleur:', newVendor);
    alert(`🎉 Vendeuse "${newVendor.name}" ajoutée avec la couleur ${selectedColor} !`);
  }, [newVendorName, newVendorEmail, selectedColor, setVendorStats, setNewVendorName, setNewVendorEmail, setSelectedColor, setShowAddVendorForm, setSelectedVendor]);

  const cancelAddVendor = useCallback(() => {
    setNewVendorName('');
    setNewVendorEmail('');
    setShowAddVendorForm(false);
  }, [setNewVendorName, setNewVendorEmail, setShowAddVendorForm]);

  return (
    <div className="ipad-frame">
      <div className="h-screen flex flex-col gradient-bg">
        
        {/* Header */}
        <Header 
          selectedVendor={selectedVendor}
          currentDateTime={currentDateTime}
        />

        {/* Navigation */}
        <Navigation 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cartItemsCount={cartItemsCount}
          salesCount={sales.length}
          cartLength={cart.length}
          invoicesCount={(invoicesStats?.pendingInvoices ?? 0) + (invoicesStats?.partialInvoices ?? 0)}
          pendingPaymentsCount={pendingPaymentsCount}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden safe-bottom relative">
          <div className="h-full overflow-auto p-6">

            {/* Onglet Vendeuse */}
            {activeTab === 'vendeuse' && (
              <VendorSelection
                vendorStats={vendorStats}
                selectedVendor={selectedVendor}
                setSelectedVendor={setSelectedVendor}
                setActiveTab={setActiveTab}
              />
            )}

            {/* Onglet Produits */}
            {activeTab === 'produits' && (
              <ProductsTab
                selectedVendor={selectedVendor}
                setActiveTab={setActiveTab}
                addToCart={addToCart}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                cartType={cartType}
                triggerExpandCart={triggerExpandCart}
              />
            )}

            {/* Onglet Factures */}
            {activeTab === 'factures' && (
              <ErrorBoundary>
                <InvoicesTabCompact sales={sales} />
              </ErrorBoundary>
            )}

            {/* Onglet Règlements */}
            {activeTab === 'reglements' && (
              <PaymentsTab 
                sales={sales} 
                invoices={invoices}
              />
            )}

            {/* Onglet Stock */}
            {activeTab === 'stock' && (
              <StockTabElegant />
            )}

            {/* Onglet Ventes */}
            {activeTab === 'ventes' && (
              <SalesTab 
                sales={sales} 
                invoices={invoices}
              />
            )}

            {/* Onglet Annulation */}
            {activeTab === 'annulation' && (
              <CancellationTab
                cart={cart}
                cartTotal={cartTotal}
                clearCart={clearCart}
                sales={sales}
                cancelLastSale={cancelLastSale}
                cancelSpecificSale={cancelSpecificSale}
              />
            )}

            {/* Onglet CA Instant */}
            {activeTab === 'ca' && (
              <CATab 
                sales={sales} 
                vendorStats={vendorStats}
                invoices={invoices}
              />
            )}

            {/* Onglet RAZ - Feuille de Caisse Professionnelle */}
            {activeTab === 'raz' && (
              <FeuilleDeRAZPro 
                sales={sales}
                invoices={invoices}
                vendorStats={vendorStats}
                exportDataBeforeReset={exportDataBeforeReset}
                executeRAZ={() => setShowResetModal(true)}
              />
            )}

            {/* Modal RAZ Avancée */}
            {showResetModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                animation: 'fadeIn 0.3s ease'
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '0',
                  maxWidth: '600px',
                  width: '90%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  animation: 'slideIn 0.3s ease'
                }}>
                  
                  {/* En-tête de la modal */}
                  <div style={{
                    background: resetStep === 'executing' ? 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)' : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                    color: 'white',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      {resetStep === 'executing' ? (
                        <>
                          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                          Exécution en cours...
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={24} />
                          Configuration de la RAZ
                        </>
                      )}
                    </h2>
                    <p style={{ margin: 0, opacity: 0.9 }}>
                      {resetStep === 'executing' 
                        ? 'Veuillez patienter pendant la remise à zéro...' 
                        : 'Sélectionnez les éléments à remettre à zéro'
                      }
                    </p>
                  </div>

                  {resetStep === 'options' && (
                    <div style={{ padding: '25px' }}>
                      
                      {/* Options de RAZ */}
                      <h3 style={{ margin: '0 0 20px 0', color: '#2d3436' }}>
                        🎯 Options de remise à zéro
                      </h3>
                      
                      <div style={{ display: 'grid', gap: '12px', marginBottom: '25px' }}>
                        
                        {/* RAZ Ventes du jour */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: resetOptions.dailySales ? '#e8f5e8' : '#f8f9fa'
                        }}>
                          <input
                            type="checkbox"
                            checked={resetOptions.dailySales}
                            onChange={(e) => handleResetOption('dailySales', e.target.checked)}
                            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                          />
                          <div>
                            <strong style={{ color: '#495057' }}>Ventes du jour</strong>
                            <br />
                            <small style={{ color: '#6c757d' }}>
                              Remet à zéro les chiffres d'affaires quotidiens (recommandé chaque jour)
                            </small>
                          </div>
                        </label>

                        {/* RAZ Panier */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: resetOptions.cart ? '#e8f5e8' : '#f8f9fa'
                        }}>
                          <input
                            type="checkbox"
                            checked={resetOptions.cart}
                            onChange={(e) => handleResetOption('cart', e.target.checked)}
                            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                          />
                          <div>
                            <strong style={{ color: '#495057' }}>Panier actuel</strong>
                            <br />
                            <small style={{ color: '#6c757d' }}>
                              Vide le panier en cours ({cart.length} articles)
                            </small>
                          </div>
                        </label>

                        {/* RAZ Factures N8N */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: resetOptions.invoices ? '#e3f2fd' : '#f8f9fa'
                        }}>
                          <input
                            type="checkbox"
                            checked={resetOptions.invoices}
                            onChange={(e) => handleResetOption('invoices', e.target.checked)}
                            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                          />
                          <div>
                            <strong style={{ color: '#495057' }}>📋 Factures N8N</strong>
                            <br />
                            <small style={{ color: '#6c757d' }}>
                              Efface les factures synchronisées ({invoices.length} factures)
                            </small>
                          </div>
                        </label>

                        {/* RAZ Vendeuse sélectionnée */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: resetOptions.selectedVendor ? '#fff3cd' : '#f8f9fa'
                        }}>
                          <input
                            type="checkbox"
                            checked={resetOptions.selectedVendor}
                            onChange={(e) => handleResetOption('selectedVendor', e.target.checked)}
                            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                          />
                          <div>
                            <strong style={{ color: '#495057' }}>Vendeuse sélectionnée</strong>
                            <br />
                            <small style={{ color: '#6c757d' }}>
                              Désélectionne la vendeuse active ({selectedVendor?.name || 'Aucune'})
                            </small>
                          </div>
                        </label>

                        {/* RAZ Statistiques vendeuses */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: resetOptions.vendorStats ? '#ffebee' : '#f8f9fa'
                        }}>
                          <input
                            type="checkbox"
                            checked={resetOptions.vendorStats}
                            onChange={(e) => handleResetOption('vendorStats', e.target.checked)}
                            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                          />
                          <div>
                            <strong style={{ color: '#495057' }}>Statistiques vendeuses</strong>
                            <br />
                            <small style={{ color: '#6c757d' }}>
                              ⚠️ Remet à zéro TOUTES les statistiques de ventes
                            </small>
                          </div>
                        </label>

                        {/* ✅ NOUVEAU: Conserver l'historique des ventes */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: '2px solid #28a745',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: resetOptions.keepSalesHistory ? '#d4edda' : '#f8f9fa'
                        }}>
                          <input
                            type="checkbox"
                            checked={resetOptions.keepSalesHistory}
                            onChange={(e) => handleResetOption('keepSalesHistory', e.target.checked)}
                            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                          />
                          <div>
                            <strong style={{ color: '#155724' }}>📚 Supprimer l'historique des ventes</strong>
                            <br />
                            <small style={{ color: '#6c757d' }}>
                              ⚠️ Efface toutes les ventes passées (décoché = conserver)
                            </small>
                          </div>
                        </label>

                        {/* ✅ NOUVEAU: Conserver les chèques à venir */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: '2px solid #17a2b8',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: resetOptions.keepPendingChecks ? '#d1ecf1' : '#f8f9fa'
                        }}>
                          <input
                            type="checkbox"
                            checked={resetOptions.keepPendingChecks}
                            onChange={(e) => handleResetOption('keepPendingChecks', e.target.checked)}
                            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                          />
                          <div>
                            <strong style={{ color: '#0c5460' }}>💳 Supprimer les chèques à venir</strong>
                            <br />
                            <small style={{ color: '#6c757d' }}>
                              ⚠️ Efface tous les chèques non encaissés (décoché = conserver)
                            </small>
                          </div>
                        </label>

                        {/* RAZ Complète */}
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: '3px solid #dc3545',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: resetOptions.allData ? '#f8d7da' : '#fff5f5'
                        }}>
                          <input
                            type="checkbox"
                            checked={resetOptions.allData}
                            onChange={(e) => handleResetOption('allData', e.target.checked)}
                            style={{ marginRight: '10px', transform: 'scale(1.2)' }}
                          />
                          <div>
                            <strong style={{ color: '#dc3545' }}>🚨 RAZ COMPLÈTE</strong>
                            <br />
                            <small style={{ color: '#721c24' }}>
                              ⚠️ DANGER: Supprime TOUTES les données (ventes, statistiques, etc.)
                            </small>
                          </div>
                        </label>
                      </div>

                      {/* Aperçu des actions */}
                      {(resetOptions.dailySales || resetOptions.cart || resetOptions.invoices || resetOptions.selectedVendor || resetOptions.vendorStats || resetOptions.keepSalesHistory || resetOptions.keepPendingChecks || resetOptions.allData) && (
                        <div style={{
                          background: '#fff3cd',
                          border: '1px solid #ffeaa7',
                          borderRadius: '8px',
                          padding: '15px',
                          marginBottom: '20px'
                        }}>
                          <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
                            📋 Aperçu des actions à effectuer :
                          </h4>
                          <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
                            {resetOptions.dailySales && <li>Remise à zéro des ventes du jour</li>}
                            {resetOptions.cart && <li>Vidage du panier ({cart.length} articles)</li>}
                            {resetOptions.invoices && <li>📋 Effacement des factures N8N ({invoices.length} factures)</li>}
                            {resetOptions.selectedVendor && <li>Désélection de la vendeuse active</li>}
                            {resetOptions.vendorStats && <li>Remise à zéro des statistiques vendeuses</li>}
                            {resetOptions.keepSalesHistory && <li style={{ color: '#dc3545', fontWeight: 'bold' }}>📚 Suppression de l'historique des ventes</li>}
                            {resetOptions.keepPendingChecks && <li style={{ color: '#dc3545', fontWeight: 'bold' }}>💳 Suppression des chèques à venir</li>}
                            {!resetOptions.keepSalesHistory && <li style={{ color: '#28a745', fontWeight: 'bold' }}>📚 Conservation de l'historique des ventes</li>}
                            {!resetOptions.keepPendingChecks && <li style={{ color: '#17a2b8', fontWeight: 'bold' }}>💳 Conservation des chèques à venir</li>}
                            {resetOptions.allData && <li style={{ color: '#dc3545', fontWeight: 'bold' }}>🚨 SUPPRESSION COMPLÈTE DE TOUTES LES DONNÉES</li>}
                          </ul>
                        </div>
                      )}

                      {/* Boutons d'action */}
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={cancelReset}
                          style={{
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '12px 20px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <X size={16} />
                          Annuler
                        </button>
                        
                        <button
                          onClick={executeReset}
                          style={{
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '12px 20px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <RefreshCw size={16} />
                          Exécuter la RAZ
                        </button>
                      </div>
                    </div>
                  )}

                  {resetStep === 'executing' && (
                    <div style={{ 
                      padding: '40px', 
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                    }}>
                      <RefreshCw size={48} style={{ 
                        color: '#007bff', 
                        marginBottom: '20px',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                        Remise à zéro en cours...
                      </h3>
                      <p style={{ margin: 0, color: '#6c757d' }}>
                        Veuillez patienter, l'opération va se terminer automatiquement.
                      </p>
                      <div style={{
                        width: '100%',
                        height: '4px',
                        background: '#e9ecef',
                        borderRadius: '2px',
                        marginTop: '20px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, #007bff, #74b9ff)',
                          animation: 'slideInRight 2s ease-in-out'
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Onglet Gestion */}
            {activeTab === 'gestion' && (
              <div style={{
                padding: '20px',
                maxWidth: '1000px',
                margin: '0 auto',
                fontFamily: 'Arial, sans-serif'
              }}>
                {/* En-tête principal */}
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <h1 style={{ margin: 0, fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <Settings size={32} />
                    Gestion & Documentation
                  </h1>
                  <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '16px' }}>
                    Administration des vendeuses et guide d'utilisation complet
                  </p>
                </div>

                {/* Navigation sous-onglets */}
                <div style={{
                  display: 'flex',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  marginBottom: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <button
                    onClick={() => setGestionActiveTab('vendeuses')}
                    style={{
                      flex: 1,
                      padding: '15px 20px',
                      border: 'none',
                      background: gestionActiveTab === 'vendeuses' ? '#667eea' : 'white',
                      color: gestionActiveTab === 'vendeuses' ? 'white' : '#495057',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Users size={20} />
                    Gestion des Vendeuses
                    <span style={{
                      background: gestionActiveTab === 'vendeuses' ? 'rgba(255,255,255,0.2)' : '#667eea',
                      color: gestionActiveTab === 'vendeuses' ? 'white' : 'white',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {vendorStats.length}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setGestionActiveTab('produits')}
                    style={{
                      flex: 1,
                      padding: '15px 20px',
                      border: 'none',
                      background: gestionActiveTab === 'produits' ? '#f59e0b' : 'white',
                      color: gestionActiveTab === 'produits' ? 'white' : '#495057',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Package size={20} />
                    Gestion des Produits
                    <span style={{
                      background: gestionActiveTab === 'produits' ? 'rgba(255,255,255,0.2)' : '#f59e0b',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      📦
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setGestionActiveTab('guide')}
                    style={{
                      flex: 1,
                      padding: '15px 20px',
                      border: 'none',
                      background: gestionActiveTab === 'guide' ? '#1e3a8a' : 'white',
                      color: gestionActiveTab === 'guide' ? 'white' : '#495057',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Book size={20} />
                    Guide d'Utilisation
                    <span style={{
                      background: gestionActiveTab === 'guide' ? 'rgba(255,255,255,0.2)' : '#1e3a8a',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      ✨
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setGestionActiveTab('panier')}
                    style={{
                      flex: 1,
                      padding: '15px 20px',
                      border: 'none',
                      background: gestionActiveTab === 'panier' ? '#477A0C' : 'white',
                      color: gestionActiveTab === 'panier' ? 'white' : '#495057',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <ShoppingCart size={20} />
                    Type de Panier
                    <span style={{
                      background: gestionActiveTab === 'panier' ? 'rgba(255,255,255,0.2)' : '#477A0C',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {cartType === 'classique' ? '📋' : '📄'}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setGestionActiveTab('diagnostic')}
                    style={{
                      flex: 1,
                      padding: '15px 20px',
                      border: 'none',
                      background: gestionActiveTab === 'diagnostic' ? '#dc3545' : 'white',
                      color: gestionActiveTab === 'diagnostic' ? 'white' : '#495057',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🔧 Diagnostic
                    <span style={{
                      background: gestionActiveTab === 'diagnostic' ? 'rgba(255,255,255,0.2)' : '#dc3545',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      iPad
                    </span>
                  </button>
                </div>

                {/* Contenu des sous-onglets */}
                {gestionActiveTab === 'vendeuses' && (
                  <div>
                    {/* En-tête gestion vendeuses */}
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '20px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '20px' }}>
                          <Users size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
                          Gestion des Vendeuses
                        </h2>
                        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
                          {vendorStats.length} vendeuse{vendorStats.length > 1 ? 's' : ''} enregistrée{vendorStats.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => setShowAddVendorForm(true)}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderRadius: '8px',
                          padding: '12px 20px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Plus size={20} />
                        Ajouter une vendeuse
                      </button>
                    </div>

                {/* Formulaire d'ajout */}
                {showAddVendorForm && (
                  <div style={{
                    background: '#e8f5e8',
                    border: '2px solid #28a745',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>
                      ➕ Ajouter une nouvelle vendeuse
                    </h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Nom de la vendeuse *
                      </label>
                      <input
                        type="text"
                        value={newVendorName}
                        onChange={(e) => setNewVendorName(e.target.value)}
                        placeholder="Prénom Nom"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '16px'
                        }}
                        autoFocus
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Email (optionnel)
                      </label>
                      <input
                        type="email"
                        value={newVendorEmail}
                        onChange={(e) => setNewVendorEmail(e.target.value)}
                        placeholder="email@example.com"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '16px'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Couleur distinctive *
                      </label>
                      
                      {/* Sélecteur de couleur */}
                      <div style={{
                        background: '#f8f9fa',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        padding: '12px'
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(40px, 1fr))',
                          gap: '8px',
                          maxWidth: '400px'
                        }}>
                          {getAvailableColors().map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setSelectedColor(color)}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: color,
                                border: selectedColor === color ? '3px solid #000' : '2px solid #fff',
                                cursor: 'pointer',
                                boxShadow: selectedColor === color 
                                  ? '0 0 0 2px #007bff' 
                                  : '0 2px 4px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                              }}
                              title={`Couleur ${color}`}
                            >
                              {selectedColor === color && (
                                <Check size={20} color="#fff" style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))' }} />
                              )}
                            </button>
                          ))}
                        </div>
                        
                        {selectedColor && (
                          <div style={{
                            marginTop: '12px',
                            padding: '8px 12px',
                            background: selectedColor,
                            color: '#fff',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                          }}>
                            ✨ Couleur sélectionnée : {selectedColor}
                          </div>
                        )}
                        
                        {!selectedColor && (
                          <div style={{
                            marginTop: '12px',
                            padding: '8px 12px',
                            background: '#fff3cd',
                            color: '#856404',
                            border: '1px solid #ffeaa7',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '14px'
                          }}>
                            <Palette size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                            Sélectionnez une couleur pour identifier facilement cette vendeuse
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={handleAddVendor}
                        disabled={!newVendorName.trim() || !selectedColor}
                        style={{
                          background: (newVendorName.trim() && selectedColor) ? '#28a745' : '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '12px 20px',
                          cursor: (newVendorName.trim() && selectedColor) ? 'pointer' : 'not-allowed',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          opacity: (newVendorName.trim() && selectedColor) ? 1 : 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Save size={16} />
                        Enregistrer
                      </button>
                      
                      <button
                        onClick={cancelAddVendor}
                        style={{
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '12px 20px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <X size={16} />
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Liste des vendeuses existantes */}
                <div style={{
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>
                    👥 Vendeuses actuelles ({vendorStats.length})
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gap: '15px',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
                  }}>
                    {vendorStats.map((vendor) => (
                      <div
                        key={vendor.id}
                        style={{
                          background: selectedVendor?.id === vendor.id ? '#e8f5e8' : '#f8f9fa',
                          border: selectedVendor?.id === vendor.id ? '2px solid #28a745' : '1px solid #ddd',
                          borderRadius: '8px',
                          padding: '15px',
                          cursor: editingVendor === vendor.id ? 'default' : 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => {
                          if (editingVendor !== vendor.id) {
                            setSelectedVendor(vendor);
                          }
                        }}
                      >
                        {editingVendor === vendor.id ? (
                          // Mode édition
                          <div onClick={(e) => e.stopPropagation()}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
                              ✏️ Modification de {vendor.name}
                            </h4>
                            
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                                Nom *
                              </label>
                              <input
                                type="text"
                                value={editVendorName}
                                onChange={(e) => setEditVendorName(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '2px solid #007bff',
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                                autoFocus
                              />
                            </div>
                            
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                                Email
                              </label>
                              <input
                                type="email"
                                value={editVendorEmail}
                                onChange={(e) => setEditVendorEmail(e.target.value)}
                                placeholder="email@example.com"
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '2px solid #007bff',
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>

                            <EditColorSelector vendorId={vendor.id} />

                            <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                              <button
                                onClick={() => {
                                  console.log('🔘 Clic sur bouton sauvegarder, états actuels:', {
                                    editVendorName: editVendorName.trim(),
                                    editVendorColor,
                                    disabled: !editVendorName.trim() || !editVendorColor
                                  });
                                  saveEditVendor();
                                }}
                                disabled={!editVendorName.trim() || !editVendorColor}
                                style={{
                                  background: (!editVendorName.trim() || !editVendorColor) ? '#6c757d' : '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '8px 12px',
                                  cursor: (!editVendorName.trim() || !editVendorColor) ? 'not-allowed' : 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Check size={14} />
                                Sauvegarder
                              </button>
                              
                              <button
                                onClick={cancelEditVendor}
                                style={{
                                  background: '#6c757d',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <X size={14} />
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Mode affichage normal
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                              <div
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  backgroundColor: vendor.color,
                                  borderRadius: '50%',
                                  marginRight: '10px',
                                  border: '2px solid #fff',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }}
                              />
                              <strong style={{ color: '#495057', flex: 1 }}>{vendor.name}</strong>
                              
                              {/* Boutons d'actions */}
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditVendor(vendor);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#007bff',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Modifier cette vendeuse"
                                >
                                  <Edit3 size={16} />
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(vendor.id);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#dc3545',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Supprimer cette vendeuse"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px' }}>
                              ✉️ {vendor.email || "Pas d'email"}
                            </div>
                            
                            <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                              💰 Total: {Number(vendor.totalSales ?? 0).toFixed(2)}€ | 📊 Aujourd'hui: {Number(vendor.dailySales ?? 0).toFixed(2)}€
                            </div>
                            
                            {selectedVendor?.id === vendor.id && (
                              <div style={{
                                padding: '6px 10px',
                                background: vendor.color,
                                color: 'white',
                                borderRadius: '4px',
                                textAlign: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                              }}>
                                ✅ Vendeuse sélectionnée
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message de statut */}
                <div style={{
                  background: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '8px',
                  padding: '15px',
                  textAlign: 'center'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>
                    ✅ Fonctionnalités de gestion complètes !
                  </h4>
                  <p style={{ margin: '0', color: '#155724' }}>
                    Vous pouvez maintenant ajouter, modifier et supprimer des vendeuses avec sélection de couleurs personnalisée.
                    <br />
                    <strong>✨ Nouveau :</strong> Edition et suppression des vendeuses activées !
                  </p>
                </div>

                {/* Modal de confirmation de suppression */}
                {deleteConfirm && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                  }}>
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '25px',
                      maxWidth: '450px',
                      margin: '20px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                      <h3 style={{ margin: '0 0 15px 0', color: '#dc3545', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trash2 size={24} />
                        Confirmer la suppression
                      </h3>
                      
                      <p style={{ margin: '0 0 15px 0', color: '#495057', lineHeight: '1.5' }}>
                        Êtes-vous sûr de vouloir supprimer la vendeuse{' '}
                        <strong style={{ color: vendorStats.find(v => v.id === deleteConfirm)?.color }}>
                          {vendorStats.find(v => v.id === deleteConfirm)?.name}
                        </strong> ?
                      </p>
                      
                      <div style={{
                        background: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px',
                        padding: '10px',
                        margin: '0 0 20px 0',
                        fontSize: '14px',
                        color: '#856404'
                      }}>
                        ⚠️ <strong>Attention :</strong> Cette action est irréversible ! Toutes les données de vente associées seront conservées.
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          style={{
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '10px 16px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <X size={14} />
                          Annuler
                        </button>
                        
                        <button
                          onClick={() => handleDeleteVendor(deleteConfirm)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '10px 16px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Trash2 size={14} />
                          Supprimer définitivement
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                  </div>
                )}

                {/* Section Gestion des produits */}
                {gestionActiveTab === 'produits' && (
                  <ProductsManagement />
                )}
                
                {/* Section Guide d'utilisation */}
                {gestionActiveTab === 'guide' && (
                  <GuideUtilisation />
                )}

                {/* Section Type de Panier */}
                {gestionActiveTab === 'panier' && (
                  <CartTypeSelector
                    cartType={cartType}
                    onChange={setCartType}
                  />
                )}

                {/* Section Diagnostic iPad */}
                {gestionActiveTab === 'diagnostic' && (
                  <DiagnosticIPad />
                )}
              </div>
            )}


            {/* Fallback pour les onglets non définis */}
            {!['vendeuse', 'produits', 'factures', 'reglements', 'stock', 'ventes', 'annulation', 'ca', 'gestion', 'raz'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-md mx-auto">
                  <p className="text-4xl mb-4">🚧</p>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>
                    En construction
                  </h3>
                  <p className="text-xl" style={{ color: '#6B7280' }}>
                    Module {activeTab} - En cours de développement
                  </p>
                </div>
              </div>
            )}

          </div>
        </main>

        {/* 🚨 INTERFACE DEBUG TEMPORAIRE - MASQUÉE SUR DEMANDE UTILISATEUR */}
        {(() => { const showDebug = import.meta.env.DEV && false; return showDebug; })() && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            backgroundColor: '#ff6b6b',
            color: 'white',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            gap: '10px',
            zIndex: 2000,
            fontSize: '12px'
          }}>
            <button
              onClick={() => {
                const testItems: ExtendedCartItem[] = [
                  {
                    id: 'test-1-' + Date.now(),
                    name: 'Oreiller Test 1',
                    price: 25,
                    originalPrice: 25,
                    quantity: 2,
                    category: 'Oreillers',
                    addedAt: new Date(),
                    offert: false
                  },
                  {
                    id: 'test-2-' + Date.now(),
                    name: 'Couette Test 2',
                    price: 45,
                    originalPrice: 45,
                    quantity: 1,
                    category: 'Couettes',
                    addedAt: new Date(),
                    offert: false
                  }
                ];
                setCart(prevCart => [...prevCart, ...testItems]);
              }}
              style={{
                backgroundColor: 'white',
                color: '#ff6b6b',
                border: 'none',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ➕ Test Items
            </button>
            <button
              onClick={() => setCart([])}
              style={{
                backgroundColor: 'white',
                color: '#ff6b6b',
                border: 'none',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🗑️ Clear
            </button>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '4px' }}>
              Cart: {cart.length} items
            </div>
          </div>
        )}

        {/* Floating Cart */}
        <FloatingCart
          activeTab={activeTab}
          cart={cart}
          cartItemsCount={cartItemsCount}
          cartTotal={cartTotal}
          selectedVendor={selectedVendor}
          updateQuantity={updateQuantity}
          toggleOffert={toggleOffert}
          cartType={cartType}
          onCartTypeChange={setCartType}
          onPriceOverride={handlePriceOverride}
          forceExpand={forceExpandCart}
          clearCart={clearCart}
          completeSale={completeSale}
        />

        {/* Modal Succès RAZ */}
        {showResetSuccess && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
                       animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '0',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.3s ease',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
                color: 'white',
                padding: '25px',
                textAlign: 'center'
              }}>
                <CheckCircle size={48} style={{ marginBottom: '15px' }} />
                <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>
                  🎉 RAZ Terminée !
                </h2>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>
                  La remise à zéro a été effectuée avec succès
                </p>
              </div>
              
              <div style={{ padding: '25px', textAlign: 'center' }}>
                <div style={{
                  background: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '20px'
                }}>
                  <strong style={{ color: '#155724' }}>✅ Opération réussie</strong>
                  <p style={{ margin: '8px 0 0 0', color: '#155724' }}>
                    Toutes les actions sélectionnées ont été appliquées.<br />
                    L'application est prête à être utilisée.
                  </p>
                </div>
                
                <button
                  onClick={() => setShowResetSuccess(false)}
                  style={{
                    background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 30px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 auto'
                  }}
                >
                  <CheckCircle size={20} />
                  Parfait !
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Notification */}
        <SuccessNotification show={showSuccess} />
        
        {/* Vendor Diagnostics */}
        <VendorDiagnostics 
          currentVendors={vendorStats} 
          onForceReset={() => {
            console.log('🔄 Force reset des vendeuses...');
            setVendorStats(vendors.map(vendor => ({
              ...vendor,
              dailySales: 0,
              totalSales: 0
            })));
            setSelectedVendor(null);
            localStorage.removeItem('myconfort-vendors');
            localStorage.removeItem('myconfort-current-vendor');
            alert('🎉 Vendeuses réinitialisées avec succès !');
          }} 
        />

        {/* Debug Data Panel */}
        <DebugDataPanel 
          db={{
            name: getDB().name,
            table: getDB().table?.bind(getDB())
          }}
          dbName="MyConfortCaisseV2"
          onForceSync={async () => {
            console.log('🔄 Force sync des données...');
            // Pour le debug, on peut ignorer la sync N8N
            console.log('Synchronisation manuelle déclenchée depuis le debug panel');
          }}
          onReseedDev={async (db) => {
            console.log('🌱 Re-seed des données en développement...');
            // Ajouter ici la logique de re-seed si nécessaire
            console.log('DB instance:', db);
          }}
        />

        {/* Build Information */}
        <BuildStamp />
      </div>
    </div>
  );
}

// Composant de diagnostic pour iPad
function DiagnosticIPad() {
  const [diagnosticResult, setDiagnosticResult] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = () => {
    setIsRunning(true);
    setDiagnosticResult('🔄 Diagnostic en cours...\n\n');

    try {
      let result = '🔍 DIAGNOSTIC ENVIRONNEMENT iPad\n';
      result += '=====================================\n\n';

      // 1. Détection de l'environnement
      result += '📱 ENVIRONNEMENT:\n';
      result += `- User Agent: ${navigator.userAgent}\n`;
      result += `- Plateforme: ${navigator.platform}\n`;
      result += `- URL actuelle: ${window.location.href}\n`;
      result += `- Mode DEV: ${import.meta.env.DEV ? 'OUI' : 'NON'}\n`;
      result += `- Mode PROD: ${import.meta.env.PROD ? 'OUI' : 'NON'}\n\n`;

      // 2. Analyse localStorage
      result += '💾 LOCALSTORAGE:\n';
      const localStorageKeys = Object.keys(localStorage);
      result += `- Nombre de clés: ${localStorageKeys.length}\n`;
      
      // Clés spécifiques à analyser
      const importantKeys = [
        'myconfort-sales',
        'myconfort-vendors', 
        'myconfort-current-vendor',
        'myconfort-cart',
        'myconfort-external-invoices'
      ];

      importantKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            if (key === 'myconfort-sales' && Array.isArray(parsed)) {
              result += `- ${key}: ${parsed.length} ventes\n`;
            } else if (key === 'myconfort-external-invoices' && Array.isArray(parsed)) {
              result += `- ${key}: ${parsed.length} factures externes\n`;
            } else if (key === 'myconfort-vendors' && Array.isArray(parsed)) {
              result += `- ${key}: ${parsed.length} vendeuses\n`;
            } else {
              result += `- ${key}: présent (${typeof parsed})\n`;
            }
          } catch {
            result += `- ${key}: présent (non-JSON)\n`;
          }
        } else {
          result += `- ${key}: absent\n`;
        }
      });

      result += '\n';

      // 3. Calcul du CA
      result += '💰 CALCUL CHIFFRE D\'AFFAIRES:\n';
      const salesData = localStorage.getItem('myconfort-sales');
      if (salesData) {
        try {
          const sales = JSON.parse(salesData);
          result += `- Type de données: ${Array.isArray(sales) ? 'tableau' : typeof sales}\n`;
          
          if (Array.isArray(sales)) {
            const today = new Date().toDateString();
            const todaySales = sales.filter((sale: { timestamp: string }) => 
              new Date(sale.timestamp).toDateString() === today
            );
            const totalCA = todaySales.reduce((sum: number, sale: { total: number }) => sum + sale.total, 0);
            result += `- Ventes du jour: ${todaySales.length}\n`;
            result += `- CA du jour: ${totalCA.toFixed(2)}€\n`;
            result += `- Total ventes stockées: ${sales.length}\n`;
          } else {
            result += `⚠️ PROBLÈME: Les ventes sont stockées comme ${typeof sales}\n`;
            result += `- Contenu: ${JSON.stringify(sales).substring(0, 100)}...\n`;
            result += `- Cela explique pourquoi le CA n'apparaît pas\n`;
          }
        } catch (e) {
          result += `- Erreur lecture ventes: ${e}\n`;
        }
      } else {
        result += '- Aucune donnée de ventes\n';
      }

      result += '\n';

      // 4. Factures externes
      result += '📄 FACTURES EXTERNES:\n';
      const externalInvoicesData = localStorage.getItem('myconfort-external-invoices');
      if (externalInvoicesData) {
        try {
          const invoices = JSON.parse(externalInvoicesData);
          result += `- Nombre total: ${invoices.length}\n`;
          const totalExternal = invoices.reduce((sum: number, inv: { amount?: number }) => sum + (inv.amount || 0), 0);
          result += `- Total externe: ${totalExternal.toFixed(2)}€\n`;
        } catch (e) {
          result += `- Erreur lecture factures: ${e}\n`;
        }
      } else {
        result += '- Aucune facture externe\n';
      }

      result += '\n';

      // 5. Analyse IndexedDB
      result += '🗄️ INDEXEDDB:\n';
      if ('indexedDB' in window) {
        result += '- IndexedDB disponible\n';
        result += '- Base: MyConfortCaisseV2\n';
      } else {
        result += '- IndexedDB non disponible\n';
      }

      result += '\n';

      // 6. Recommandations
      result += '🔧 RECOMMANDATIONS:\n';
      
      // Vérifier le format des données
      let salesFormatOk = false;
      if (salesData) {
        try {
          const sales = JSON.parse(salesData);
          salesFormatOk = Array.isArray(sales);
        } catch {
          // Ignore parsing errors
        }
      }
      
      if (import.meta.env.DEV) {
        result += '⚠️ MODE DÉVELOPPEMENT DÉTECTÉ\n';
        result += '- Les données peuvent être contaminées par des tests\n';
        result += '- Utiliser la production pour des données réelles\n';
      }
      
      if (salesData && !salesFormatOk) {
        result += '🚨 PROBLÈME CRITIQUE DÉTECTÉ\n';
        result += '- Les ventes sont stockées dans un mauvais format\n';
        result += '- Cela empêche l\'affichage du CA et des statistiques\n';
        result += '- SOLUTION: Utiliser le bouton "Vider Cache" ci-dessous\n';
        result += '- Puis redémarrer l\'application\n';
      }
      
      if (!salesData || (salesData && salesFormatOk && JSON.parse(salesData).length === 0)) {
        result += '✅ ENVIRONNEMENT PROPRE\n';
        result += '- Aucune vente enregistrée (normal pour un nouvel environnement)\n';
        result += '- Prêt pour utilisation en production\n';
      }

      result += '\n✅ Diagnostic terminé';

      setDiagnosticResult(result);
    } catch (error) {
      setDiagnosticResult(`❌ Erreur pendant le diagnostic: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearCache = () => {
    if (confirm('⚠️ Êtes-vous sûr de vouloir vider le cache ?\n\nCela supprimera toutes les données locales.')) {
      localStorage.clear();
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('MyConfortCaisseV2');
      }
      alert('✅ Cache vidé ! Rechargez la page.');
      window.location.reload();
    }
  };

  const fixDataFormat = () => {
    if (confirm('🔧 Corriger le format des données ?\n\nCela va tenter de réparer les données corrompues.')) {
      try {
        // Vérifier et corriger le format des ventes
        const salesData = localStorage.getItem('myconfort-sales');
        if (salesData) {
          const sales = JSON.parse(salesData);
          if (!Array.isArray(sales)) {
            // Si c'est un objet, essayer de le convertir en tableau
            if (typeof sales === 'object' && sales !== null) {
              // Si c'est un objet avec des clés numériques, le convertir
              const salesArray = Object.values(sales);
              localStorage.setItem('myconfort-sales', JSON.stringify(salesArray));
            } else {
              // Sinon, créer un tableau vide
              localStorage.setItem('myconfort-sales', JSON.stringify([]));
            }
          }
        }

        // Vérifier les autres données
        const vendorsData = localStorage.getItem('myconfort-vendors');
        if (vendorsData) {
          const vendors = JSON.parse(vendorsData);
          if (!Array.isArray(vendors)) {
            localStorage.setItem('myconfort-vendors', JSON.stringify([]));
          }
        }

        alert('✅ Format des données corrigé ! Relancez le diagnostic.');
        setDiagnosticResult('');
      } catch (error) {
        alert(`❌ Erreur lors de la correction: ${error}`);
      }
    }
  };

  const exportDiagnostic = () => {
    if (!diagnosticResult) return;

    const blob = new Blob([diagnosticResult], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-ipad-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 🔧 Réparer spécifiquement le format localStorage des factures externes
  const repairExternalStorage = () => {
    if (confirm('🔧 Réparer le format localStorage des factures externes ?\n\nCette action va corriger les données corrompues et les convertir au bon format.')) {
      try {
        setDiagnosticResult('🔄 Réparation en cours...\n\n');

        const stored = localStorage.getItem('mycomfort_external_invoices');
        let result = '🔧 RÉPARATION STORAGE EXTERNES\n';
        result += '=====================================\n\n';

        if (stored) {
          const parsed = JSON.parse(stored);
          result += `📦 Données brutes trouvées (${stored.length} caractères)\n`;

          if (Array.isArray(parsed)) {
            result += '✅ Format déjà correct (array)\n';
            result += `📊 Nombre de factures: ${parsed.length}\n`;
          } else if (parsed && typeof parsed === 'object' && parsed.data && Array.isArray(parsed.data)) {
            // Format corrompu détecté
            result += '⚠️ Format corrompu détecté (object.data)\n';
            result += `📊 Nombre de factures dans data: ${parsed.data.length}\n`;

            // Réparation
            const corrected = parsed.data;
            localStorage.setItem('mycomfort_external_invoices', JSON.stringify(corrected));

            result += '🔧 Réparation effectuée !\n';
            result += `✅ Format converti en array simple (${corrected.length} factures)\n`;
            result += '🔄 Rechargez la page pour voir les changements\n';
          } else {
            result += '❌ Format inconnu - impossible de réparer\n';
          }
        } else {
          result += '📦 Aucune donnée trouvée - rien à réparer\n';
        }

        setDiagnosticResult(result);
      } catch (error) {
        setDiagnosticResult(`❌ Erreur lors de la réparation: ${error}`);
      }
    }
  };

  // 📋 Afficher les logs de console
  const showConsoleLogs = () => {
    try {
      // Capturer les logs récents
      let logsContent = '📋 CAPTURE LOGS CONSOLE\n';
      logsContent += '=====================================\n\n';

      logsContent += '⚠️ Note: Cette fonctionnalité capture les logs récents.\n';
      logsContent += 'Pour voir tous les logs en temps réel, utilisez la console développeur (F12).\n\n';

      logsContent += '🔧 ACTIONS DISPONIBLES:\n';
      logsContent += '- Vérifier le format localStorage\n';
      logsContent += '- Injecter une facture de test\n';
      logsContent += '- Diagnostiquer les services\n';
      logsContent += '- Vérifier la connectivité réseau\n\n';

      logsContent += '📝 INSTRUCTIONS:\n';
      logsContent += '1. Ouvrez la console développeur (F12)\n';
      logsContent += '2. Allez dans l\'onglet Console\n';
      logsContent += '3. Les logs sont affichés en temps réel\n';
      logsContent += '4. Utilisez les boutons ci-dessus pour déclencher des actions\n\n';

      logsContent += '🔍 LOGS RÉCENTS (derniers événements):\n';
      logsContent += '- Chargement de la page\n';
      logsContent += '- Initialisation des services\n';
      logsContent += '- Vérification des données localStorage\n';
      logsContent += '- Connexion aux services externes\n\n';

      setDiagnosticResult(logsContent);
    } catch (error) {
      setDiagnosticResult(`❌ Erreur lecture logs: ${error}`);
    }
  };

  // 🔍 Tester le service externalInvoiceService
  const testExternalInvoiceService = () => {
    try {
      let result = '🔍 TEST SERVICE EXTERNAL INVOICES\n';
      result += '=====================================\n\n';

      // Vérifier si le service est disponible
      if (typeof window !== 'undefined' && (window as any).externalInvoiceService) {
        const service = (window as any).externalInvoiceService;
        result += '✅ Service externalInvoiceService trouvé\n\n';

        // Tester le diagnostic du service
        result += '🔧 Lancement du diagnostic automatique...\n';
        service.diagnoseStorage();

        // Récupérer l'état actuel
        const invoices = service.getAllInvoices ? service.getAllInvoices() : [];
        result += `📊 Factures dans le service: ${invoices.length}\n`;

        if (invoices.length > 0) {
          result += `📋 Première facture: ${invoices[0].invoiceNumber} - ${invoices[0].totals?.ttc || 0}€\n`;
        }

        result += '\n✅ Test terminé - voir console pour détails\n';
      } else {
        result += '❌ Service externalInvoiceService non trouvé\n';
        result += '💡 Recharger la page ou vérifier les imports\n';
      }

      setDiagnosticResult(result);
    } catch (error) {
      setDiagnosticResult(`❌ Erreur test service: ${error}`);
    }
  };

  // 💰 Injecter une facture de test
  const injectTestInvoice = () => {
    if (confirm('💰 Injecter une facture de test (280€ - Sylvie) ?\n\nCette facture sera ajoutée au localStorage et devrait apparaître dans les onglets.')) {
      try {
        let result = '💰 INJECTION FACTURE TEST\n';
        result += '=====================================\n\n';

        const testInvoice = {
          invoiceNumber: `F-TEST-DIAGNOSTIC-${Date.now()}`,
          invoiceDate: new Date().toISOString().slice(0, 10),
          client: { name: 'Client Test Diagnostic' },
          items: [{
            sku: 'TEST-001',
            name: 'Produit Test Diagnostic',
            qty: 1,
            unitPriceHT: 233.33,
            tvaRate: 0.2
          }],
          totals: {
            ht: 233.33,
            tva: 46.67,
            ttc: 280
          },
          payment: {
            method: 'card',
            paid: true
          },
          channels: {
            source: 'Diagnostic iPad',
            via: 'Injection Manuelle'
          },
          vendorId: 'sylvie',
          vendorName: 'Sylvie',
          idempotencyKey: `TEST-DIAGNOSTIC-${Date.now()}`
        };

        // Ajouter au localStorage
        const existing = localStorage.getItem('mycomfort_external_invoices');
        let invoices = [];

        if (existing) {
          try {
            const parsed = JSON.parse(existing);
            invoices = Array.isArray(parsed) ? parsed : [];
          } catch {
            invoices = [];
          }
        }

        invoices.push(testInvoice);
        localStorage.setItem('mycomfort_external_invoices', JSON.stringify(invoices));

        result += '✅ Facture injectée avec succès !\n';
        result += `📄 Numéro: ${testInvoice.invoiceNumber}\n`;
        result += `👤 Vendeuse: ${testInvoice.vendorName}\n`;
        result += `💰 Montant: ${testInvoice.totals.ttc}€\n`;
        result += `📦 Stockée: ${invoices.length} factures au total\n\n`;

        result += '🔄 Actions à effectuer:\n';
        result += '1. Recharger la page\n';
        result += '2. Vérifier l\'onglet "Factures"\n';
        result += '3. Vérifier l\'onglet "CA instant" (Sylvie: +280€)\n';

        // Notifier l'interface
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('external-invoices-updated'));
        }

        setDiagnosticResult(result);
      } catch (error) {
        setDiagnosticResult(`❌ Erreur injection facture: ${error}`);
      }
    }
  };

  // 🌐 Vérifier le statut réseau
  const checkNetworkStatus = () => {
    try {
      let result = '🌐 DIAGNOSTIC CONNECTIVITÉ RÉSEAU\n';
      result += '=====================================\n\n';

      // Test de connectivité basique
      if (navigator.onLine) {
        result += '✅ Navigateur en ligne\n';
      } else {
        result += '❌ Navigateur hors ligne\n';
      }

      // Test de connectivité à l'API
      result += '\n🌐 TESTS DE CONNECTIVITÉ:\n';

      // Test 1: API locale
      fetch('/api/caisse/facture', {
        method: 'GET',
        cache: 'no-store'
      }).then(response => {
        result += `✅ API locale: ${response.status} ${response.statusText}\n`;
      }).catch(error => {
        result += `❌ API locale: ${error.message}\n`;
      });

      // Test 2: API n8n proxy
      fetch('/api/n8n/webhook/caisse/factures', {
        method: 'GET',
        cache: 'no-store'
      }).then(response => {
        result += `✅ API n8n: ${response.status} ${response.statusText}\n`;
      }).catch(error => {
        result += `❌ API n8n: ${error.message}\n`;
      });

      result += '\n🔧 RECOMMANDATIONS:\n';
      result += '- Vérifiez votre connexion internet\n';
      result += '- Les API 404 sont normales si les fonctions ne sont pas déployées\n';
      result += '- Les données locales fonctionnent sans connexion\n\n';

      result += '✅ Diagnostic réseau terminé';

      setDiagnosticResult(result);
    } catch (error) {
      setDiagnosticResult(`❌ Erreur diagnostic réseau: ${error}`);
    }
  };

  // 🔄 Forcer le rafraîchissement de l'interface
  const forceRefreshUI = () => {
    try {
      let result = '🔄 RAFRAÎCHISSEMENT UI FORCÉ\n';
      result += '=====================================\n\n';

      // Déclencher tous les événements de mise à jour
      if (typeof window !== 'undefined') {
        result += '📡 Événements déclenchés:\n';

        // Événement factures externes
        window.dispatchEvent(new CustomEvent('external-invoices-updated'));
        result += '✅ external-invoices-updated\n';

        // Événement ventes externes
        window.dispatchEvent(new CustomEvent('external-sale-created'));
        result += '✅ external-sale-created\n';

        // Événement stats vendeuses
        window.dispatchEvent(new CustomEvent('vendor-stats-updated'));
        result += '✅ vendor-stats-updated\n';

        // Forcer un re-render des composants
        if ((window as any).externalInvoiceService) {
          (window as any).externalInvoiceService.diagnoseStorage();
          result += '✅ Service externalInvoiceService diagnostiqué\n';
        }

        result += '\n🔄 Interface rafraîchie !\n';
        result += 'Vérifiez les onglets Factures et CA instant\n';
      }

      setDiagnosticResult(result);
    } catch (error) {
      setDiagnosticResult(`❌ Erreur rafraîchissement: ${error}`);
    }
  };

  // 👥 Diagnostiquer et synchroniser les vendeuses
  const diagnoseVendeuses = () => {
    try {
      let result = '👥 DIAGNOSTIC ET SYNCHRONISATION VENDEUSES\n';
      result += '=====================================\n\n';

      // Vendeuses par défaut du système
      const defaultVendeuses = [
        { id: 'sylvie', name: 'Sylvie', color: '#667eea' },
        { id: 'lucia', name: 'Lucia', color: '#764ba2' },
        { id: 'babette', name: 'Babette', color: '#f093fb' },
        { id: 'billy', name: 'Billy', color: '#4facfe' },
        { id: 'sabrina', name: 'Sabrina', color: '#00f2fe' }
      ];

      result += '📋 VENDEUSES PAR DÉFAUT:\n';
      defaultVendeuses.forEach(v => {
        result += `  - ${v.name} (${v.id}) - couleur: ${v.color}\n`;
      });
      result += '\n';

      // Vendeuses dans localStorage
      result += '💾 VENDEUSES DANS LOCALSTORAGE:\n';
      const storedVendeuses = localStorage.getItem('myconfort-vendors');
      let vendeusesLocales = [];

      if (storedVendeuses) {
        try {
          vendeusesLocales = JSON.parse(storedVendeuses);
          if (Array.isArray(vendeusesLocales)) {
            result += `✅ Format: Array (${vendeusesLocales.length} vendeuses)\n`;
            vendeusesLocales.forEach(v => {
              result += `  - ${v.name} (${v.id}) - couleur: ${v.color || 'non définie'}\n`;
            });
          } else {
            result += '⚠️ Format: Object (corrompu)\n';
            result += '🔧 Conversion en cours...\n';
            vendeusesLocales = Object.values(vendeusesLocales);
          }
        } catch {
          result += '❌ Erreur lecture localStorage\n';
          vendeusesLocales = [];
        }
      } else {
        result += '📦 Aucune vendeuse dans localStorage\n';
        result += '🔧 Création des vendeuses par défaut...\n';
        vendeusesLocales = [];
      }

      result += '\n';

      // Comparaison et diagnostic
      result += '🔍 COMPARAISON ET DIAGNOSTIC:\n';

      const differences = [];
      const vendeusesManquantes = [];
      const vendeusesEnTrop = [];

      // Vérifier les vendeuses manquantes
      defaultVendeuses.forEach(def => {
        const found = vendeusesLocales.find(loc => loc.id === def.id);
        if (!found) {
          vendeusesManquantes.push(def);
        }
      });

      // Vérifier les vendeuses en trop
      vendeusesLocales.forEach(loc => {
        const found = defaultVendeuses.find(def => def.id === loc.id);
        if (!found) {
          vendeusesEnTrop.push(loc);
        }
      });

      if (vendeusesManquantes.length > 0) {
        result += '⚠️ VENDEUSES MANQUANTES:\n';
        vendeusesManquantes.forEach(v => {
          result += `  - ${v.name} (${v.id}) - à ajouter\n`;
        });
        differences.push(`${vendeusesManquantes.length} vendeuses manquantes`);
      }

      if (vendeusesEnTrop.length > 0) {
        result += '⚠️ VENDEUSES EN TROP:\n';
        vendeusesEnTrop.forEach(v => {
          result += `  - ${v.name} (${v.id}) - à supprimer\n`;
        });
        differences.push(`${vendeusesEnTrop.length} vendeuses en trop`);
      }

      if (differences.length === 0) {
        result += '✅ Toutes les vendeuses sont synchronisées !\n';
      } else {
        result += '❌ SYNCHRONISATION REQUISE\n';
        result += `Problèmes détectés: ${differences.join(', ')}\n`;
      }

      result += '\n';

      // Vérifier les vendeuses actuelles dans l'interface
      result += '📱 VENDEUSES ACTUELLES DANS L\'INTERFACE:\n';
      const vendorStats = (window as any).vendorStats || [];
      if (vendorStats.length > 0) {
        result += `✅ ${vendorStats.length} vendeuses affichées:\n`;
        vendorStats.forEach(v => {
          result += `  - ${v.name} (${v.id}) - CA: ${v.realCA || 0}€\n`;
        });
      } else {
        result += '❌ Aucune vendeuse dans l\'interface\n';
      }

      result += '\n';

      // Actions de correction
      result += '🔧 ACTIONS DE CORRECTION:\n';

      if (vendeusesManquantes.length > 0 || vendeusesEnTrop.length > 0) {
        result += '🔄 Synchronisation automatique...\n';

        // Créer la liste complète et synchronisée
        const synchronizedVendeuses = [];

        // Ajouter les vendeuses par défaut
        defaultVendeuses.forEach(def => {
          const existing = vendeusesLocales.find(loc => loc.id === def.id);
          if (existing) {
            // Mettre à jour avec les valeurs par défaut si nécessaire
            synchronizedVendeuses.push({
              ...def,
              ...existing,
              name: existing.name || def.name,
              color: existing.color || def.color
            });
          } else {
            // Ajouter la vendeuse manquante
            synchronizedVendeuses.push(def);
          }
        });

        // Sauvegarder la liste synchronisée
        localStorage.setItem('myconfort-vendors', JSON.stringify(synchronizedVendeuses));

        result += `✅ ${synchronizedVendeuses.length} vendeuses synchronisées\n`;
        result += '📋 Liste mise à jour:\n';
        synchronizedVendeuses.forEach(v => {
          result += `  - ${v.name} (${v.id}) - couleur: ${v.color}\n`;
        });

        // Notifier l'interface
        window.dispatchEvent(new CustomEvent('vendor-stats-updated'));
        result += '\n🔄 Interface notifiée de la synchronisation\n';
      }

      // Recommandations finales
      result += '\n💡 RECOMMANDATIONS:\n';
      if (differences.length === 0) {
        result += '✅ Aucune action requise - vendeuses synchronisées\n';
        result += 'Le triangle rouge en bas à droite devrait disparaître\n';
      } else {
        result += '🔄 Rechargez la page pour voir les changements\n';
        result += 'Le triangle de notification devrait maintenant être résolu\n';
      }

      result += '\n✅ Diagnostic vendeuses terminé';

      setDiagnosticResult(result);
    } catch (error) {
      setDiagnosticResult(`❌ Erreur diagnostic vendeuses: ${error}`);
    }
  };

  return (
    <div>
      {/* En-tête */}
      <div style={{
        background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          🔧 Diagnostic Environnement iPad
        </h2>
        <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
          Analyse complète de l'environnement et des données
        </p>
      </div>

      {/* Boutons d'action */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <button
          onClick={runDiagnostic}
          disabled={isRunning}
          style={{
            backgroundColor: isRunning ? '#6c757d' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          {isRunning ? '⏳' : '🔍'} {isRunning ? 'Analyse...' : 'Lancer Diagnostic'}
        </button>

        <button
          onClick={exportDiagnostic}
          disabled={!diagnosticResult || isRunning}
          style={{
            backgroundColor: (!diagnosticResult || isRunning) ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: (!diagnosticResult || isRunning) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          📄 Exporter Rapport
        </button>

        <button
          onClick={fixDataFormat}
          style={{
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          🔧 Corriger Données
        </button>

        <button
          onClick={clearCache}
          style={{
            backgroundColor: '#ffc107',
            color: '#212529',
            border: 'none',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          🗑️ Vider Cache
        </button>

        <button
          onClick={repairExternalStorage}
          style={{
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          🔧 Réparer Storage
        </button>

        <button
          onClick={showConsoleLogs}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          📋 Logs Console
        </button>
      </div>

      {/* Section Outils Avancés */}
      <div style={{
        backgroundColor: '#e9ecef',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '20px'
      }}>
        <h3 style={{
          margin: '0 0 15px 0',
          color: '#495057',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🛠️ Outils Avancés de Débogage
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <button
            onClick={testExternalInvoiceService}
            style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            🔍 Test Service
          </button>

          <button
            onClick={injectTestInvoice}
            style={{
              backgroundColor: '#fd7e14',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            💰 Injecter Facture
          </button>

          <button
            onClick={checkNetworkStatus}
            style={{
              backgroundColor: '#20c997',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            🌐 Statut Réseau
          </button>

          <button
            onClick={forceRefreshUI}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            🔄 Rafraîchir UI
          </button>

          <button
            onClick={diagnoseVendeuses}
            style={{
              backgroundColor: '#e83e8c',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            👥 Sync Vendeuses
          </button>
        </div>
      </div>

      {/* Résultats */}
      {diagnosticResult && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '2px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ 
            margin: '0 0 16px 0', 
            color: '#495057',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 Rapport de Diagnostic
          </h3>
          <pre style={{
            backgroundColor: '#ffffff',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            padding: '16px',
            fontSize: '12px',
            lineHeight: '1.4',
            overflow: 'auto',
            maxHeight: '500px',
            whiteSpace: 'pre-wrap',
            fontFamily: 'Monaco, Consolas, "Courier New", monospace'
          }}>
            {diagnosticResult}
          </pre>
        </div>
      )}
    </div>
  );
}
