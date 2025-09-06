import { useState, useMemo } from 'react';
import { ShoppingCart, X, CreditCard, Plus, Minus, Edit3 } from 'lucide-react';
import type { 
  TabType, 
  PaymentMethod, 
  Vendor,
  ExtendedCartItem,
  CartType 
} from '../../types';
import { ExtendedCartItemWithNegotiation, PriceOverrideMeta } from '../../types';
import { isMatressProduct } from '../../utils';
import { ManualInvoiceModal } from './ManualInvoiceModal';
import SimplePriceEditor from './SimplePriceEditor';
import { formatPriceDisplay, calculateFinalPrice } from '../../utils/CartUtils';

// Interface pour les données de paiement étendues
interface PaymentData {
  method:
    | ''
    | 'Carte Bleue'
    | 'Espèces'
    | 'Virement'
    | 'Chèque'
    | 'Chèque au comptant'
    | 'Chèques (3 fois)'
    | 'Chèque à venir'
    | 'Acompte'
    | 'Alma 2x'
    | 'Alma 3x'
    | 'Alma 4x';
  depositAmount?: number;
  almaInstallments?: number;
  chequesCount?: number;
  chequeAmount?: number;
  notes?: string;
}

interface FloatingCartProps {
  activeTab: TabType;
  cart: ExtendedCartItemWithNegotiation[];  // ✅ Support prix négociés
  cartItemsCount: number;
  cartTotal: number;
  selectedVendor: Vendor | null;
  clearCart: () => void;
  completeSale: (paymentMethod?: PaymentMethod, checkDetails?: { count: number; amount: number; totalAmount: number; notes?: string }, manualInvoiceData?: { clientName: string; invoiceNumber: string }) => void;
  updateQuantity?: (itemId: string, newQuantity: number) => void;
  toggleOffert?: (itemId: string) => void;
  cartType?: CartType;
  onCartTypeChange?: (type: CartType) => void;
  // ▼ NOUVEAU: Callback pour sauvegarder les prix négociés
  onPriceOverride?: (itemId: string, override: PriceOverrideMeta) => void;
}

