import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { ShoppingCart, User, Package, CreditCard, BarChart, FileText, RotateCcw, Plus, Minus, X, Save, Download, RefreshCw, AlertCircle, Check, Wifi, WifiOff } from 'lucide-react';

// Types complets selon le blueprint
interface CatalogProduct {
  name: string;
  category: ProductCategory;
  priceTTC: number; // 0 = non vendu seul
  autoCalculateHT?: boolean;
  price?: number;
  description?: string;
}

type ProductCategory = 'Matelas' | 'Sur-matelas' | 'Couettes' | 'Oreillers' | 'Plateau' | 'Accessoires';

interface ExtendedCartItem {
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
  items: ExtendedCartItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  date: Date;
  canceled: boolean;
}

type PaymentMethod = 'cash' | 'card' | 'check' | 'multi';
type TabType = 'vendeuse' | 'produits' | 'ventes' | 'diverses' | 'annulation' | 'ca' | 'raz';

// Clés localStorage standardisées
const STORAGE_KEYS = {
  CART: 'myconfort-cart',
  SALES: 'myconfort-sales',
  VENDOR: 'myconfort-current-vendor',
  VENDORS_STATS: 'myconfort-vendors'
};

// Données complètes du catalogue - EXACTEMENT SELON VOTRE LISTE
const productCatalog: CatalogProduct[] = [
  // Matelas
  { category: 'Matelas', name: 'MATELAS BAMBOU 70 x 190', priceTTC: 900, autoCalculateHT: true },
  { category: 'Matelas', name: 'MATELAS BAMBOU 80 x 200', priceTTC: 1050, autoCalculateHT: true },
  { category: 'Matelas', name: 'MATELAS BAMBOU 90 x 190', priceTTC: 1110, autoCalculateHT: true },
  { category: 'Matelas', name: 'MATELAS BAMBOU 90 x 200', priceTTC: 1150, autoCalculateHT: true },
  { category: 'Matelas', name: 'MATELAS BAMBOU 120 x 190', priceTTC: 1600, autoCalculateHT: true },
  { category: 'Matelas', name: 'MATELAS BAMBOU 140 x 190', priceTTC: 1800, autoCalculateHT: true },
  { category: 'Matelas', name: 'MATELAS BAMBOU 140 x 200', priceTTC: 1880, autoCalculateHT: true },
  { category: 'Matelas', name: 'MATELAS BAMBOU 160 x 200', priceTTC: 2100, autoCalculateHT: true },
  { category: 'Matelas', name: 'MATELAS BAMBOU 180 x 200', priceTTC: 2200, autoCalculateHT: true },
  { category: 'Matelas', name: 'MATELAS BAMBOU 200 x 200', priceTTC: 2300, autoCalculateHT: true },

  // Sur-matelas
  { category: 'Sur-matelas', name: 'SURMATELAS BAMBOU 70 x 190', priceTTC: 220, autoCalculateHT: true },
  { category: 'Sur-matelas', name: 'SURMATELAS BAMBOU 80 x 200', priceTTC: 280, autoCalculateHT: true },
  { category: 'Sur-matelas', name: 'SURMATELAS BAMBOU 90 x 190', priceTTC: 310, autoCalculateHT: true },
  { category: 'Sur-matelas', name: 'SURMATELAS BAMBOU 90 x 200', priceTTC: 320, autoCalculateHT: true },
  { category: 'Sur-matelas', name: 'SURMATELAS BAMBOU 120 x 190', priceTTC: 420, autoCalculateHT: true },
  { category: 'Sur-matelas', name: 'SURMATELAS BAMBOU 140 x 190', priceTTC: 440, autoCalculateHT: true },
  { category: 'Sur-matelas', name: 'SURMATELAS BAMBOU 160 x 200', priceTTC: 490, autoCalculateHT: true },
  { category: 'Sur-matelas', name: 'SURMATELAS BAMBOU 180 x 200', priceTTC: 590, autoCalculateHT: true },
  { category: 'Sur-matelas', name: 'SURMATELAS BAMBOU 200 x 200', priceTTC: 630, autoCalculateHT: true },
  
  // Couettes
  { category: 'Couettes', name: 'Couette 220x240', priceTTC: 300, autoCalculateHT: true },
  { category: 'Couettes', name: 'Couette 240 x 260', priceTTC: 350, autoCalculateHT: true },
  
  // Oreillers
  { category: 'Oreillers', name: 'Oreiller Douceur', priceTTC: 80, autoCalculateHT: true },
  { category: 'Oreillers', name: 'Oreiller Thalasso', priceTTC: 60, autoCalculateHT: true },
  { category: 'Oreillers', name: 'Oreiller Dual', priceTTC: 60, autoCalculateHT: true },
  { category: 'Oreillers', name: 'Oreiller Panama', priceTTC: 70, autoCalculateHT: true },
  { category: 'Oreillers', name: 'Oreiller Papillon', priceTTC: 80, autoCalculateHT: true },
  { category: 'Oreillers', name: 'Oreiller Flocon', priceTTC: 50, autoCalculateHT: true },
  { category: 'Oreillers', name: 'Pack de 2 oreillers (thal et dual)', priceTTC: 100, autoCalculateHT: true },
  { category: 'Oreillers', name: 'Pack oreiller 2 douceur', priceTTC: 150, autoCalculateHT: true },
  { category: 'Oreillers', name: 'Pack deux oreillers papillon', priceTTC: 150, autoCalculateHT: true },
  { category: 'Oreillers', name: 'Pack de deux oreillers Panama', priceTTC: 130, autoCalculateHT: true },
  { category: 'Oreillers', name: 'Pack deux oreillers flocons', priceTTC: 90, autoCalculateHT: true },
  { category: 'Oreillers', name: 'Traversin 140', priceTTC: 140, autoCalculateHT: true },
  { category: 'Oreillers', name: 'Traversin 160', priceTTC: 160, autoCalculateHT: true },
  { category: 'Oreillers', name: 'Pack divers', price: 0, priceTTC: 0, autoCalculateHT: false },
  
  // Plateaux
  { category: 'Plateau', name: 'PLATEAU PRESTIGE 70 x 190', priceTTC: 70, autoCalculateHT: true },
  { category: 'Plateau', name: 'PLATEAU PRESTIGE 80 x 200', priceTTC: 80, autoCalculateHT: true },
  { category: 'Plateau', name: 'PLATEAU PRESTIGE 90 x 190', priceTTC: 100, autoCalculateHT: true },
  { category: 'Plateau', name: 'PLATEAU PRESTIGE 90 x 200', priceTTC: 110, autoCalculateHT: true },
  { category: 'Plateau', name: 'PLATEAU PRESTIGE 120 x 190', priceTTC: 160, autoCalculateHT: true },
  { category: 'Plateau', name: 'PLATEAU PRESTIGE 140 x 190', priceTTC: 180, autoCalculateHT: true },
  { category: 'Plateau', name: 'PLATEAU PRESTIGE 140 x 200', priceTTC: 190, autoCalculateHT: true },
  { category: 'Plateau', name: 'PLATEAU PRESTIGE 160 x 200', priceTTC: 210, autoCalculateHT: true },
  { category: 'Plateau', name: 'PLATEAU PRESTIGE 180 x 200', priceTTC: 220, autoCalculateHT: true },
  { category: 'Plateau', name: 'PLATEAU PRESTIGE 200 x 200', priceTTC: 230, autoCalculateHT: true },
  
  // Accessoires
  { category: 'Accessoires', name: 'Le régule jambes', priceTTC: 70, autoCalculateHT: true },
  { category: 'Accessoires', name: 'Protège-matelas', price: 0, priceTTC: 0, autoCalculateHT: false },
  { category: 'Accessoires', name: 'Housse de couette', price: 0, priceTTC: 0, autoCalculateHT: false },
  { category: 'Accessoires', name: 'Taie d\'oreiller', price: 0, priceTTC: 0, autoCalculateHT: false }
];

