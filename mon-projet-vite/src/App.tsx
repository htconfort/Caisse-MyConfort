import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useIndexedStorage } from './hooks/storage/useIndexedStorage';
import { useSyncInvoices } from './hooks/useSyncInvoices';
import { Header } from './components/ui/Header';
import { Navigation } from './components/ui/Navigation';
import { VendorSelection, ProductsTab, SalesTab, MiscTab, CancellationTab, CATab } from './components/tabs';
import { StockTabElegant } from './components/tabs/StockTabElegant';
import { InvoicesTabElegant } from './components/InvoicesTabElegant';
import { SuccessNotification, FloatingCart } from './components/ui';
import { Settings, Plus, Save, X, Palette, Check, Edit3, Trash2 } from 'lucide-react';
import './styles/invoices-tab.css';

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
  const { stats: invoicesStats } = useSyncInvoices();
  
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

  // États pour l'édition et la suppression des vendeuses
  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const [editVendorName, setEditVendorName] = useState('');
  const [editVendorEmail, setEditVendorEmail] = useState('');
  const [editVendorColor, setEditVendorColor] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Mise à jour de l'heure
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
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
    if (product.priceTTC === 0) return;
    if (!selectedVendor) {
      alert('Veuillez d\'abord sélectionner une vendeuse pour ajouter des produits au panier.');
      return;
    }
    
    // Toujours créer une nouvelle ligne d'article (pas d'incrémentation de quantité)
    setCart(prevCart => [...prevCart, {
      id: `${product.name}-${Date.now()}-${Math.random()}`,
      name: product.name,
      price: product.priceTTC,
      quantity: 1,
      category: product.category,
      addedAt: new Date()
    }]);
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
        ? { ...vendor, dailySales: vendor.dailySales + cartTotal, totalSales: vendor.totalSales + 1 }
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
            dailySales: vendor.dailySales - lastSale.totalAmount, 
            totalSales: vendor.totalSales - 1 
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
            dailySales: vendor.dailySales - saleToCancel.totalAmount, 
            totalSales: vendor.totalSales - 1 
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

  const getFirstAvailableColor = useCallback(() => {
    const available = getAvailableColors();
    return available.length > 0 ? available[0] : VENDOR_COLORS[0];
  }, [getAvailableColors]);

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
    const newVendorId = `vendor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Créer la nouvelle vendeuse avec la couleur choisie
    const newVendor: Vendor = {
      id: newVendorId,
      name: newVendorName.trim(),
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
  }, [newVendorName, selectedColor, setVendorStats, setNewVendorName, setNewVendorEmail, setSelectedColor, setShowAddVendorForm, setSelectedVendor]);

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
          invoicesCount={invoicesStats.pendingInvoices + invoicesStats.partialInvoices}
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
              <InvoicesTabElegant />
            )}

            {/* Onglet Stock */}
            {activeTab === 'stock' && (
              <StockTabElegant />
            )}

            {/* Onglet Ventes */}
            {activeTab === 'ventes' && (
              <SalesTab sales={sales} />
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
              />
            )}

            {/* Onglet Gestion */}
            {activeTab === 'gestion' && (
              <div style={{
                padding: '20px',
                maxWidth: '800px',
                margin: '0 auto',
                fontFamily: 'Arial, sans-serif'
              }}>
                {/* En-tête avec bouton d'ajout */}
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
                    <h1 style={{ margin: 0, fontSize: '24px' }}>
                      <Settings size={28} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
                      Gestion des Vendeuses
                    </h1>
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
                              � {vendor.email || 'Pas d\'email'}
                            </div>
                            
                            <div style={{ fontSize: '14px', color: '#495057', marginBottom: '8px' }}>
                              �💰 Total: {vendor.totalSales.toFixed(2)}€ | 📊 Aujourd'hui: {vendor.dailySales.toFixed(2)}€
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

            {/* Fallback pour les onglets non définis */}
            {!['vendeuse', 'produits', 'factures', 'stock', 'ventes', 'diverses', 'annulation', 'ca', 'gestion'].includes(activeTab) && (
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

        {/* Success Notification */}
        <SuccessNotification show={showSuccess} />
      </div>
    </div>
  );
}
