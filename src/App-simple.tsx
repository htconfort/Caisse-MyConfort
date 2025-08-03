import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Package, CreditCard, BarChart3, RotateCcw, Plus, Minus, X } from 'lucide-react';
import './App.css';

// Types
interface CatalogProduct {
  name: string;
  category: ProductCategory;
  priceTTC: number;
  description?: string;
}

type ProductCategory = 'Matelas' | 'Accessoires' | 'Sommiers' | 'Oreillers' | 'Divers';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  addedAt: Date;
}

interface Vendor {
  id: string;
  name: string;
  dailySales: number;
  totalSales: number;
  color: string;
}

interface Sale {
  id: string;
  vendorId: string;
  vendorName: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  date: Date;
  canceled: boolean;
}

type PaymentMethod = 'cash' | 'card' | 'check' | 'multi';
type TabType = 'vendeuse' | 'produits' | 'reglements' | 'diverses' | 'annulation' | 'ca' | 'raz';

// Données du catalogue
const productCatalog: CatalogProduct[] = [
  // Matelas
  { name: "Matelas Simple 90x190", category: "Matelas", priceTTC: 299 },
  { name: "Matelas Double 140x190", category: "Matelas", priceTTC: 499 },
  { name: "Matelas Queen 160x200", category: "Matelas", priceTTC: 699 },
  { name: "Matelas King 180x200", category: "Matelas", priceTTC: 899 },
  { name: "Matelas Mémoire de Forme 140x190", category: "Matelas", priceTTC: 799 },
  { name: "Matelas Latex Naturel 140x190", category: "Matelas", priceTTC: 999 },
  
  // Accessoires
  { name: "Protège-matelas 90x190", category: "Accessoires", priceTTC: 0 },
  { name: "Protège-matelas 140x190", category: "Accessoires", priceTTC: 0 },
  { name: "Housse de couette 240x220", category: "Accessoires", priceTTC: 59 },
  { name: "Drap housse 140x190", category: "Accessoires", priceTTC: 29 },
  { name: "Taie d'oreiller 65x65 (lot de 2)", category: "Accessoires", priceTTC: 19 },
  
  // Sommiers
  { name: "Sommier Fixe 90x190", category: "Sommiers", priceTTC: 199 },
  { name: "Sommier Fixe 140x190", category: "Sommiers", priceTTC: 299 },
  { name: "Sommier Électrique 2x80x200", category: "Sommiers", priceTTC: 1299 },
  
  // Oreillers
  { name: "Oreiller Mousse 60x60", category: "Oreillers", priceTTC: 29 },
  { name: "Oreiller Latex 60x60", category: "Oreillers", priceTTC: 49 },
  { name: "Oreiller Plumes 65x65", category: "Oreillers", priceTTC: 69 },
  
  // Divers
  { name: "Garantie Étendue 3 ans", category: "Divers", priceTTC: 99 },
  { name: "Reprise Ancien Matelas", category: "Divers", priceTTC: 49 },
];

// Vendeuses
const vendors: Vendor[] = [
  { id: '1', name: 'Marie Dupont', dailySales: 0, totalSales: 0, color: '#477A0C' },
  { id: '2', name: 'Sophie Martin', dailySales: 0, totalSales: 0, color: '#C4D144' },
  { id: '3', name: 'Claire Bernard', dailySales: 0, totalSales: 0, color: '#89BBFE' },
  { id: '4', name: 'Julie Moreau', dailySales: 0, totalSales: 0, color: '#D68FD6' },
];

// Storage keys
const STORAGE_KEYS = {
  CART: 'myconfort-cart',
  SALES: 'myconfort-sales',
  VENDOR: 'myconfort-current-vendor',
} as const;

// Storage helpers
const loadFromStorage = (key: string, defaultValue: any): any => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
};

