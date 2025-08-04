import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, X, AlertCircle, BarChart } from 'lucide-react';

// Imports modulaires
import type { 
  TabType, 
  PaymentMethod, 
  Vendor, 
  ExtendedCartItem, 
  Sale, 
  CatalogProduct, 
  ProductCategory 
} from './types';
import { 
  productCatalog, 
  vendors, 
  STORAGE_KEYS 
} from './data';
import { 
  categories, 
  paymentMethods 
} from './data/constants';
import { 
  extractDimensions,
  getProductNameWithoutDimensions,
  isMatressProduct,
  getCategoryBackgroundColor,
  getTextColor,
  convertToCSV
} from './utils';
import { 
  useLocalStorage, 
  useDebounce 
} from './hooks';
import { 
  Header, 
  Navigation, 
  SuccessNotification, 
  SearchBar 
} from './components/ui';
import { VendorSelection, CancellationTab } from './components/tabs';

export default function CaisseMyConfortApp() {
  // États principaux
  const [activeTab, setActiveTab] = useState<TabType>('vendeuse');
  const [selectedVendor, setSelectedVendor] = useLocalStorage<Vendor | null>(STORAGE_KEYS.VENDOR, null);
  const [cart, setCart] = useLocalStorage<ExtendedCartItem[]>(STORAGE_KEYS.CART, []);
  const [sales, setSales] = useLocalStorage<Sale[]>(STORAGE_KEYS.SALES, []);
  const [vendorStats, setVendorStats] = useLocalStorage<Vendor[]>(STORAGE_KEYS.VENDORS_STATS, vendors);
  
  // États UI
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'Tous'>('Tous');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [miscDescription, setMiscDescription] = useState('');
  const [miscAmount, setMiscAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartMinimized, setIsCartMinimized] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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

  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return sales
      .filter(sale => new Date(sale.date).toDateString() === today && !sale.canceled)
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
  }, [sales]);

  // Gestion du panier
  const addToCart = useCallback((product: CatalogProduct) => {
    if (product.priceTTC === 0) return;
    if (!selectedVendor) {
      alert('Veuillez d\'abord sélectionner une vendeuse pour ajouter des produits au panier.');
      return;
    }
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.name === product.name);
      if (existingItem) {
        return prevCart.map(item =>
          item.name === product.name 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, {
        id: `${product.name}-${Date.now()}`,
        name: product.name,
        price: product.priceTTC,
        quantity: 1,
        category: product.category,
        addedAt: new Date()
      }];
    });
  }, [setCart, selectedVendor]);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart(prevCart => {
      const newCart: ExtendedCartItem[] = [];
      prevCart.forEach(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          if (newQuantity > 0) {
            newCart.push({ ...item, quantity: newQuantity });
          }
        } else {
          newCart.push(item);
        }
      });
      return newCart;
    });
  }, [setCart]);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
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

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Ajout ligne diverse
  const addMiscLine = useCallback(() => {
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

  // Export des données
  const exportData = useCallback((format: 'csv' | 'json') => {
    const dataStr = format === 'json' 
      ? JSON.stringify({ sales, vendors: vendorStats }, null, 2)
      : convertToCSV(sales);
    
    const dataUri = 'data:text/' + (format === 'json' ? 'json' : 'csv') + ';charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `myconfort-export-${new Date().toISOString().split('T')[0]}.${format}`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [sales, vendorStats]);

  // Remise à zéro
  const performReset = useCallback(() => {
    setSales([]);
    setCart([]);
    setVendorStats(vendors);
    setSelectedVendor(null);
    setShowResetModal(false);
    setResetStep(1);
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, [setSales, setCart, setVendorStats, setSelectedVendor]);

  // Filtrage des produits
  const filteredProducts = useMemo(() => {
    let filtered = selectedCategory === 'Tous' 
      ? productCatalog 
      : productCatalog.filter(p => p.category === selectedCategory);
    
    if (debouncedSearchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [selectedCategory, debouncedSearchTerm]);

  return (
    <div className="ipad-frame">
      <div className="h-screen flex flex-col gradient-bg">

        {/* Header */}
        <Header selectedVendor={selectedVendor} currentDateTime={currentDateTime} />

        {/* Navigation */}
        <Navigation 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cartItemsCount={cartItemsCount}
          salesCount={sales.length}
          cartLength={cart.length}
        />

        {/* Main Content */}
        <main className={`flex-1 overflow-hidden safe-bottom relative ${
          ['produits', 'annulation'].includes(activeTab) 
            ? `main-content-with-cart ${isCartMinimized ? 'cart-minimized' : ''}`
            : ''
        }`}>
          <div className="h-full overflow-auto p-6">

            {/* Vendeuse Tab */}
            {activeTab === 'vendeuse' && (
              <VendorSelection 
                vendorStats={vendorStats}
                selectedVendor={selectedVendor}
                setSelectedVendor={setSelectedVendor}
                setActiveTab={setActiveTab}
              />
            )}

            {/* Produits Tab - Alerte si pas de vendeuse */}
            {activeTab === 'produits' && !selectedVendor && (
              <div className="max-w-2xl mx-auto text-center animate-fadeIn">
                <div className="card">
                  <AlertCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--warning-red)' }} />
                  <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--dark-green)' }}>
                    Vendeuse non sélectionnée
                  </h2>
                  <p className="mb-6" style={{ color: '#6B7280' }}>
                    Vous pouvez naviguer librement dans tous les onglets, mais pour ajouter des produits au panier, 
                    veuillez d'abord sélectionner une vendeuse.
                  </p>
                  <button
                    onClick={() => setActiveTab('vendeuse')}
                    className="btn-primary"
                  >
                    Sélectionner une vendeuse
                  </button>
                </div>
              </div>
            )}

            {/* Produits Tab avec vendeuse sélectionnée */}
            {activeTab === 'produits' && selectedVendor && (
              <div className="animate-fadeIn">
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

                {/* Categories */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all touch-feedback ${
                        selectedCategory === category
                          ? 'btn-primary text-black shadow-md'
                          : 'bg-white hover:shadow-md'
                      }`}
                      style={{
                        color: selectedCategory === category ? 'var(--dark-green)' : 'var(--dark-green)'
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Compteur de produits */}
                <div className="mb-4 p-3 bg-blue-100 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span><strong>Total catalogue:</strong> {productCatalog.length} produits</span>
                    <span><strong>Affichés ({selectedCategory}):</strong> {filteredProducts.length} produits</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Matelas: {productCatalog.filter(p => p.category === 'Matelas').length} | 
                    Sur-matelas: {productCatalog.filter(p => p.category === 'Sur-matelas').length} | 
                    Couettes: {productCatalog.filter(p => p.category === 'Couettes').length} | 
                    Oreillers: {productCatalog.filter(p => p.category === 'Oreillers').length} | 
                    Plateaux: {productCatalog.filter(p => p.category === 'Plateau').length} | 
                    Accessoires: {productCatalog.filter(p => p.category === 'Accessoires').length}
                  </div>
                </div>

                {/* Products Grid */}
                <div 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px',
                    width: '100%',
                    maxWidth: '100%',
                    marginRight: '340px',
                    padding: '0 8px'
                  }}
                >
                  {filteredProducts.map((product, index) => {
                    const isMatress = isMatressProduct(product.category);
                    const dimensions = extractDimensions(product.name);
                    const productNameOnly = dimensions ? getProductNameWithoutDimensions(product.name) : product.name;
                    const backgroundColor = getCategoryBackgroundColor(product.category);
                    const textColor = getTextColor(backgroundColor);
                    const isSpecialCategory = backgroundColor !== 'white';
                    
                    const discountedPrice = isMatress ? Math.round(product.priceTTC * 0.8) : product.priceTTC;
                    
                    return (
                      <div
                        key={`${product.name}-${index}`}
                        onClick={() => addToCart({...product, priceTTC: discountedPrice})}
                        className="touch-feedback cursor-pointer relative overflow-hidden transition-all"
                        style={{
                          backgroundColor: backgroundColor,
                          color: textColor,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textAlign: 'center',
                          padding: '10px',
                          minHeight: '90px',
                          maxHeight: '110px',
                          border: '1px solid rgba(0,0,0,0.1)',
                          borderRadius: '6px',
                          opacity: product.priceTTC === 0 ? 0.5 : 1,
                          pointerEvents: product.priceTTC === 0 ? 'none' : 'auto'
                        }}
                      >
                        {/* Badge de remise pour les matelas */}
                        {isMatress && (
                          <div style={{
                            position: 'absolute',
                            bottom: '2px',
                            right: '2px',
                            backgroundColor: '#FF0000',
                            color: 'white',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            zIndex: 10,
                            lineHeight: '1'
                          }}>
                            -20%
                          </div>
                        )}
                        
                        {/* Nom du produit */}
                        <h3 style={{ 
                          color: textColor,
                          fontSize: isSpecialCategory ? '20px' : '18px',
                          fontWeight: 'bold',
                          marginBottom: '2px',
                          lineHeight: '1.1',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          maxHeight: '40px'
                        }}>
                          {productNameOnly}
                        </h3>
                        
                        {/* Dimensions */}
                        {dimensions && (
                          <div style={{ marginBottom: '2px' }}>
                            <p style={{ 
                              color: textColor,
                              fontSize: '22px',
                              fontWeight: 'bold',
                              lineHeight: '1'
                            }}>
                              {dimensions}
                            </p>
                          </div>
                        )}
                        
                        {/* Prix */}
                        <p style={{ 
                          color: '#000000',
                          fontSize: '22px',
                          fontWeight: 'bold',
                          lineHeight: '1',
                          margin: 0
                        }}>
                          {product.priceTTC > 0 ? `${discountedPrice}€` : 'Non vendu seul'}
                        </p>
                        
                        {/* Prix barré pour les matelas */}
                        {isMatress && product.priceTTC > 0 && (
                          <p style={{ 
                            color: isSpecialCategory ? 'white' : '#666666',
                            textDecoration: 'line-through',
                            fontSize: '16px',
                            marginTop: '1px',
                            lineHeight: '1',
                            margin: 0
                          }}>
                            {product.priceTTC}€
                          </p>
                        )}
                        
                        {product.priceTTC === 0 && (
                          <p style={{ 
                            color: isSpecialCategory ? '#666666' : 'var(--warning-red)',
                            fontSize: '16px',
                            marginTop: '1px',
                            lineHeight: '1',
                            margin: 0
                          }}>
                            ⚠️ Complémentaire
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div style={{ 
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      padding: '24px',
                      color: '#6B7280'
                    }}>
                      <p>Aucun produit trouvé</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ventes Tab - Version simplifiée pour l'instant */}
            {activeTab === 'ventes' && (
              <div className="animate-fadeIn">
                <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--dark-green)' }}>
                  Historique des ventes
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="card text-center">
                    <h3 className="text-sm font-semibold mb-2" style={{ color: '#6B7280' }}>
                      Ventes du jour
                    </h3>
                    <p className="text-2xl font-bold" style={{ color: 'var(--primary-green)' }}>
                      {sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && !s.canceled).length}
                    </p>
                  </div>
                  <div className="card text-center">
                    <h3 className="text-sm font-semibold mb-2" style={{ color: '#6B7280' }}>
                      CA total du jour
                    </h3>
                    <p className="text-2xl font-bold" style={{ color: 'var(--primary-green)' }}>
                      {todaySales.toFixed(2)}€
                    </p>
                  </div>
                  <div className="card text-center">
                    <h3 className="text-sm font-semibold mb-2" style={{ color: '#6B7280' }}>
                      Ticket moyen
                    </h3>
                    <p className="text-2xl font-bold" style={{ color: 'var(--primary-green)' }}>
                      {sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && !s.canceled).length > 0 
                        ? (todaySales / sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && !s.canceled).length).toFixed(2)
                        : '0.00'
                      }€
                    </p>
                  </div>
                </div>

                {sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length === 0 ? (
                  <div className="card text-center py-12">
                    <BarChart size={48} className="mx-auto mb-4" style={{ color: '#D1D5DB' }} />
                    <p className="text-xl" style={{ color: '#6B7280' }}>
                      Aucune vente aujourd'hui
                    </p>
                  </div>
                ) : (
                  <div className="card">
                    <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--dark-green)' }}>
                      Détail des ventes du jour
                    </h3>
                    <div className="flex gap-2 mb-4">
                      <button onClick={() => exportData('csv')} className="btn-primary text-sm px-4 py-2">
                        Export CSV
                      </button>
                      <button onClick={() => exportData('json')} className="btn-secondary text-sm px-4 py-2">
                        Export JSON
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length} ventes trouvées
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Diverses Tab */}
            {activeTab === 'diverses' && (
              <div className="max-w-2xl mx-auto animate-fadeIn">
                <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--dark-green)' }}>
                  Ajouter une ligne diverse
                </h2>
                <div className="card">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--dark-green)' }}>
                        Description
                      </label>
                      <input
                        type="text"
                        value={miscDescription}
                        onChange={(e) => setMiscDescription(e.target.value)}
                        placeholder="Ex: Livraison express, Montage..."
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--dark-green)' }}>
                        Montant (€)
                      </label>
                      <input
                        type="number"
                        value={miscAmount}
                        onChange={(e) => setMiscAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        className="input"
                      />
                    </div>
                    <button
                      onClick={addMiscLine}
                      disabled={!miscDescription || !miscAmount}
                      className="w-full btn-primary"
                      style={{
                        opacity: !miscDescription || !miscAmount ? 0.5 : 1
                      }}
                    >
                      Ajouter au panier
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Annulation Tab */}
            {activeTab === 'annulation' && (
              <CancellationTab 
                cart={cart}
                cartTotal={cartTotal}
                clearCart={clearCart}
              />
            )}

            {/* Autres onglets à implémenter... */}
            {['ca', 'raz'].includes(activeTab) && (
              <div className="max-w-2xl mx-auto text-center animate-fadeIn">
                <div className="card">
                  <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--dark-green)' }}>
                    {activeTab === 'ca' && 'CA Instantané'}
                    {activeTab === 'raz' && 'Remise à zéro'}
                  </h2>
                  <p style={{ color: '#6B7280' }}>
                    Fonctionnalité en cours d'implémentation...
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Success Notification */}
        <SuccessNotification show={showSuccess} />

        {/* Panier flottant */}
        {['produits', 'annulation'].includes(activeTab) && (
          <div className={`floating-cart ${isCartMinimized ? 'minimized' : ''}`}>
            <div className="cart-header" style={{ 
              backgroundColor: 'var(--primary-green)', 
              padding: isCartMinimized ? '8px' : '16px',
              display: 'flex',
              justifyContent: isCartMinimized ? 'center' : 'space-between',
              alignItems: 'center',
              minHeight: '60px'
            }}>
              {!isCartMinimized ? (
                <>
                  <h3 className="header-white-text font-bold text-lg">
                    Panier ({cartItemsCount})
                  </h3>
                  <button
                    onClick={() => setIsCartMinimized(true)}
                    className="cart-toggle"
                    style={{ width: 'auto', height: 'auto', padding: '8px' }}
                  >
                    <X size={20} color="white" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsCartMinimized(false)}
                  className="cart-toggle"
                  style={{ flexDirection: 'column', gap: '4px' }}
                >
                  <ShoppingCart size={20} color="white" />
                  {cartItemsCount > 0 && (
                    <span className="cart-badge">
                      {cartItemsCount}
                    </span>
                  )}
                  <span style={{ color: 'white', fontSize: '10px', writingMode: 'vertical-rl' }}>
                    PANIER
                  </span>
                </button>
              )}
            </div>

            {!isCartMinimized && (
              <div className="cart-content" style={{ 
                padding: '16px', 
                height: 'calc(100% - 60px)', 
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {cart.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <ShoppingCart size={48} style={{ color: '#D1D5DB', margin: '0 auto 16px' }} />
                      <p className="text-gray-500">Panier vide</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 space-y-2 mb-4 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded"
                          style={{ backgroundColor: 'var(--neutral-beige)' }}>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs truncate" style={{ color: 'var(--dark-green)' }}>
                              {item.name}
                            </h4>
                            <p className="text-xs" style={{ color: 'var(--primary-green)' }}>
                              {item.price}€ x {item.quantity} = {(item.price * item.quantity).toFixed(2)}€
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs touch-feedback"
                              style={{ backgroundColor: '#E8E3D3' }}
                            >
                              <Minus size={10} />
                            </button>
                            <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs touch-feedback"
                              style={{ backgroundColor: '#E8E3D3' }}
                            >
                              <Plus size={10} />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="ml-1 touch-feedback"
                              style={{ color: 'var(--warning-red)' }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-3 mt-auto">
                      <div className="flex justify-between items-center font-bold mb-3"
                        style={{ color: 'var(--dark-green)' }}>
                        <span>Total TTC</span>
                        <span style={{ color: 'var(--primary-green)' }}>{cartTotal.toFixed(2)}€</span>
                      </div>
                      
                      {cart.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--dark-green)' }}>
                            Mode de paiement
                          </h4>
                          <div className="grid grid-cols-2 gap-1">
                            {paymentMethods.map(method => (
                              <button
                                key={method.id}
                                onClick={() => setSelectedPaymentMethod(method.id as PaymentMethod)}
                                className="p-2 rounded text-xs font-semibold transition-all touch-feedback"
                                style={{
                                  backgroundColor: selectedPaymentMethod === method.id ? 'var(--primary-green)' : '#E8E3D3',
                                  color: selectedPaymentMethod === method.id ? 'white' : 'var(--dark-green)'
                                }}
                              >
                                {method.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <button
                          onClick={completeSale}
                          disabled={!selectedVendor || cart.length === 0}
                          className="w-full btn-primary text-sm py-2 touch-feedback"
                          style={{
                            opacity: !selectedVendor || cart.length === 0 ? 0.5 : 1
                          }}
                        >
                          {!selectedVendor ? 'Sélectionner vendeuse' : 'Valider le paiement'}
                        </button>
                        <button
                          onClick={clearCart}
                          className="w-full text-sm py-2 px-3 rounded border touch-feedback"
                          style={{ 
                            borderColor: 'var(--warning-red)', 
                            color: 'var(--warning-red)',
                            backgroundColor: 'white'
                          }}
                          disabled={cart.length === 0}
                        >
                          Vider le panier
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