// Vendeuses disponibles avec couleurs de la charte MyConfort
const vendors: Vendor[] = [
  { id: '1', name: 'Sylvie', dailySales: 0, totalSales: 0, color: '#477A0C' },
  { id: '2', name: 'Babette', dailySales: 0, totalSales: 0, color: '#F55D3E' },
  { id: '3', name: 'Lucia', dailySales: 0, totalSales: 0, color: '#14281D' },
  { id: '4', name: 'Cathy', dailySales: 0, totalSales: 0, color: '#080F0F' },
  { id: '5', name: 'Johan', dailySales: 0, totalSales: 0, color: '#89BBFE' },
  { id: '6', name: 'Sabrina', dailySales: 0, totalSales: 0, color: '#D68FD6' },
  { id: '7', name: 'Billy', dailySales: 0, totalSales: 0, color: '#FFFF99' }, // Jaune poussin
];

// Hook localStorage optimisé avec gestion d'erreurs et compression
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prevState: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // Support versioning
        return parsed.data || parsed;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prevState: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      const compressed = JSON.stringify({
        version: '1.0',
        timestamp: Date.now(),
        data: valueToStore
      });
      window.localStorage.setItem(key, compressed);
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      // Gestion quota dépassé - simplifiée pour éviter les erreurs ESLint
      try {
        localStorage.clear();
        window.localStorage.setItem(key, JSON.stringify({ data: value instanceof Function ? value(storedValue) : value }));
      } catch (clearError) {
        console.error('Failed to clear localStorage:', clearError);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// Hook pour détecter l'état du réseau
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);
    
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);
    
    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);
  
  return isOnline;
};

// Hook debounce pour optimisation
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

// Fonction utilitaire pour extraire les dimensions des matelas/sur-matelas
const extractDimensions = (productName: string): string | null => {
  // Recherche pattern "nombre x nombre" dans le nom
  const match = productName.match(/(\d+)\s*x\s*(\d+)/);
  return match ? `${match[1]} x ${match[2]}` : null;
};

// Fonction pour obtenir le nom sans les dimensions pour les matelas
const getProductNameWithoutDimensions = (productName: string): string => {
  // Retire les dimensions du nom (ex: "MATELAS 70 x 190" -> "MATELAS")
  return productName.replace(/\s*\d+\s*x\s*\d+/, '').trim();
};

// Fonction pour déterminer si un produit nécessite l'affichage spécial matelas
const isMatressProduct = (category: string): boolean => {
  return category === 'Matelas'; // Seulement pour les matelas, pas les sur-matelas
};

// Fonction pour obtenir la couleur de fond selon la catégorie
const getCategoryBackgroundColor = (category: string): string => {
  switch (category) {
    case 'Matelas':
      return '#477A0C'; // Vert pour matelas
    case 'Sur-matelas':
      return '#89BBFE'; // Bleu pour sur-matelas
    case 'Couettes':
      return '#D68FD6'; // Violet pour couettes
    case 'Oreillers':
      return '#F55D3E'; // Rouge/orange pour oreillers
    case 'Plateau':
      return '#14281D'; // Vert foncé pour plateaux
    case 'Accessoires':
      return '#C4D144'; // Jaune-vert pour accessoires
    default:
      return 'white';
  }
};

// Fonction pour déterminer la couleur du texte selon la couleur de fond
const getTextColor = (backgroundColor: string): string => {
  // Couleurs claires qui nécessitent du texte noir
  const lightColors = ['#C4D144', '#89BBFE', '#D68FD6'];
  return lightColors.includes(backgroundColor) ? '#000000' : '#ffffff';
};

// Fonction pour déterminer si les dimensions sont déjà dans le nom du produit
const hasDimensionsInName = (productName: string): boolean => {
  return /\d+\s*x\s*\d+/.test(productName);
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#F2EFE2' }}>
          <div className="text-center p-8 card">
            <AlertCircle size={48} className="mx-auto mb-4" style={{ color: '#F55D3E' }} />
            <h2 className="text-2xl font-bold mb-4" style={{ color: '#14281D' }}>
              Erreur de l'application
            </h2>
            <p className="mb-4" style={{ color: '#6B7280' }}>
              Une erreur inattendue s'est produite.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #C4D144, #B0C639)',
                color: '#14281D',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 600
              }}
            >
              Redémarrer l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Composant principal