// Components
const TabNavigation: React.FC<{
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'vendeuse' as TabType, label: 'Vendeuse', icon: User, color: '#477A0C' },
    { id: 'produits' as TabType, label: 'Produits', icon: Package, color: '#C4D144' },
    { id: 'reglements' as TabType, label: 'Règlements', icon: CreditCard, color: '#89BBFE' },
    { id: 'diverses' as TabType, label: 'Diverses', icon: ShoppingCart, color: '#D68FD6' },
    { id: 'annulation' as TabType, label: 'Annulation', icon: RotateCcw, color: '#FF6B6B' },
    { id: 'ca' as TabType, label: 'C.A.', icon: BarChart3, color: '#4ECDC4' },
  ];

  return (
    <div className="flex bg-gray-100 p-2 rounded-lg shadow-md">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center p-3 mx-1 rounded-lg transition-all duration-200 ${
              isActive 
                ? 'bg-white shadow-lg scale-105' 
                : 'bg-transparent hover:bg-white/50'
            }`}
            style={{ 
              color: isActive ? tab.color : '#666',
              borderBottom: isActive ? `3px solid ${tab.color}` : 'none'
            }}
          >
            <IconComponent size={24} />
            <span className="text-sm font-medium mt-1">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const VendorSelector: React.FC<{
  vendors: Vendor[];
  selectedVendor: Vendor | null;
  onVendorSelect: (vendor: Vendor) => void;
}> = ({ vendors, selectedVendor, onVendorSelect }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Sélectionner une vendeuse
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {vendors.map((vendor) => (
          <button
            key={vendor.id}
            onClick={() => onVendorSelect(vendor)}
            className={`p-6 rounded-xl border-2 transition-all duration-200 ${
              selectedVendor?.id === vendor.id
                ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4"
              style={{ backgroundColor: vendor.color }}
            />
            <h3 className="text-lg font-semibold text-gray-800">
              {vendor.name}
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Ventes du jour: {vendor.dailySales.toFixed(2)}€
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

const ProductGrid: React.FC<{
  products: CatalogProduct[];
  onAddToCart: (product: CatalogProduct) => void;
}> = ({ products, onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  
  const categories: (ProductCategory | 'all')[] = ['all', 'Matelas', 'Accessoires', 'Sommiers', 'Oreillers', 'Divers'];
  
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category === 'all' ? 'Tous' : category}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{product.category}</p>
            {product.priceTTC > 0 ? (
              <>
                <p className="text-lg font-bold text-green-600 mb-3">
                  {product.priceTTC.toFixed(2)}€
                </p>
                <button
                  onClick={() => onAddToCart(product)}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Ajouter
                </button>
              </>
            ) : (
              <p className="text-sm text-orange-600 italic">
                Non vendu seul
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const CartSummary: React.FC<{
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedToPayment: () => void;
}> = ({ cart, onUpdateQuantity, onRemoveItem, onProceedToPayment }) => {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
        <p>Panier vide</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold mb-4">Panier ({cart.length} articles)</h3>
      
      <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
        {cart.map((item) => (
          <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-800">{item.name}</h4>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600">{item.price.toFixed(2)}€ x {item.quantity}</p>
                <p className="font-bold text-green-600">
                  {(item.price * item.quantity).toFixed(2)}€
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold">Total:</span>
          <span className="text-2xl font-bold text-green-600">
            {total.toFixed(2)}€
          </span>
        </div>
        
        <button
          onClick={onProceedToPayment}
          className="w-full bg-green-500 text-white py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors"
        >
          Procéder au paiement
        </button>
      </div>
    </div>
  );
};

const PaymentModal: React.FC<{
  isOpen: boolean;
  cart: CartItem[];
  total: number;
  onPayment: (method: PaymentMethod) => void;
  onClose: () => void;
}> = ({ isOpen, cart, total, onPayment, onClose }) => {
  if (!isOpen) return null;

  const paymentMethods = [
    { id: 'cash' as PaymentMethod, label: 'Espèces', color: '#4CAF50' },
    { id: 'card' as PaymentMethod, label: 'Carte', color: '#2196F3' },
    { id: 'check' as PaymentMethod, label: 'Chèque', color: '#FF9800' },
    { id: 'multi' as PaymentMethod, label: 'Mixte', color: '#9C27B0' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Règlement</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-lg mb-2">Total à payer:</p>
          <p className="text-3xl font-bold text-green-600">{total.toFixed(2)}€</p>
        </div>
        
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => onPayment(method.id)}
              className="w-full p-4 rounded-lg border-2 hover:shadow-lg transition-all duration-200"
              style={{
                borderColor: method.color,
                backgroundColor: `${method.color}10`,
              }}
            >
              <span className="text-lg font-semibold" style={{ color: method.color }}>
                {method.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('vendeuse');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedCart = loadFromStorage(STORAGE_KEYS.CART, []);
    const savedSales = loadFromStorage(STORAGE_KEYS.SALES, []);
    const savedVendor = loadFromStorage(STORAGE_KEYS.VENDOR, null);
    
    setCart(savedCart);
    setSales(savedSales);
    setSelectedVendor(savedVendor);
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CART, cart);
  }, [cart]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SALES, sales);
  }, [sales]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.VENDOR, selectedVendor);
  }, [selectedVendor]);

  const addToCart = (product: CatalogProduct) => {
    if (product.priceTTC === 0) {
      alert('Ce produit ne peut pas être vendu seul');
      return;
    }

    const existingItem = cart.find(item => item.name === product.name);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === existingItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        id: Date.now().toString(),
        name: product.name,
        price: product.priceTTC,
        quantity: 1,
        category: product.category,
        addedAt: new Date(),
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handlePayment = (method: PaymentMethod) => {
    if (!selectedVendor) {
      alert('Veuillez sélectionner une vendeuse');
      return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const newSale: Sale = {
      id: Date.now().toString(),
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      items: [...cart],
      totalAmount: total,
      paymentMethod: method,
      date: new Date(),
      canceled: false,
    };

    setSales([...sales, newSale]);
    setCart([]);
    setShowPaymentModal(false);
    
    alert(`Vente enregistrée: ${total.toFixed(2)}€ (${method})`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'vendeuse':
        return (
          <VendorSelector
            vendors={vendors}
            selectedVendor={selectedVendor}
            onVendorSelect={setSelectedVendor}
          />
        );
      
      case 'produits':
        if (!selectedVendor) {
          return (
            <div className="p-6 text-center text-gray-500">
              <User size={48} className="mx-auto mb-4 opacity-50" />
              <p>Veuillez d'abord sélectionner une vendeuse</p>
            </div>
          );
        }
        return (
          <ProductGrid
            products={productCatalog}
            onAddToCart={addToCart}
          />
        );
      
      case 'reglements':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Règlements</h2>
            <CartSummary
              cart={cart}
              onUpdateQuantity={updateCartQuantity}
              onRemoveItem={removeFromCart}
              onProceedToPayment={() => setShowPaymentModal(true)}
            />
          </div>
        );
      
      case 'diverses':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Lignes diverses</h2>
            <p className="text-gray-600">Fonctionnalité en développement...</p>
          </div>
        );
      
      case 'annulation':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Annulation de vente</h2>
            <p className="text-gray-600">Fonctionnalité en développement...</p>
          </div>
        );
      
      case 'ca':
        const totalSales = sales
          .filter(sale => !sale.canceled)
          .reduce((sum, sale) => sum + sale.totalAmount, 0);
        
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Chiffre d'affaires</h2>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4">Aujourd'hui</h3>
              <p className="text-3xl font-bold text-green-600">{totalSales.toFixed(2)}€</p>
              <p className="text-sm text-gray-600 mt-2">{sales.length} ventes</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">MyConfort Caisse</h1>
            {selectedVendor && (
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedVendor.color }}
                />
                <span className="text-gray-600">{selectedVendor.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {cart.length > 0 && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {cart.length} article{cart.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="p-4">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {renderTabContent()}
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        cart={cart}
        total={cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
        onPayment={handlePayment}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
};

export default App;