export function FloatingCart({
  activeTab,
  cart,
  cartItemsCount,
  cartTotal,
  selectedVendor,
  clearCart,
  completeSale,
  updateQuantity,
  toggleOffert,
  cartType = 'classique',
  onPriceOverride
}: FloatingCartProps) {
  const [isCartMinimized, setIsCartMinimized] = useState(false);
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [showManualInvoiceModal, setShowManualInvoiceModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    method?: PaymentMethod;
    checkDetails?: { count: number; amount: number; totalAmount: number; notes?: string };
  } | null>(null);
  
  // ▼ NOUVEAU: États pour l'édition des prix
  const [showPriceEditor, setShowPriceEditor] = useState(false);
  const [editingItem, setEditingItem] = useState<ExtendedCartItemWithNegotiation | null>(null);

  // 🚨 DEBUG CART DISPLAY
  console.log('🛒 FloatingCart Debug:', {
    activeTab,
    cartLength: cart.length,
    cartItemsCount,
    cartTotal,
    cart: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
    isCartMinimized
  });

  // ▼ NOUVEAU: Fonctions gestion prix négociés
  const handleEditPrice = (item: ExtendedCartItemWithNegotiation) => {
    setEditingItem(item);
    setShowPriceEditor(true);
  };

  const handleSavePriceOverride = (itemId: string, override: PriceOverrideMeta) => {
    if (onPriceOverride) {
      onPriceOverride(itemId, override);
    }
    setShowPriceEditor(false);
    setEditingItem(null);
  };

  const handleClosePriceEditor = () => {
    setShowPriceEditor(false);
    setEditingItem(null);
  };

  // ▼ NOUVEAU: Calcul total avec négociations
  const cartTotals = useMemo(() => {
    let negotiatedTotal = 0;
    let originalTotal = 0;
    let negotiationSavings = 0;
    let negotiatedItemsCount = 0;

    cart.forEach(item => {
      const finalPrice = calculateFinalPrice(item);
      const originalPrice = item.originalPrice || item.price;
      const lineTotal = item.offert ? 0 : finalPrice * item.quantity;
      const originalLineTotal = item.offert ? 0 : originalPrice * item.quantity;

      negotiatedTotal += lineTotal;
      originalTotal += originalLineTotal;

      if (item.priceOverride?.enabled) {
        negotiatedItemsCount++;
        negotiationSavings += (originalPrice - finalPrice) * item.quantity;
      }
    });

    return {
      negotiatedTotal,
      originalTotal,
      negotiationSavings,
      negotiatedItemsCount,
      totalWithNegotiations: negotiatedTotal // Le vrai total à afficher
    };
  }, [cart]);

  // Calcul des économies
  const totalSavings = useMemo(() => {
    return cart.reduce((total, item) => {
      if (isMatressProduct(item.category)) {
        const originalPrice = Math.round(item.price / 0.8);
        const savings = (originalPrice - item.price) * item.quantity;
        return total + savings;
      }
      return total;
    }, 0);
  }, [cart]);

  // Détection de produits matelas/sur-matelas dans le panier
  const hasMatressProducts = useMemo(() => {
    return cart.some(item => isMatressProduct(item.category));
  }, [cart]);

  const handleCompleteSale = (
    paymentMethod?: PaymentMethod, 
    checkDetails?: { count: number; amount: number; totalAmount: number; notes?: string }
  ) => {
    // Fermer la page de paiement d'abord
    setShowPaymentPage(false);
    
    // Si panier classique + matelas/sur-matelas = forcer saisie client
    if (cartType === 'classique' && hasMatressProducts) {
      setPendingPaymentData({ method: paymentMethod, checkDetails });
      setShowManualInvoiceModal(true);
      return;
    }

    // Sinon, vente normale
    completeSale(paymentMethod, checkDetails);
  };

  // Fonction appelée après saisie des infos client/facture
  const handleManualInvoiceComplete = (manualInvoiceData: { clientName: string; invoiceNumber: string }) => {
    setShowManualInvoiceModal(false);
    
    if (pendingPaymentData) {
      completeSale(
        pendingPaymentData.method, 
        pendingPaymentData.checkDetails, 
        manualInvoiceData
      );
      setPendingPaymentData(null);
    }
  };

  // Ne pas afficher sur certains onglets (garder visible sur vendeuse, produits, annulation)
  if (!['vendeuse', 'produits', 'annulation', 'stock'].includes(activeTab)) {
    console.log('🚫 Cart hidden - wrong tab:', activeTab);
    return null;
  }

  console.log('✅ Cart should display - tab:', activeTab);

  // 🆕 Styles du conteneur principal - panier agrandi jusqu'en bas
  const cartPanelStyles: React.CSSProperties = {
    position: 'absolute',
    right: '10px',
    top: '40px', // ✅ REHAUSSÉ: de 80px à 40px (3cm plus haut)
    bottom: '10px', // Toujours jusqu'en bas, plus de place pour le ruban
    width: '370px', // ✅ ÉLARGI: de 350px à 370px (2cm plus large pour affichage prix)
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    border: '2px solid #477A0C',
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  // Mode minimisé - en haut à droite dans l'application
  if (isCartMinimized) {
    return (
      <div 
        style={{
          position: 'absolute',
          right: '20px',
          top: '20px',
          zIndex: 1000
        }}
      >
        <button
          onClick={() => setIsCartMinimized(false)}
          style={{
            backgroundColor: '#477A0C',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <ShoppingCart size={20} />
          {cartItemsCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: '#F55D3E',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold'
              }}
            >
              {cartItemsCount}
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={cartPanelStyles}>
      
      {/* Header du panier */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #477A0C 0%, #14281D 100%)',
          color: 'white',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShoppingCart size={24} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              Mon Panier
              <span style={{ 
                marginLeft: '8px', 
                fontSize: '10px', 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                padding: '2px 6px', 
                borderRadius: '4px',
                fontWeight: 'normal'
              }}>
                v3.0
              </span>
            </div>
            <div style={{ 
              fontSize: '14px', 
              opacity: 0.9
            }}>
              {cartItemsCount} articles
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsCartMinimized(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Liste des produits dans le panier */}
      {cart.length > 0 ? (
        <div style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {cart.map((item, index) => {
            console.log(`📦 Rendering item ${index}:`, item.name);
            
            // ▼ NOUVEAU: Calcul des prix négociés
            const priceInfo = formatPriceDisplay(item);
            const finalPrice = calculateFinalPrice(item);
            
            return (
            <div
              key={`${item.id}-${index}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: index < cart.length - 1 ? '1px solid #f3f4f6' : 'none'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: '#14281D',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {item.name}
                  {item.offert && (
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 5px',
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      🎁 Offert
                    </span>
                  )}
                  {/* ▼ NOUVEAU: Badge prix modifié ultra-discret et élégant */}
                  {priceInfo.hasOverride && (
                    <span style={{
                      fontSize: '8px',
                      padding: '1px 3px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '2px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px'
                    }}>
                      ✏️
                    </span>
                  )}
                </div>
                {/* ▼ NOUVEAU: Affichage prix optimisé et plus visible */}
                <div style={{ 
                  fontSize: '14px', 
                  color: '#374151',
                  fontWeight: '500',
                  marginTop: '2px'
                }}>
                  {item.offert ? (
                    <span style={{ color: '#059669', fontWeight: '600' }}>
                      GRATUIT × {item.quantity}
                    </span>
                  ) : priceInfo.hasOverride ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ 
                        textDecoration: 'line-through', 
                        color: '#9CA3AF', 
                        fontSize: '11px',
                        opacity: 0.7
                      }}>
                        {priceInfo.originalPrice.toFixed(2)}€
                      </span>
                      <span style={{ 
                        color: '#1d4ed8', 
                        fontWeight: '700',
                        fontSize: '15px'
                      }}>
                        {finalPrice.toFixed(2)}€ × {item.quantity}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontWeight: '600' }}>
                      {finalPrice.toFixed(2)}€ × {item.quantity}
                    </span>
                  )}
                </div>
              </div>
              
              {/* ▼ NOUVEAU: Bouton édition prix élégant et discret */}
              {!item.offert && onPriceOverride && (
                <button
                  onClick={() => handleEditPrice(item)}
                  style={{
                    backgroundColor: priceInfo.hasOverride ? '#dbeafe' : 'transparent',
                    color: priceInfo.hasOverride ? '#1d4ed8' : '#6B7280',
                    border: priceInfo.hasOverride ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginRight: '6px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    minWidth: '28px',
                    justifyContent: 'center',
                    boxShadow: priceInfo.hasOverride ? '0 1px 3px rgba(59, 130, 246, 0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = priceInfo.hasOverride ? '#bfdbfe' : '#f9fafb';
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = priceInfo.hasOverride ? '#dbeafe' : 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = priceInfo.hasOverride ? '0 1px 3px rgba(59, 130, 246, 0.2)' : 'none';
                  }}
                  title="Modifier le prix"
                >
                  <Edit3 size={10} />
                  {priceInfo.hasOverride && (
                    <span style={{ fontSize: '9px' }}>✓</span>
                  )}
                </button>
              )}
              
              {/* Bouton Offert */}
              {toggleOffert && (
                <button
                  onClick={() => toggleOffert(item.id)}
                  style={{
                    backgroundColor: item.offert ? '#dcfce7' : '#f3f4f6',
                    color: item.offert ? '#166534' : '#6B7280',
                    border: item.offert ? '1px solid #bbf7d0' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginRight: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!item.offert) {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!item.offert) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  🎁 {item.offert ? 'Annuler' : 'Offert'}
                </button>
              )}
              
              {/* Contrôles de quantité */}
              {updateQuantity && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginRight: '12px'
                }}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '4px',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#6B7280'
                    }}
                  >
                    <Minus size={12} />
                  </button>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '600',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '4px',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#6B7280'
                    }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              )}
              
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold',
                color: item.offert ? '#166534' : '#477A0C'
              }}>
                {item.offert ? '0.00' : (item.price * item.quantity).toFixed(2)}€
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6B7280',
          fontSize: '14px'
        }}>
          Votre panier est vide
        </div>
      )}

      {/* Contenu principal du panier */}
      <div style={{ 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        
        {/* Section du total */}
        <div style={{ 
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px solid #477A0C',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
            Total TTC
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#477A0C',
            lineHeight: 1
          }}>
            {cartTotals.totalWithNegotiations.toFixed(2).replace('.', ',')}€
          </div>
          
          {/* ▼ NOUVEAU: Affichage des économies simplifiées */}
          {cartTotals.negotiationSavings > 0 && (
            <div style={{ 
              fontSize: '14px', 
              color: '#0369a1', 
              marginTop: '8px',
              fontWeight: '600'
            }}>
              Économie: -{cartTotals.negotiationSavings.toFixed(2)}€
            </div>
          )}
          
          {/* Économies matelas existantes */}
          {totalSavings > 0 && (
            <div style={{ 
              fontSize: '14px', 
              color: '#F55D3E', 
              marginTop: cartTotals.negotiationSavings > 0 ? '4px' : '8px',
              fontWeight: '600'
            }}>
              Économie matelas: -{totalSavings.toFixed(2)}€
            </div>
          )}
        </div>

        {/* Section des actions simplifiées */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Bouton Mode de paiement */}
          <button
            onClick={() => {
              if (!selectedVendor) {
                alert('⚠️ Veuillez d\'abord sélectionner une vendeuse dans l\'onglet "Vendeuse"');
                return;
              }
              if (cart.length === 0) {
                alert('⚠️ Le panier est vide');
                return;
              }
              setShowPaymentPage(true);
            }}
            disabled={!selectedVendor || cart.length === 0}
            style={{
              backgroundColor: (!selectedVendor || cart.length === 0) ? '#9CA3AF' : '#477A0C',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: (!selectedVendor || cart.length === 0) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              opacity: (!selectedVendor || cart.length === 0) ? 0.6 : 1
            }}
          >
            <CreditCard size={18} />
            {!selectedVendor ? 'Sélectionner une vendeuse' : 'Mode de paiement'}
          </button>
          
          {/* Bouton Vider le panier */}
          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            style={{
              backgroundColor: 'white',
              color: '#F55D3E',
              border: '2px solid #F55D3E',
              borderRadius: '12px',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: cart.length === 0 ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <X size={18} />
            Vider le panier
          </button>
        </div>
      </div>

      {/* Page complète de paiement */}
      {showPaymentPage && (
        <StepPaymentNoScroll 
          cartTotal={cartTotal}
          onBack={() => setShowPaymentPage(false)}
          onSelectPayment={handleCompleteSale}
        />
      )}

      {/* Modale de saisie manuelle client/facture */}
      <ManualInvoiceModal
        isOpen={showManualInvoiceModal}
        onClose={() => {
          setShowManualInvoiceModal(false);
          setPendingPaymentData(null);
        }}
        onSave={handleManualInvoiceComplete}
        cartTotal={cartTotal}
        reason="matelas-classique"
      />
      </div>

      {/* ▼ NOUVEAU: Modal d'édition des prix simplifiée */}
      <SimplePriceEditor
        isOpen={showPriceEditor}
        item={editingItem}
        onClose={handleClosePriceEditor}
        onSave={handleSavePriceOverride}
      />

      {/* 🆕 Ruban bas de page supprimé - le panier va maintenant jusqu'en bas */}
    </>
  );
}

// Composant de paiement complet - Version adaptée pour FloatingCart
function StepPaymentNoScroll({ 
  cartTotal, 
  onBack, 
  onSelectPayment 
}: { 
  cartTotal: number; 
  onBack: () => void; 
  onSelectPayment: (method: PaymentMethod, checkDetails?: { count: number; amount: number; totalAmount: number; notes?: string }) => void; 
}) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentData['method']>('');
  const [acompte, setAcompte] = useState<number>(0);
  const [showAlmaPage, setShowAlmaPage] = useState(false);
  const [showChequesPage, setShowChequesPage] = useState(false);
  const [checkDetails, setCheckDetails] = useState<{ count: number; amount: number; totalAmount: number; notes?: string } | null>(null);

  const restePay = Math.max(0, cartTotal - acompte);
  const isValidPayment = !!selectedMethod && acompte >= 0 && acompte <= cartTotal;

  // Pages secondaires pour Alma
  if (showAlmaPage) {
    return (
      <AlmaDetailsPage
        totalAmount={cartTotal}
        acompte={acompte}
        onBack={() => setShowAlmaPage(false)}
        onSelect={(installments) => {
          const method = `Alma ${installments}x` as PaymentData['method'];
          setSelectedMethod(method);
          setShowAlmaPage(false);
        }}
      />
    );
  }

  // Pages secondaires pour Chèques
  if (showChequesPage) {
    return (
      <ChequesDetailsPage
        totalAmount={cartTotal}
        acompte={acompte}
        onBack={() => setShowChequesPage(false)}
        onComplete={(data: { count: number; amount: number; notes: string }) => {
          const totalAmount = data.count * data.amount;
          const checkInfo = {
            count: data.count,
            amount: data.amount,
            totalAmount: totalAmount,
            notes: data.notes
          };
          setCheckDetails(checkInfo);
          setSelectedMethod('Chèque à venir');
          setShowChequesPage(false);
          console.log('Chèques configurés:', checkInfo);
        }}
      />
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f8f9fa',
      zIndex: 1200,
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#14281D',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            💳 Mode de Règlement
          </h1>
          <p style={{ 
            color: '#6B7280', 
            fontSize: '16px',
            margin: '4px 0 0 0' 
          }}>
            Total : {cartTotal.toFixed(2)}€ TTC
          </p>
        </div>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6B7280',
            padding: '8px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Summary */}
        <div style={{
          backgroundColor: '#f0f9ff',
          padding: '20px',
          borderRadius: '16px',
          border: '2px solid #bfdbfe',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '16px', 
            textAlign: 'center' 
          }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#14281D' }}>
                {cartTotal.toFixed(2)}€
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>Total TTC</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                {acompte.toFixed(2)}€
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>Acompte</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                {restePay.toFixed(2)}€
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>Reste à payer</div>
            </div>
          </div>
        </div>

        {/* Acompte */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#14281D', 
            marginBottom: '12px' 
          }}>
            Acompte (€) *
          </label>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '8px', 
            marginBottom: '12px' 
          }}>
            {[20, 30, 40, 50].map(pct => {
              const suggested = Math.round((cartTotal * pct) / 100);
              return (
                <button
                  key={pct}
                  onClick={() => setAcompte(suggested)}
                  style={{
                    padding: '12px 8px',
                    backgroundColor: '#dbeafe',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#bfdbfe'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
                >
                  {pct}% ({suggested}€)
                </button>
              );
            })}
          </div>
          <input
            type="number"
            value={acompte}
            onChange={(e) => setAcompte(Number(e.target.value) || 0)}
            min={0}
            max={cartTotal}
            placeholder="0"
            style={{
              width: '100%',
              fontSize: '20px',
              fontWeight: 'bold',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              backgroundColor: 'white'
            }}
          />
        </div>

        {/* Payment methods */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '12px' 
        }}>
          
          {/* Espèces */}
          <PaymentCard
            active={selectedMethod === 'Espèces'}
            title="Espèces"
            subtitle="Paiement comptant"
            emoji="💵"
            onClick={() => {
              setSelectedMethod('Espèces');
              onSelectPayment('cash');
            }}
          />

          {/* Virement */}
          <PaymentCard
            active={selectedMethod === 'Virement'}
            title="Virement"
            subtitle="Banque à banque"
            emoji="🏦"
            onClick={() => {
              setSelectedMethod('Virement');
              onSelectPayment('multi'); // On garde 'multi' pour les méthodes étendues
            }}
          />

          {/* Carte bleue */}
          <PaymentCard
            active={selectedMethod === 'Carte Bleue'}
            title="Carte bleue"
            subtitle="CB comptant"
            emoji="💳"
            onClick={() => {
              setSelectedMethod('Carte Bleue');
              onSelectPayment('card');
            }}
          />

          {/* Alma */}
          <PaymentCard
            active={selectedMethod?.startsWith('Alma')}
            title={selectedMethod?.startsWith('Alma') ? selectedMethod : 'Alma'}
            subtitle={selectedMethod?.startsWith('Alma') ? 'Configuré ✓' : '2x, 3x ou 4x →'}
            emoji="💳"
            onClick={() => setShowAlmaPage(true)}
            highlight="blue"
          />

          {/* Chèque comptant */}
          <PaymentCard
            active={selectedMethod === 'Chèque au comptant'}
            title="Chèque (comptant)"
            subtitle="Remis à la commande"
            emoji="🧾"
            onClick={() => {
              setSelectedMethod('Chèque au comptant');
              onSelectPayment('check');
            }}
          />

          {/* Chèques à venir */}
          <PaymentCard
            active={selectedMethod === 'Chèque à venir'}
            title="Chèques à venir"
            subtitle={checkDetails ? `${checkDetails.count} chèques de ${checkDetails.amount}€ ✓` : "Planifier le paiement échelonné →"}
            emoji="📄"
            onClick={() => setShowChequesPage(true)}
            highlight="amber"
          />
        </div>

        {/* Footer avec validation */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '2px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={onBack}
            style={{
              backgroundColor: '#f3f4f6',
              color: '#6B7280',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
          
          <button
            onClick={() => {
              if (isValidPayment && selectedMethod) {
                // Mapper les méthodes vers PaymentMethod
                let paymentMethod: PaymentMethod = 'multi';
                if (selectedMethod === 'Espèces') paymentMethod = 'cash';
                else if (selectedMethod === 'Carte Bleue') paymentMethod = 'card';
                else if (selectedMethod.includes('Chèque')) paymentMethod = 'check';
                
                // Passer les détails des chèques si c'est un paiement par chèques à venir
                if (selectedMethod === 'Chèque à venir' && checkDetails) {
                  onSelectPayment(paymentMethod, checkDetails);
                } else {
                  onSelectPayment(paymentMethod);
                }
              }
            }}
            disabled={!isValidPayment}
            style={{
              backgroundColor: isValidPayment ? '#477A0C' : '#9CA3AF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isValidPayment ? 'pointer' : 'not-allowed',
              opacity: isValidPayment ? 1 : 0.6
            }}
          >
            Valider le paiement →
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant de carte de paiement
function PaymentCard({
  active,
  title,
  subtitle,
  emoji,
  onClick,
  highlight,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  emoji?: string;
  onClick: () => void;
  highlight?: 'amber' | 'blue';
}) {
  const getActiveStyles = () => {
    if (highlight === 'amber') {
      return 'border: 2px solid #f59e0b; backgroundColor: #fef3c7; boxShadow: 0 4px 12px rgba(245, 158, 11, 0.3)';
    } else if (highlight === 'blue') {
      return 'border: 2px solid #3b82f6; backgroundColor: #dbeafe; boxShadow: 0 4px 12px rgba(59, 130, 246, 0.3)';
    }
    return 'border: 2px solid #477A0C; backgroundColor: #f0f9ff; boxShadow: 0 4px 12px rgba(71, 122, 12, 0.3)';
  };

  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: active ? undefined : '2px solid #d1d5db',
        backgroundColor: active ? undefined : 'white',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left',
        width: '100%',
        ...(active && { cssText: getActiveStyles() })
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = '#477A0C';
          e.currentTarget.style.backgroundColor = '#f8f9fa';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.backgroundColor = 'white';
        }
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '8px' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          <span style={{ fontSize: '24px' }}>{emoji}</span>
          <div style={{ fontWeight: '600', fontSize: '16px' }}>{title}</div>
        </div>
      </div>
      <div style={{ fontSize: '14px', color: '#6B7280' }}>{subtitle}</div>
    </button>
  );
}

// Page Alma simplifiée
function AlmaDetailsPage({
  totalAmount,
  acompte,
  onBack,
  onSelect,
}: {
  totalAmount: number;
  acompte: number;
  onBack: () => void;
  onSelect: (installments: number) => void;
}) {
  const restePay = Math.max(0, totalAmount - acompte);
  const options = [
    { times: 2, label: '2 fois', fee: '1.5%', amount: restePay / 2 },
    { times: 3, label: '3 fois', fee: '2.5%', amount: restePay / 3 },
    { times: 4, label: '4 fois', fee: '3.5%', amount: restePay / 4 },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#f8f9fa',
      zIndex: 1250,
      overflowY: 'auto'
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: 'white'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#14281D',
          margin: 0 
        }}>
          💳 Paiement Alma
        </h1>
        <p style={{ 
          color: '#6B7280', 
          fontSize: '16px',
          margin: '4px 0 0 0' 
        }}>
          Reste à payer : {restePay.toFixed(2)}€
        </p>
      </div>

      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {options.map(option => (
            <button
              key={option.times}
              onClick={() => onSelect(option.times)}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '2px solid #d1d5db',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}>
                <div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: '#14281D' 
                  }}>
                    Alma {option.label}
                  </div>
                  <div style={{ color: '#6B7280' }}>
                    Frais : {option.fee} • {option.amount.toFixed(2)}€ / mois
                  </div>
                </div>
                <div style={{ fontSize: '24px' }}>→</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onBack}
          style={{
            marginTop: '32px',
            backgroundColor: '#f3f4f6',
            color: '#6B7280',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ← Retour
        </button>
      </div>
    </div>
  );
}

// Page Chèques simplifiée
function ChequesDetailsPage({
  totalAmount,
  acompte,
  onBack,
  onComplete,
}: {
  totalAmount: number;
  acompte: number;
  onBack: () => void;
  onComplete: (data: { count: number; amount: number; notes: string }) => void;
}) {
  const restePay = Math.max(0, totalAmount - acompte);
  const [chequeCount, setChequeCount] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');

  const perCheque = Math.floor(restePay / chequeCount);
  const remainder = restePay - perCheque * chequeCount;
  const isValid = chequeCount >= 2 && chequeCount <= 10 && perCheque > 0;

  const tabs = Array.from({ length: 9 }, (_, i) => i + 2);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#fffbeb',
      zIndex: 1250,
      overflowY: 'auto'
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '2px solid #fbbf24',
        backgroundColor: '#fef3c7'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#92400e',
          margin: 0 
        }}>
          📄 Chèques à venir
        </h1>
        <p style={{ 
          color: '#92400e', 
          fontSize: '16px',
          margin: '4px 0 0 0' 
        }}>
          Reste à payer : {restePay.toFixed(2)}€
        </p>
      </div>

      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Tabs pour nombre de chèques */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            marginBottom: '12px' 
          }}>
            {tabs.map(n => (
              <button
                key={n}
                onClick={() => setChequeCount(n)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: chequeCount === n ? '#f59e0b' : 'white',
                  color: chequeCount === n ? 'white' : '#92400e',
                  ...(chequeCount === n && { boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)' })
                }}
              >
                {n}x
              </button>
            ))}
          </div>
          <div style={{ fontSize: '14px', color: '#92400e' }}>
            Choisissez le nombre de chèques (2 à 10)
          </div>
        </div>

        {/* Calcul */}
        <div style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '12px',
          border: '2px solid #fbbf24',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px', 
            textAlign: 'center' 
          }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>
                {perCheque}€
              </div>
              <div style={{ fontSize: '14px', color: '#78350f' }}>
                Montant par chèque
              </div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#92400e' }}>
                {remainder > 0 ? `+${remainder}€` : '✓ Exact'}
              </div>
              <div style={{ fontSize: '14px', color: '#78350f' }}>
                {remainder > 0 ? 'À ajouter sur le 1er chèque' : 'Répartition parfaite'}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#92400e', 
            marginBottom: '8px' 
          }}>
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Ex : premier chèque à l'installation, suivants tous les 30 jours…"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #fbbf24',
              borderRadius: '12px',
              backgroundColor: 'white',
              resize: 'none',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <button
            onClick={onBack}
            style={{
              backgroundColor: '#f3f4f6',
              color: '#6B7280',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
          
          <button
            onClick={() => {
              if (isValid) {
                onComplete({ count: chequeCount, amount: perCheque, notes });
              }
            }}
            disabled={!isValid}
            style={{
              backgroundColor: isValid ? '#f59e0b' : '#9CA3AF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isValid ? 'pointer' : 'not-allowed',
              opacity: isValid ? 1 : 0.6
            }}
          >
            Confirmer →
          </button>
        </div>
      </div>
    </div>
  );
}