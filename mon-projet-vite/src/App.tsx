import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { 
  TabType, 
  PaymentMethod, 
  Vendor, 
  ExtendedCartItem, 
  Sale,
  CatalogProduct
} from './types';
import { 
  vendors, 
  STORAGE_KEYS 
} from './data';
import { useIndexedStorage } from '@/hooks/storage/useIndexedStorage';
import { useSyncInvoices } from './hooks/useSyncInvoices';

// Type pour les options de RAZ
type ResetOptionKey =
  | 'dailySales'
  | 'cart'
  | 'invoices'
  | 'selectedVendor'
  | 'vendorStats'
  | 'allData';

import { Header } from './components/ui/Header';
import { Navigation } from './components/ui/Navigation';
import { VendorSelection, ProductsTab, SalesTab, MiscTab, CancellationTab, CATab } from './components/tabs';
import { StockTabElegant } from './components/tabs/StockTabElegant';
import InvoicesTabCompact from './components/InvoicesTabCompact';
import { SuccessNotification, FloatingCart } from './components/ui';
import { GuideUtilisation } from './components/GuideUtilisation';
import { Settings, Plus, Save, X, Palette, Check, Edit3, Trash2, RefreshCw, AlertTriangle, CheckCircle, Book, Users } from 'lucide-react';
import FeuilleDeRAZPro from './components/FeuilleDeRAZPro';
import './styles/invoices-tab.css';
import './styles/print.css';
import { sessionService } from '@/services';

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
  // États principaux
  const [activeTab, setActiveTab] = useState<TabType>('vendeuse');
  const [selectedVendor, setSelectedVendor] = useIndexedStorage<Vendor | null>(STORAGE_KEYS.VENDOR, null);
  const [cart, setCart] = useIndexedStorage<ExtendedCartItem[]>(STORAGE_KEYS.CART, []);
  const [sales, setSales] = useIndexedStorage<Sale[]>(STORAGE_KEYS.SALES, []);
  const [vendorStats, setVendorStats] = useIndexedStorage<Vendor[]>(STORAGE_KEYS.VENDORS_STATS, vendors);
  
  // Hook pour les factures
  const { invoices, stats: invoicesStats, resetInvoices } = useSyncInvoices();
  
  // États UI
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  const [miscDescription, setMiscDescription] = useState('');
  const [miscAmount, setMiscAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // États pour l'ajout de vendeuses
  const [showAddVendorForm, setShowAddVendorForm] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  
  // État pour les sous-onglets de gestion
  const [gestionActiveTab, setGestionActiveTab] = useState<'vendeuses' | 'guide'>('vendeuses');

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

  // Calculs dérivés
  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), 
    [cart]
  );
  
  const cartItemsCount = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0), 
    [cart]
  );

  // Gestion du panier
  const addToCart = useCallback((product: CatalogProduct) => {
    const unitPrice = Number((product as any).priceTTC ?? (product as any).price ?? 0);
    if (!unitPrice) return;

    if (!selectedVendor) {
      alert("Veuillez d'abord sélectionner une vendeuse pour ajouter des produits au panier.");
      return;
    }

    setCart(prevCart => [
      ...prevCart,
      {
        id: `${product.name}-${Date.now()}-${Math.random()}`,
        name: product.name,
        price: unitPrice,
        quantity: 1,
        category: product.category,
        addedAt: new Date(),
      },
    ]);
  }, [setCart, selectedVendor]);

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

  const clearCart = useCallback(() => {
    setCart([]);
  }, [setCart]);

  // Gestion des ventes
  const completeSale = useCallback(() => {
    if (!selectedVendor || cart.length === 0) return;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      items: [...cart],
      totalAmount: cartTotal,
      paymentMethod: selectedPaymentMethod,
      date: new Date(),
      canceled: false
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

    clearCart();
    setShowSuccess(true);
    setSelectedVendor(null);
    
    setTimeout(() => {
      setActiveTab('vendeuse');
    }, 2000);
  }, [selectedVendor, cart, cartTotal, selectedPaymentMethod, setSales, setVendorStats, clearCart, setSelectedVendor]);

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

  // Ajout ligne diverse
  const addMiscToCart = useCallback(() => {
    if (!miscDescription || !miscAmount) return;
    
    const amount = parseFloat(miscAmount);
    if (isNaN(amount)) return;

    const miscItem: ExtendedCartItem = {
      id: `misc-${Date.now()}`,
      name: miscDescription,
      price: amount,
      quantity: 1,
      category: 'Divers',
      addedAt: new Date()
    };

    setCart(prev => [...prev, miscItem]);
    setMiscDescription('');
    setMiscAmount('');
  }, [miscDescription, miscAmount, setCart]);

  // Fonctions utilitaires pour les couleurs
  const isColorUsed = useCallback((color: string) => {
    return vendorStats.some(vendor => vendor.color === color);
  }, [vendorStats]);

  const getAvailableColors = useCallback(() => {
    return VENDOR_COLORS.filter(color => !isColorUsed(color));
  }, [isColorUsed]);

  // Fonctions pour l'édition des vendeuses
  const startEditVendor = useCallback((vendor: Vendor) => {
    setEditingVendor(vendor.id);
    setEditVendorName(vendor.name);
    setEditVendorEmail(vendor.email || '');
    setEditVendorColor(vendor.color);
    console.log('✏️ Début édition vendeuse:', vendor.name);
  }, []);

  const saveEditVendor = useCallback(() => {
    if (!editVendorName.trim() || !editingVendor) {
      alert('⚠️ Le nom de la vendeuse est obligatoire !');
      return;
    }

    if (!editVendorColor) {
      alert('⚠️ Veuillez sélectionner une couleur !');
      return;
    }

    // Mettre à jour la vendeuse
    const updatedVendors = vendorStats.map(vendor => 
      vendor.id === editingVendor
        ? {
            ...vendor,
            name: editVendorName.trim(),
            email: editVendorEmail.trim(),
            color: editVendorColor
          }
        : vendor
    );

    setVendorStats(updatedVendors);

    // Mettre à jour la vendeuse sélectionnée si c'est celle modifiée
    if (selectedVendor?.id === editingVendor) {
      const updatedSelectedVendor = updatedVendors.find(v => v.id === editingVendor);
      if (updatedSelectedVendor) {
        setSelectedVendor(updatedSelectedVendor);
      }
    }

    // Reset du mode édition
    setEditingVendor(null);
    setEditVendorName('');
    setEditVendorEmail('');
    setEditVendorColor('');

    console.log('✅ Vendeuse modifiée:', editingVendor);
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

    // Supprimer la vendeuse de la liste
    const updatedVendors = vendorStats.filter(vendor => vendor.id !== vendorId);
    setVendorStats(updatedVendors);

    // Si c'était la vendeuse sélectionnée, sélectionner la première disponible
    if (selectedVendor?.id === vendorId) {
      const newSelected = updatedVendors.length > 0 ? updatedVendors[0] : null;
      setSelectedVendor(newSelected);
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
        ? { dailySales: true, cart: true, invoices: true, selectedVendor: true, vendorStats: true, allData: true }
        : { dailySales: false, cart: false, invoices: false, selectedVendor: false, vendorStats: false, allData: false }
      );
      return;
    }
    setResetOptions(prev => {
      const next = { ...prev, [option]: value };
      if (!value) next.allData = false;
      if (next.dailySales && next.cart && next.selectedVendor && next.vendorStats) next.allData = true;
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
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `myconfort-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log('💾 Sauvegarde exportée:', exportFileDefaultName);
    alert('💾 Sauvegarde exportée avec succès !');
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
            console.log('✅ RAZ ventes du jour effectuée');
          }

          // RAZ du panier
          if (resetOptions.cart) {
            setCart([]);
            console.log('✅ RAZ panier effectuée');
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
            console.log('✅ RAZ statistiques vendeuses effectuée');
          }

          // RAZ complète
          if (resetOptions.allData) {
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
            console.log('✅ RAZ complète effectuée');

            // Clôturer la session en cours puis en ouvrir une nouvelle pour la reprise
            try {
              await sessionService.closeCurrentSession();
              await sessionService.openSession('reset');
              console.log('🔐 Session clôturée et rouverte après RAZ complète');
            } catch (e) {
              console.warn('⚠️ Impossible de gérer la session après RAZ:', e);
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
                  console.log('🎨 Couleur modifiée:', color);
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
    setVendorStats(prev => [...prev, newVendor]);

    // Reset du formulaire
    setNewVendorName('');
    setNewVendorEmail('');
    setSelectedColor('');
    setShowAddVendorForm(false);

    // Sélectionner automatiquement la nouvelle vendeuse
    setSelectedVendor(newVendor);

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
              />
            )}

            {/* Onglet Factures */}
            {activeTab === 'factures' && (
              <InvoicesTabCompact sales={sales} />
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

            {/* Onglet Diverses */}
            {activeTab === 'diverses' && (
              <MiscTab
                miscDescription={miscDescription}
                setMiscDescription={setMiscDescription}
                miscAmount={miscAmount}
                setMiscAmount={setMiscAmount}
                addMiscToCart={addMiscToCart}
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
                  overflow: 'hidden',
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
                      {(resetOptions.dailySales || resetOptions.cart || resetOptions.invoices || resetOptions.selectedVendor || resetOptions.vendorStats || resetOptions.allData) && (
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
                                onClick={saveEditVendor}
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
                
                {/* Section Guide d'utilisation */}
                {gestionActiveTab === 'guide' && (
                  <GuideUtilisation />
                )}
              </div>
            )}


            {/* Fallback pour les onglets non définis */}
            {!['vendeuse', 'produits', 'factures', 'stock', 'ventes', 'diverses', 'annulation', 'ca', 'gestion', 'raz'].includes(activeTab) && (
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

        {/* Floating Cart */}
        <FloatingCart
          activeTab={activeTab}
          cart={cart}
          cartItemsCount={cartItemsCount}
          cartTotal={cartTotal}
          selectedVendor={selectedVendor}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          updateQuantity={updateQuantity}
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
      </div>
    </div>
  );
}