function CaisseMyConfortApp() {
  // États principaux avec persistence
  const [activeTab, setActiveTab] = useState<TabType>('vendeuse');
  const [selectedVendor, setSelectedVendor] = useLocalStorage<Vendor | null>(STORAGE_KEYS.VENDOR, null);
  const [cart, setCart] = useLocalStorage<ExtendedCartItem[]>(STORAGE_KEYS.CART, []);
  const [sales, setSales] = useLocalStorage<Sale[]>(STORAGE_KEYS.SALES, []);
  const [vendorStats, setVendorStats] = useLocalStorage<Vendor[]>(STORAGE_KEYS.VENDORS_STATS, vendors);
  
  // États UI
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'Tous'>('Tous');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [miscDescription, setMiscDescription] = useState('');
  const [miscAmount, setMiscAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartMinimized, setIsCartMinimized] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Hooks personnalisés
  const isOnline = useNetworkStatus();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Mise à jour de l'heure toutes les secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Calculs dérivés optimisés avec useMemo
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

  // Gestion du panier optimisée avec useCallback
  const addToCart = useCallback((product: CatalogProduct) => {
    if (product.priceTTC === 0) return; // Produits non vendus seuls
    if (!selectedVendor) {
      // Alerte si aucune vendeuse n'est sélectionnée
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

  // Gestion des ventes avec validation
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
    
    // Mise à jour des stats vendeur
    setVendorStats(prev => prev.map(vendor => 
      vendor.id === selectedVendor.id
        ? { ...vendor, dailySales: vendor.dailySales + cartTotal, totalSales: vendor.totalSales + 1 }
        : vendor
    ));

    clearCart();
    setShowPaymentModal(false);
    setShowSuccess(true);
    
    // Décocher automatiquement la vendeuse après chaque règlement
    // Force une nouvelle sélection pour éviter les erreurs d'attribution
    setSelectedVendor(null);
    
    // Rediriger vers l'onglet vendeuse pour forcer une nouvelle sélection
    setTimeout(() => {
      setActiveTab('vendeuse');
    }, 2000); // Délai pour laisser le temps de voir la confirmation
  }, [selectedVendor, cart, cartTotal, selectedPaymentMethod, setSales, setVendorStats, clearCart, setSelectedVendor]);

  // Timer pour notification de succès
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 4000); // Prolongé pour laisser le temps de lire
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Ajout ligne diverse avec validation
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

  // Export des données optimisé
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

  const convertToCSV = (salesData: Sale[]) => {
    const headers = ['Date', 'Vendeur', 'Montant', 'Mode de paiement', 'Nombre d\'articles'];
    const rows = salesData.map(sale => [
      new Date(sale.date).toLocaleString('fr-FR'),
      sale.vendorName,
      sale.totalAmount.toFixed(2) + '€',
      sale.paymentMethod,
      sale.items.reduce((sum, item) => sum + item.quantity, 0)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  // Remise à zéro sécurisée avec nettoyage complet
  const performReset = useCallback(() => {
    setSales([]);
    setCart([]);
    setVendorStats(vendors);
    setSelectedVendor(null);
    setShowResetModal(false);
    setResetStep(1);
    
    // Nettoyage complet du localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }, [setSales, setCart, setVendorStats, setSelectedVendor]);

  // Filtrage des produits avec recherche
  const filteredProducts = useMemo(() => {
    // DEBUG: Vérification du catalogue complet
    console.log('� === VERIFICATION CATALOGUE RUNTIME ===');
    console.log('�📊 CATALOGUE TOTAL:', productCatalog.length, 'produits');
    
    const counts = {
      'Matelas': productCatalog.filter(p => p.category === 'Matelas').length,
      'Sur-matelas': productCatalog.filter(p => p.category === 'Sur-matelas').length,
      'Couettes': productCatalog.filter(p => p.category === 'Couettes').length,
      'Oreillers': productCatalog.filter(p => p.category === 'Oreillers').length,
      'Plateau': productCatalog.filter(p => p.category === 'Plateau').length,
      'Accessoires': productCatalog.filter(p => p.category === 'Accessoires').length
    };
    
    console.log('📊 DETAIL PAR CATEGORIE:', counts);
    console.log('📊 TOTAL CALCULE:', Object.values(counts).reduce((a, b) => a + b, 0));
    
    // Vérification complète de la structure
    console.log('🔍 CATEGORIES UNIQUES:', [...new Set(productCatalog.map(p => p.category))]);
    console.log('🔍 PREMIERS PRODUITS:', productCatalog.slice(0, 5).map(p => `${p.category}: ${p.name}`));
    console.log('🔍 DERNIERS PRODUITS:', productCatalog.slice(-5).map(p => `${p.category}: ${p.name}`));
    
    let filtered = selectedCategory === 'Tous' 
      ? productCatalog 
      : productCatalog.filter(p => p.category === selectedCategory);
    
    if (debouncedSearchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    
    console.log('🔍 PRODUITS AFFICHES:', filtered.length, 'pour catégorie:', selectedCategory);
    console.log('🚀 === FIN VERIFICATION ===');
    
    return filtered;
  }, [selectedCategory, debouncedSearchTerm]);

  // Navigation tabs
  const tabs: Array<{id: TabType, label: string, icon: any}> = [
    { id: 'vendeuse', label: 'Vendeuse', icon: User },
    { id: 'produits', label: 'Produits', icon: Package },
    { id: 'ventes', label: 'Ventes', icon: BarChart },
    { id: 'diverses', label: 'Diverses', icon: FileText },
    { id: 'annulation', label: 'Annulation', icon: RotateCcw },
    { id: 'ca', label: 'CA Instant', icon: BarChart },
    { id: 'raz', label: 'RAZ', icon: RefreshCw },
  ];

  const categories: Array<ProductCategory | 'Tous'> = ['Tous', 'Matelas', 'Sur-matelas', 'Couettes', 'Oreillers', 'Plateau', 'Accessoires'];

  return (
    <div className="ipad-frame">
      <div className="h-screen flex flex-col" style={{ backgroundColor: '#F2EFE2' }}>

      {/* Header avec safe area */}
      <header className="shadow-lg safe-top header-white-text" style={{ backgroundColor: '#477A0C' }}>
        <div className="px-6 py-4 relative">
          {/* Affichage spécial quand une vendeuse est sélectionnée - nom centré */}
          {selectedVendor ? (
            <>
              {/* Titre fixe à gauche */}
              <div className="absolute left-6 top-1/2 transform -translate-y-1/2">
                <h1 className="text-2xl font-bold text-white header-white-text flex items-center gap-2">
                  <ShoppingCart size={28} color="white" />
                  Caisse MyConfort
                </h1>
              </div>
              
              {/* Date et heure à droite */}
              <div className="absolute top-1/2 transform -translate-y-1/2" style={{ right: '24px' }}>
                <div className="text-white header-white-text text-right">
                  <div className="text-lg font-bold">
                    {currentDateTime.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-xl font-mono">
                    {currentDateTime.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              {/* Nom de la vendeuse sélectionnée centré */}
              <div className="flex justify-center items-center w-full">
                <h2 className="text-6xl font-black text-white tracking-wider animate-pulse" 
                  style={{ 
                    textShadow: '0 0 20px rgba(255,255,255,0.5)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}>
                  {(selectedVendor?.name && typeof selectedVendor.name === 'string') ? selectedVendor.name.toUpperCase() : 'VENDEUSE'}
                </h2>
              </div>
            </>
          ) : (
            /* Layout quand aucune vendeuse n'est sélectionnée - même format avec "VENDEUSE ?" */
            <>
              {/* Titre fixe à gauche */}
              <div className="absolute left-6 top-1/2 transform -translate-y-1/2">
                <h1 className="text-2xl font-bold text-white header-white-text flex items-center gap-2">
                  <ShoppingCart size={28} color="white" />
                  Caisse MyConfort
                </h1>
              </div>
              
              {/* Date et heure à droite */}
              <div className="absolute top-1/2 transform -translate-y-1/2" style={{ right: '24px' }}>
                <div className="text-white header-white-text text-right">
                  <div className="text-lg font-bold">
                    {currentDateTime.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-xl font-mono">
                    {currentDateTime.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              {/* Question "VENDEUSE ?" centré */}
              <div className="flex justify-center items-center w-full">
                <h2 className="text-6xl font-black text-white tracking-wider animate-pulse" 
                  style={{ 
                    textShadow: '0 0 20px rgba(255,255,255,0.5)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}>
                  VENDEUSE ?
                </h2>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Navigation avec optimisation tactile */}
      <nav className="border-b" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex overflow-x-auto">
          {tabs.map(tab => {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap relative touch-feedback ${
                  activeTab === tab.id 
                    ? 'text-white' 
                    : 'hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: activeTab === tab.id ? '#477A0C' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#14281D',
                  minWidth: '120px'
                }}
              >                <tab.icon size={20} />
                {tab.label}
                
                {/* Badge pour Produits - nombre d'articles dans le catalogue */}
                {tab.id === 'produits' && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center text-xs rounded-full"
                    style={{ backgroundColor: '#C4D144', color: '#14281D' }}>
                    {productCatalog.filter(p => p.priceTTC > 0).length}
                  </span>
                )}
                
                {/* Badge pour Ventes - nombre d'articles dans le panier */}
                {tab.id === 'ventes' && cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center text-xs rounded-full"
                    style={{ backgroundColor: '#F59E0B', color: 'white' }}>
                    {cartItemsCount}
                  </span>
                )}
                
                {/* Badge pour Diverses - indication active */}
                {tab.id === 'diverses' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                    style={{ backgroundColor: '#8B5CF6' }}>
                  </span>
                )}
                
                {/* Badge pour Annulation - panier à annuler */}
                {tab.id === 'annulation' && cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center text-xs rounded-full"
                    style={{ backgroundColor: '#F55D3E', color: 'white' }}>
                    {cartItemsCount}
                  </span>
                )}
                
                {/* Badge pour RAZ - avertissement si données présentes */}
                {tab.id === 'raz' && (sales.length > 0 || cart.length > 0) && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center text-xs rounded-full animate-pulse"
                    style={{ backgroundColor: '#DC2626', color: 'white' }}>
                    !
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content avec safe area */}
      <main className="flex-1 overflow-hidden gradient-bg safe-bottom relative">
        <div className={`h-full overflow-auto p-6 ${
          ['produits', 'annulation'].includes(activeTab) 
            ? `main-content-with-cart ${isCartMinimized ? 'cart-minimized' : ''}`
            : ''
        }`}>
          {/* Contenu principal de l'application */}

          {/* Vendeuse Tab */}
          {activeTab === 'vendeuse' && (
            <div className="max-w-5xl mx-auto animate-fadeIn">
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#14281D' }}>
                {!selectedVendor ? 'Sélection de la vendeuse (OBLIGATOIRE)' : 'Sélection de la vendeuse'}
              </h2>
              {!selectedVendor && (
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#FEF3CD', border: '1px solid #F59E0B' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={20} style={{ color: '#D97706' }} />
                    <h3 className="font-bold" style={{ color: '#D97706' }}>
                      Sélection obligatoire
                    </h3>
                  </div>
                  <p style={{ color: '#92400E' }}>
                    Vous devez sélectionner une vendeuse avant de pouvoir utiliser les fonctionnalités de la caisse.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {vendorStats.map(vendor => (
                  <div
                    key={vendor.id}
                    onClick={() => {
                      setSelectedVendor(vendor);
                      // Redirection automatique vers l'onglet Produits après sélection vendeuse
                      setActiveTab('produits');
                    }}
                    className={`card cursor-pointer touch-feedback ${
                      selectedVendor?.id === vendor.id ? 'ring-4 ring-white' : ''
                    }`}
                    style={{
                      backgroundColor: vendor.color,
                      color: 'white',
                      padding: '16px',
                      border: selectedVendor?.id === vendor.id ? '3px solid white' : '1px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className={`text-lg font-bold ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                        {vendor.name}
                      </h3>
                      {selectedVendor?.id === vendor.id && (
                        <Check size={20} color={['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'black' : 'white'} />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className={`text-xs opacity-90 ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                        Ventes: <span className={`font-bold ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                          {vendor.totalSales}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Produits Tab avec recherche */}
          {activeTab === 'produits' && !selectedVendor && (
            <div className="max-w-2xl mx-auto text-center animate-fadeIn">
              <div className="card">
                <AlertCircle size={48} className="mx-auto mb-4" style={{ color: '#F55D3E' }} />
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#14281D' }}>
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

          {activeTab === 'produits' && selectedVendor && (
            <div className="animate-fadeIn">
              {/* Barre de recherche */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input w-full md:w-96"
                />
              </div>

              {/* Categories */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all touch-feedback ${
                      selectedCategory === category
                        ? 'btn-primary'
                        : 'bg-white hover:shadow-md'
                    }`}
                    style={{
                      backgroundColor: selectedCategory === category ? undefined : 'white',
                      color: selectedCategory === category ? undefined : '#14281D'
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Compteur de produits - DEBUG */}
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

              {/* Products Grid - Layout ULTRA-COMPACT optimisé pour coexister avec le panier */}
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)', /* ✅ AUGMENTÉ de 3 à 4 colonnes */
                  gap: '4px', /* ✅ RÉDUIT de 8px à 4px */
                  width: '100%',
                  maxWidth: '100%',
                  marginRight: '340px', /* ✅ Marge fixe pour le panier */
                  padding: '0 8px' /* ✅ AJOUTÉ: padding latéral */
                }}
              >
                {filteredProducts.map((product, index) => {
                  console.log('🔍 RENDU PRODUIT:', index, product.name);
                  
                  const isMatress = isMatressProduct(product.category);
                  const dimensions = extractDimensions(product.name);
                  const productNameOnly = dimensions ? getProductNameWithoutDimensions(product.name) : product.name;
                  const backgroundColor = getCategoryBackgroundColor(product.category);
                  const textColor = getTextColor(backgroundColor);
                  const isSpecialCategory = backgroundColor !== 'white';
                  
                  // Calcul du prix avec remise pour les matelas
                  const discountedPrice = isMatress ? Math.round(product.priceTTC * 0.8) : product.priceTTC;
                  
                  return (
                    <div
                      key={`${product.name}-${index}`}
                      onClick={() => addToCart({...product, priceTTC: discountedPrice})}
                      style={{
                        backgroundColor: backgroundColor,
                        color: textColor,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        padding: '8px', /* ✅ AGRANDI pour plus d'espace */
                        minHeight: '90px', /* ✅ DOUBLÉ de 40px à 90px */
                        maxHeight: '110px', /* ✅ DOUBLÉ de 50px à 110px */
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '4px', /* ✅ RÉDUIT de 6px à 4px */
                        cursor: product.priceTTC === 0 ? 'not-allowed' : 'pointer',
                        opacity: product.priceTTC === 0 ? 0.5 : 1,
                        position: 'relative',
                        transition: 'transform 0.15s, box-shadow 0.15s', /* ✅ RÉDUIT de 0.2s à 0.15s */
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        if (product.priceTTC > 0) {
                          e.currentTarget.style.transform = 'scale(1.005)'; /* ✅ RÉDUIT de 1.01 à 1.005 */
                          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.1)'; /* ✅ RÉDUIT l'ombre */
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Badge de remise pour les matelas - POSITIONNÉ EN BAS À DROITE */}
                      {isMatress && (
                        <div style={{
                          position: 'absolute',
                          bottom: '1px', /* ✅ CHANGÉ de top à bottom */
                          right: '1px',
                          backgroundColor: '#FF0000',
                          color: 'white',
                          padding: '1px 2px',
                          borderRadius: '2px',
                          fontSize: '18px', /* ✅ TRIPLÉ de 6px à 18px */
                          fontWeight: 'bold',
                          zIndex: 10,
                          lineHeight: '1'
                        }}>
                          -20%
                        </div>
                      )}
                      
                      {/* Nom du produit (sans dimensions) - POLICE AGRANDIE x3 */}
                      <h3 style={{ 
                        color: textColor,
                        fontSize: isSpecialCategory ? '21px' : '18px', /* ✅ TRIPLÉ de 7px/6px à 21px/18px */
                        fontWeight: 'bold',
                        marginBottom: '1px',
                        lineHeight: '1',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        maxHeight: '42px' /* ✅ TRIPLÉ de 14px à 42px pour 2 lignes */
                      }}>
                        {productNameOnly}
                      </h3>
                      
                      {/* Dimensions (si présentes) - POLICE AGRANDIE x3 */}
                      {dimensions && (
                        <div style={{ marginBottom: '1px' }}>
                          <p style={{ 
                            color: textColor,
                            fontSize: '24px', /* ✅ TRIPLÉ de 8px à 24px */
                            fontWeight: 'bold',
                            lineHeight: '1'
                          }}>
                            {dimensions}
                          </p>
                        </div>
                      )}
                      
                      {/* Prix - POLICE AGRANDIE x3 */}
                      <p style={{ 
                        color: '#000000',
                        fontSize: '24px', /* ✅ TRIPLÉ de 8px à 24px */
                        fontWeight: 'bold',
                        lineHeight: '1'
                      }}>
                        {product.priceTTC > 0 ? `${discountedPrice}€` : 'Non vendu seul'}
                      </p>
                      
                      {/* Prix barré pour les matelas - POLICE AGRANDIE x3 */}
                      {isMatress && product.priceTTC > 0 && (
                        <p style={{ 
                          color: isSpecialCategory ? 'white' : '#666666', /* ✅ BLANC pour cartes matelas vertes, gris pour autres */
                          textDecoration: 'line-through',
                          fontSize: '18px', /* ✅ TRIPLÉ de 6px à 18px */
                          marginTop: '1px',
                          lineHeight: '1'
                        }}>
                          {product.priceTTC}€
                        </p>
                      )}
                      
                      {product.priceTTC === 0 && (
                        <p style={{ 
                          color: isSpecialCategory ? '#666666' : '#F55D3E',
                          fontSize: '18px', /* ✅ TRIPLÉ de 6px à 18px */
                          marginTop: '1px',
                          lineHeight: '1'
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
                    padding: '24px', /* ✅ RÉDUIT de 48px à 24px */
                    color: '#6B7280'
                  }}>
                    <p>Aucun produit trouvé</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ventes Tab - Historique des ventes */}
          {activeTab === 'ventes' && (
            <div className="animate-fadeIn">
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#14281D' }}>
                Historique des ventes
              </h2>
              
              {/* Statistiques rapides */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card text-center">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#6B7280' }}>
                    Ventes du jour
                  </h3>
                  <p className="text-2xl font-bold" style={{ color: '#477A0C' }}>
                    {sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && !s.canceled).length}
                  </p>
                </div>
                <div className="card text-center">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#6B7280' }}>
                    CA total du jour
                  </h3>
                  <p className="text-2xl font-bold" style={{ color: '#477A0C' }}>
                    {todaySales.toFixed(2)}€
                  </p>
                </div>
                <div className="card text-center">
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#6B7280' }}>
                    Ticket moyen
                  </h3>
                  <p className="text-2xl font-bold" style={{ color: '#477A0C' }}>
                    {sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && !s.canceled).length > 0 
                      ? (todaySales / sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && !s.canceled).length).toFixed(2)
                      : '0.00'
                    }€
                  </p>
                </div>
              </div>

              {/* Liste des ventes */}
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold" style={{ color: '#14281D' }}>
                    Détail des ventes du jour
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => exportData('csv')} className="btn-primary text-sm px-4 py-2">
                      Export CSV
                    </button>
                    <button onClick={() => exportData('json')} className="btn-secondary text-sm px-4 py-2">
                      Export JSON
                    </button>
                  </div>
                </div>
                
                {sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart size={48} className="mx-auto mb-4" style={{ color: '#D1D5DB' }} />
                    <p className="text-xl" style={{ color: '#6B7280' }}>
                      Aucune vente aujourd'hui
                    </p>
                    <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
                      Les ventes apparaîtront ici au fur et à mesure
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2" style={{ borderColor: '#E5E7EB' }}>
                          <th className="text-left py-3 px-2 font-semibold" style={{ color: '#14281D' }}>Heure</th>
                          <th className="text-left py-3 px-2 font-semibold" style={{ color: '#14281D' }}>Vendeuse</th>
                          <th className="text-left py-3 px-2 font-semibold" style={{ color: '#14281D' }}>Articles</th>
                          <th className="text-left py-3 px-2 font-semibold" style={{ color: '#14281D' }}>Paiement</th>
                          <th className="text-right py-3 px-2 font-semibold" style={{ color: '#14281D' }}>Montant</th>
                          <th className="text-center py-3 px-2 font-semibold" style={{ color: '#14281D' }}>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales
                          .filter(s => new Date(s.date).toDateString() === new Date().toDateString())
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(sale => (
                            <tr key={sale.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: '#F3F4F6' }}>
                              <td className="py-3 px-2 text-sm" style={{ color: '#6B7280' }}>
                                {new Date(sale.date).toLocaleTimeString('fr-FR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ 
                                      backgroundColor: vendors.find(v => v.id === sale.vendorId)?.color || '#6B7280' 
                                    }}
                                  ></div>
                                  <span className="font-medium text-sm" style={{ color: '#14281D' }}>
                                    {sale.vendorName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="text-sm">
                                  <span className="font-medium" style={{ color: '#14281D' }}>
                                    {sale.items.reduce((sum, item) => sum + item.quantity, 0)} articles
                                  </span>
                                  <div className="text-xs mt-1 space-y-1" style={{ color: '#6B7280' }}>
                                    {sale.items.slice(0, 2).map((item, index) => (
                                      <div key={index}>
                                        {item.name} x{item.quantity}
                                      </div>
                                    ))}
                                    {sale.items.length > 2 && (
                                      <div style={{ color: '#9CA3AF' }}>
                                        +{sale.items.length - 2} autres...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: sale.paymentMethod === 'card' ? '#DBEAFE' : 
                                                   sale.paymentMethod === 'cash' ? '#D1FAE5' : 
                                                   sale.paymentMethod === 'check' ? '#FEF3CD' : '#F3E8FF',
                                    color: sale.paymentMethod === 'card' ? '#1D4ED8' : 
                                           sale.paymentMethod === 'cash' ? '#065F46' : 
                                           sale.paymentMethod === 'check' ? '#92400E' : '#6B21A8'
                                  }}>
                                  {sale.paymentMethod === 'card' ? '💳 Carte' : 
                                   sale.paymentMethod === 'cash' ? '💵 Espèces' : 
                                   sale.paymentMethod === 'check' ? '📝 Chèque' : '🔄 Multi'}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <span className={`font-bold text-lg ${sale.canceled ? 'line-through' : ''}`}
                                  style={{ color: sale.canceled ? '#F55D3E' : '#477A0C' }}>
                                  {sale.totalAmount.toFixed(2)}€
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                {sale.canceled ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                                    ❌ Annulée
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: '#D1FAE5', color: '#065F46' }}>
                                    ✅ Validée
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Répartition par mode de paiement */}
              {sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && !s.canceled).length > 0 && (
                <div className="card mt-6">
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#14281D' }}>
                    Répartition par mode de paiement
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['card', 'cash', 'check', 'multi'].map(method => {
                      const methodSales = sales.filter(s => 
                        new Date(s.date).toDateString() === new Date().toDateString() && 
                        !s.canceled && 
                        s.paymentMethod === method
                      );
                      const methodTotal = methodSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
                      const methodLabel = method === 'card' ? 'Carte' : 
                                        method === 'cash' ? 'Espèces' : 
                                        method === 'check' ? 'Chèque' : 'Multi';
                      const methodIcon = method === 'card' ? '💳' : 
                                       method === 'cash' ? '💵' : 
                                       method === 'check' ? '📝' : '🔄';
                      
                      return (
                        <div key={method} className="text-center p-4 rounded-lg" 
                          style={{ backgroundColor: '#F8F9FA', border: '1px solid #E9ECEF' }}>
                          <div className="text-2xl mb-2">{methodIcon}</div>
                          <h4 className="font-semibold text-sm mb-1" style={{ color: '#14281D' }}>
                            {methodLabel}
                          </h4>
                          <p className="text-xs mb-1" style={{ color: '#6B7280' }}>
                            {methodSales.length} vente{methodSales.length > 1 ? 's' : ''}
                          </p>
                          <p className="font-bold" style={{ color: '#477A0C' }}>
                            {methodTotal.toFixed(2)}€
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lignes Diverses Tab */}
          {activeTab === 'diverses' && (
            <div className="max-w-2xl mx-auto animate-fadeIn">
              <h2 className="text-3xl font-bold mb-8" style={{ color: '#14281D' }}>
                Ajouter une ligne diverse
              </h2>
              <div className="card">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#14281D' }}>
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
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#14281D' }}>
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
            <div className="max-w-4xl mx-auto animate-fadeIn">
              <h2 className="text-3xl font-bold mb-8" style={{ color: '#14281D' }}>
                Annulation du panier
              </h2>
              {cart.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-xl" style={{ color: '#6B7280' }}>
                    Aucune vente en cours
                  </p>
                </div>
              ) : (
                <div className="card">
                  <h3 className="text-xl font-bold mb-4" style={{ color: '#14281D' }}>
                    Contenu du panier à annuler
                  </h3>
                  <div className="space-y-2 mb-6">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between py-2 border-b">
                        <span>{item.name} x{item.quantity}</span>
                        <span className="font-semibold">
                          {(item.price * item.quantity).toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xl font-bold mb-6"
                    style={{ color: '#14281D' }}>
                    <span>Total à annuler</span>
                    <span style={{ color: '#F55D3E' }}>{cartTotal.toFixed(2)}€</span>
                  </div>
                  <button
                    onClick={clearCart}
                    className="w-full btn-secondary"
                    style={{ backgroundColor: '#F55D3E' }}
                  >
                    ⚠️ Confirmer l'annulation
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CA Instantané Tab */}
          {activeTab === 'ca' && (
            <div className="max-w-4xl mx-auto animate-fadeIn">
              <h2 className="text-3xl font-bold mb-8" style={{ color: '#14281D' }}>
                CA Instantané - Détail des Ventes en Temps Réel
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card text-center">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#6B7280' }}>
                    CA Total du Jour
                  </h3>
                  <p className="text-4xl font-bold" style={{ color: '#477A0C' }}>
                    {todaySales.toFixed(2)}€
                  </p>
                </div>
                <div className="card text-center">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#6B7280' }}>
                    Nombre de Ventes
                  </h3>
                  <p className="text-4xl font-bold" style={{ color: '#C4D144' }}>
                    {sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && !s.canceled).length}
                  </p>
                </div>
                <div className="card text-center">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#6B7280' }}>
                    Ticket Moyen
                  </h3>
                  <p className="text-4xl font-bold" style={{ color: '#F55D3E' }}>
                    {sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && !s.canceled).length > 0 
                      ? (todaySales / sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && !s.canceled).length).toFixed(2) 
                      : '0.00'}€
                  </p>
                </div>
              </div>

              <div className="card mb-6">
                <h3 className="text-xl font-bold mb-6" style={{ color: '#14281D' }}>
                  Performance par Vendeuse - Temps Réel
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendorStats.map(vendor => {
                    const vendorSales = sales.filter(s => 
                      s.vendorId === vendor.id && 
                      new Date(s.date).toDateString() === new Date().toDateString() && 
                      !s.canceled
                    );
                    const avgTicket = vendorSales.length > 0 ? vendor.dailySales / vendorSales.length : 0;
                    const lastSaleTime = vendorSales.length > 0 
                      ? new Date(Math.max(...vendorSales.map(s => new Date(s.date).getTime())))
                      : null;
                    
                    return (
                      <div key={vendor.id} className="card p-4" 
                        style={{ 
                          backgroundColor: vendor.color,
                          border: `3px solid ${vendor.color}`,
                          transform: 'none',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}>
                        <div className="text-center">
                          <h4 className={`text-xl font-bold mb-3 ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                            {vendor.name}
                          </h4>
                          
                          {/* CA du jour */}
                          <div className="mb-4">
                            <p className={`text-xs uppercase tracking-wide mb-1 ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`} 
                              style={{ opacity: 0.8 }}>
                              CA du jour
                            </p>
                            <p className={`text-3xl font-bold ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                              {vendor.dailySales.toFixed(2)}€
                            </p>
                          </div>
                          
                          {/* Statistiques détaillées */}
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className={`${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}
                                style={{ opacity: 0.9 }}>
                                Nombre de ventes:
                              </span>
                              <span className={`font-bold ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                                {vendorSales.length}
                              </span>
                            </div>
                            
                            {avgTicket > 0 && (
                              <div className="flex justify-between">
                                <span className={`${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}
                                  style={{ opacity: 0.9 }}>
                                  Ticket moyen:
                                </span>
                                <span className={`font-bold ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                                  {avgTicket.toFixed(2)}€
                                </span>
                              </div>
                            )}
                            
                            {lastSaleTime && (
                              <div className="flex justify-between">
                                <span className={`${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}
                                  style={{ opacity: 0.9 }}>
                                  Dernière vente:
                                </span>
                                <span className={`font-bold ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                                  {lastSaleTime.toLocaleTimeString('fr-FR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                            )}
                            
                            {/* Pourcentage du CA total */}
                            {todaySales > 0 && (
                              <div className="flex justify-between pt-2 border-t" 
                                style={{ 
                                  borderColor: ['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' 
                                }}>
                                <span className={`${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}
                                  style={{ opacity: 0.9 }}>
                                  Part du CA:
                                </span>
                                <span className={`font-bold ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                                  {((vendor.dailySales / todaySales) * 100).toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Indicateur de statut */}
                          <div className="mt-4 pt-3 border-t" 
                            style={{ 
                              borderColor: ['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' 
                            }}>
                            {vendorSales.length === 0 ? (
                              <span className={`text-xs px-3 py-1 rounded-full ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}
                                style={{ 
                                  backgroundColor: ['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                                  opacity: 0.8 
                                }}>
                                Aucune vente aujourd'hui
                              </span>
                            ) : (
                              <span className={`text-xs px-3 py-1 rounded-full ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}
                                style={{ 
                                  backgroundColor: ['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)' 
                                }}>
                                ✓ Active aujourd'hui
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tableau détaillé des ventes par vendeuse */}
              <div className="mt-8">
                <h3 className="text-2xl font-bold mb-6" style={{ color: '#14281D' }}>
                  Détail des Ventes du Jour
                </h3>
                
                {vendorStats.map(vendor => {
                  const vendorSales = sales.filter(s => 
                    s.vendorId === vendor.id && 
                    new Date(s.date).toDateString() === new Date().toDateString() && 
                    !s.canceled
                  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Plus récent en premier

                  return vendorSales.length > 0 ? (
                    <div key={vendor.id} className="card mb-6">
                      {/* Header vendeuse */}
                      <div className="flex items-center justify-between mb-4 p-3 rounded-lg" 
                        style={{ backgroundColor: vendor.color }}>
                        <h4 className={`text-xl font-bold mb-3 ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                          {vendor.name} - {vendorSales.length} vente{vendorSales.length !== 1 ? 's' : ''}
                        </h4>
                        <div className={`text-2xl font-bold ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                          {vendor.dailySales.toFixed(2)}€
                        </div>
                      </div>

                      {/* Tableau des ventes */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b-2" style={{ borderColor: '#E5E7EB' }}>
                              <th className="text-left py-2 px-3 font-semibold" style={{ color: '#14281D' }}>Heure</th>
                              <th className="text-left py-2 px-3 font-semibold" style={{ color: '#14281D' }}>Produits</th>
                              <th className="text-center py-2 px-3 font-semibold" style={{ color: '#14281D' }}>Mode Paiement</th>
                              <th className="text-right py-2 px-3 font-semibold" style={{ color: '#14281D' }}>Montant</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vendorSales.map((sale, index) => (
                              <tr key={sale.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                style={{ borderColor: '#F3F4F6' }}>
                                {/* Heure */}
                                <td className="py-2 px-3 font-mono text-sm" style={{ color: '#6B7280' }}>
                                  {new Date(sale.date).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                
                                {/* Produits */}
                                <td className="py-2 px-3">
                                  <div className="space-y-1">
                                    {sale.items.map((item, itemIndex) => (
                                      <div key={itemIndex} className="text-sm">
                                        <span style={{ color: '#14281D' }}>
                                          {item.name}
                                        </span>
                                        {item.quantity > 1 && (
                                          <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-200" style={{ color: '#6B7280' }}>
                                            ×{item.quantity}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                
                                {/* Mode de paiement */}
                                <td className="py-2 px-3 text-center">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                                    sale.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800' :
                                    sale.paymentMethod === 'check' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {sale.paymentMethod === 'cash' ? 'Espèces' :
                                     sale.paymentMethod === 'card' ? 'Carte' :
                                     sale.paymentMethod === 'check' ? 'Chèque' :
                                     'Mixte'}
                                  </span>
                                </td>
                                
                                {/* Montant */}
                                <td className="py-2 px-3 text-right">
                                  <span className="text-lg font-bold" style={{ color: vendor.color }}>
                                    {sale.totalAmount.toFixed(2)}€
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null;
                })}

                {/* Message si aucune vente */}
                {sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && !s.canceled).length === 0 && (
                  <div className="card text-center py-8">
                    <p className="text-xl" style={{ color: '#6B7280' }}>
                      Aucune vente enregistrée aujourd'hui
                    </p>
                    <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
                      Les ventes apparaîtront ici en temps réel
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => exportData('csv')} className="btn-primary flex items-center gap-2">
                  <Download size={20} />
                  Export CSV
                </button>
                <button onClick={() => exportData('json')} className="btn-secondary flex items-center gap-2">
                  <Save size={20} />
                  Export JSON
                </button>
              </div>
            </div>
          )}

          {/* RAZ Tab */}
          {activeTab === 'raz' && (
            <div className="max-w-2xl mx-auto animate-fadeIn">
              <h2 className="text-3xl font-bold mb-8" style={{ color: '#14281D' }}>
                Remise à Zéro
              </h2>
              <div className="card">
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#FEE2E2' }}>
                  <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: '#991B1B' }}>
                    <AlertCircle size={20} />
                    Attention - Action irréversible
                  </h3>
                  <p style={{ color: '#991B1B' }}>
                    Cette action supprimera définitivement toutes les données du jour :
                  </p>
                  <ul className="mt-2 space-y-1" style={{ color: '#991B1B' }}>
                    <li>• Historique des ventes</li>
                    <li>• Chiffres d'affaires</li>
                    <li>• Panier en cours</li>
                    <li>• Statistiques vendeuses</li>
                  </ul>
                </div>

                {!showResetModal ? (
                  <button
                    onClick={() => setShowResetModal(true)}
                    className="w-full btn-secondary"
                    style={{ backgroundColor: '#F55D3E' }}
                  >
                    Demander la remise à zéro
                  </button>
                ) : (
                  <div className="space-y-4">
                    {resetStep === 1 && (
                      <>
                        <p className="text-center font-semibold" style={{ color: '#14281D' }}>
                          Êtes-vous sûr de vouloir continuer ?
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setResetStep(2)}
                            className="flex-1 btn-secondary"
                            style={{ backgroundColor: '#F55D3E' }}
                          >
                            Oui, continuer
                          </button>
                          <button
                            onClick={() => {
                              setShowResetModal(false);
                              setResetStep(1);
                            }}
                            className="flex-1 btn-primary"
                          >
                            Annuler
                          </button>
                        </div>
                      </>
                    )}
                    {resetStep === 2 && (
                      <>
                        <p className="text-center font-bold text-lg" style={{ color: '#F55D3E' }}>
                          Dernière confirmation requise
                        </p>
                        <button
                          onClick={performReset}
                          className="w-full btn-secondary"
                          style={{ backgroundColor: '#991B1B' }}
                        >
                          ⚠️ OUI, TOUT SUPPRIMER ⚠️
                        </button>
                        <button
                          onClick={() => {
                            setShowResetModal(false);
                            setResetStep(1);
                          }}
                          className="w-full btn-primary"
                        >
                          Non, annuler
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Success Notification avec animation */}
      {showSuccess && (
        <div className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg animate-fadeIn safe-bottom max-w-sm"
          style={{ backgroundColor: '#D1FAE5', border: '1px solid #A7F3D0' }}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Check size={20} style={{ color: '#065F46' }} />
              <span style={{ color: '#065F46' }} className="font-semibold">Vente enregistrée avec succès !</span>
            </div>
            <div className="text-sm" style={{ color: '#047857' }}>
              ⚠️ Vendeuse décochée automatiquement
            </div>
            <div className="text-xs" style={{ color: '#047857' }}>
              Sélectionnez une nouvelle vendeuse pour l'encaissement suivant
            </div>
          </div>
        </div>
      )}

      {/* Panier flottant - visible uniquement dans certains onglets */}
      {['produits', 'annulation'].includes(activeTab) && (
        <div className={`floating-cart ${isCartMinimized ? 'minimized' : ''}`}>
          <div className="cart-header" style={{ 
            backgroundColor: '#477A0C', 
            padding: isCartMinimized ? '8px' : '16px',
            display: 'flex',
            justifyContent: isCartMinimized ? 'center' : 'space-between',
            alignItems: 'center',
            minHeight: '60px'
          }}>
            {!isCartMinimized ? (
              <>
                <h3 className="text-white font-bold text-lg">
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
                    <p className="text-gray-500">
                      Panier vide
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Ajoutez des produits pour commencer
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-2 mb-4 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded"
                        style={{ backgroundColor: '#F2EFE2' }}>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs truncate" style={{ color: '#14281D' }}>
                            {item.name}
                          </h4>
                          <p className="text-xs" style={{ color: '#477A0C' }}>
                            {item.price}€ x {item.quantity} = {(item.price * item.quantity).toFixed(2)}€
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                            style={{ backgroundColor: '#E8E3D3' }}
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                            style={{ backgroundColor: '#E8E3D3' }}
                          >
                            <Plus size={10} />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-1 text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 mt-auto">
                    <div className="flex justify-between items-center font-bold mb-3"
                      style={{ color: '#14281D' }}>
                      <span>Total TTC</span>
                      <span style={{ color: '#477A0C' }}>{cartTotal.toFixed(2)}€</span>
                    </div>
                    
                    {/* Sélection du mode de paiement */}
                    {cart.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold mb-2" style={{ color: '#14281D' }}>
                          Mode de paiement
                        </h4>
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            onClick={() => setSelectedPaymentMethod('card')}
                            className={`p-2 rounded text-xs font-semibold transition-all ${
                              selectedPaymentMethod === 'card' ? 'ring-2' : ''
                            }`}
                            style={{
                              backgroundColor: selectedPaymentMethod === 'card' ? '#477A0C' : '#E8E3D3',
                              color: selectedPaymentMethod === 'card' ? 'white' : '#14281D'
                            }}
                          >
                            💳 Carte
                          </button>
                          <button
                            onClick={() => setSelectedPaymentMethod('cash')}
                            className={`p-2 rounded text-xs font-semibold transition-all ${
                              selectedPaymentMethod === 'cash' ? 'ring-2' : ''
                            }`}
                            style={{
                              backgroundColor: selectedPaymentMethod === 'cash' ? '#477A0C' : '#E8E3D3',
                              color: selectedPaymentMethod === 'cash' ? 'white' : '#14281D'
                            }}
                          >
                            💵 Espèces
                          </button>
                          <button
                            onClick={() => setSelectedPaymentMethod('check')}
                            className={`p-2 rounded text-xs font-semibold transition-all ${
                              selectedPaymentMethod === 'check' ? 'ring-2' : ''
                            }`}
                            style={{
                              backgroundColor: selectedPaymentMethod === 'check' ? '#477A0C' : '#E8E3D3',
                              color: selectedPaymentMethod === 'check' ? 'white' : '#14281D'
                            }}
                          >
                            📝 Chèque
                          </button>
                          <button
                            onClick={() => setSelectedPaymentMethod('multi')}
                            className={`p-2 rounded text-xs font-semibold transition-all ${
                              selectedPaymentMethod === 'multi' ? 'ring-2' : ''
                            }`}
                            style={{
                              backgroundColor: selectedPaymentMethod === 'multi' ? '#477A0C' : '#E8E3D3',
                              color: selectedPaymentMethod === 'multi' ? 'white' : '#14281D'
                            }}
                          >
                            🔄 Multi
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <button
                        onClick={completeSale}
                        className="w-full btn-primary text-sm py-2"
                        disabled={!selectedVendor || cart.length === 0}
                      >
                        {!selectedVendor ? 'Sélectionner vendeuse' : 'Valider le paiement'}
                      </button>
                      <button
                        onClick={clearCart}
                        className="w-full text-sm py-2 px-3 rounded border"
                        style={{ 
                          borderColor: '#F55D3E', 
                          color: '#F55D3E',
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

// Composant principal avec Error Boundary
export default function CaisseMyConfort() {
  return (
    <ErrorBoundary>
      <CaisseMyConfortApp />
    </ErrorBoundary>
  );
}