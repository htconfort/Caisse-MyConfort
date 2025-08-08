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
import { Settings, Plus, Save, X } from 'lucide-react';
import './styles/invoices-tab.css';

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

  // Gestion des vendeuses
  const handleAddVendor = useCallback(() => {
    if (!newVendorName.trim()) {
      alert('⚠️ Le nom de la vendeuse est obligatoire !');
      return;
    }

    // Générer un ID unique
    const newVendorId = `vendor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Couleurs disponibles (éviter les doublons)
    const usedColors = vendorStats.map(v => v.color);
    const availableColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    const freeColors = availableColors.filter(color => !usedColors.includes(color));
    const assignedColor = freeColors.length > 0 ? freeColors[0] : availableColors[0];

    // Créer la nouvelle vendeuse
    const newVendor: Vendor = {
      id: newVendorId,
      name: newVendorName.trim(),
      dailySales: 0,
      totalSales: 0,
      color: assignedColor
    };

    // Ajouter à la liste
    setVendorStats(prev => [...prev, newVendor]);

    // Reset du formulaire
    setNewVendorName('');
    setNewVendorEmail('');
    setShowAddVendorForm(false);

    // Sélectionner automatiquement la nouvelle vendeuse
    setSelectedVendor(newVendor);

    console.log('✅ Nouvelle vendeuse ajoutée:', newVendor);
    alert(`🎉 Vendeuse "${newVendor.name}" ajoutée avec succès !`);
  }, [newVendorName, vendorStats, setVendorStats, setNewVendorName, setNewVendorEmail, setShowAddVendorForm, setSelectedVendor]);

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

                    <div style={{
                      background: '#d1ecf1',
                      border: '1px solid #bee5eb',
                      borderRadius: '4px',
                      padding: '10px',
                      marginBottom: '15px',
                      fontSize: '14px',
                      color: '#0c5460'
                    }}>
                      💡 <strong>Couleur automatique :</strong> Une couleur libre sera automatiquement attribuée
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={handleAddVendor}
                        disabled={!newVendorName.trim()}
                        style={{
                          background: newVendorName.trim() ? '#28a745' : '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '12px 20px',
                          cursor: newVendorName.trim() ? 'pointer' : 'not-allowed',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          opacity: newVendorName.trim() ? 1 : 0.5,
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
                    gap: '10px',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
                  }}>
                    {vendorStats.map((vendor) => (
                      <div
                        key={vendor.id}
                        style={{
                          background: selectedVendor?.id === vendor.id ? '#e8f5e8' : '#f8f9fa',
                          border: selectedVendor?.id === vendor.id ? '2px solid #28a745' : '1px solid #ddd',
                          borderRadius: '6px',
                          padding: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => setSelectedVendor(vendor)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              backgroundColor: vendor.color,
                              borderRadius: '50%',
                              marginRight: '8px',
                              border: '2px solid #fff',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }}
                          />
                          <strong style={{ color: '#495057' }}>{vendor.name}</strong>
                        </div>
                        
                        <div style={{ fontSize: '14px', color: '#6c757d' }}>
                          💰 Total: {vendor.dailySales.toFixed(2)}€
                        </div>
                        
                        {selectedVendor?.id === vendor.id && (
                          <div style={{
                            marginTop: '8px',
                            padding: '4px 8px',
                            background: '#28a745',
                            color: 'white',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            ✅ Sélectionnée
                          </div>
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
                    ✅ Fonctionnalité d'ajout activée !
                  </h4>
                  <p style={{ margin: '0', color: '#155724' }}>
                    Vous pouvez maintenant ajouter de nouvelles vendeuses avec attribution automatique des couleurs.
                    <br />
                    <strong>Prochaine étape :</strong> Sélecteur de couleurs personnalisé et modification des vendeuses.
                  </p>
                </div>
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
