import { useState, useMemo } from 'react';
import { ShoppingCart, X, CreditCard, Check, Plus, Minus } from 'lucide-react';

// Types locaux pour éviter les dépendances
interface Vendor {
  id: string;
  name: string;
  color: string;
  dailySales: number;
  totalSales: number;
}

interface ExtendedCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  addedAt: Date;
}

type PaymentMethod = 'card' | 'cash' | 'check' | 'multi';
type TabType = 'vendeuse' | 'produits' | 'reglements' | 'diverses' | 'annulation' | 'ca' | 'raz';

interface FloatingCartProps {
  activeTab: TabType;
  cart: ExtendedCartItem[];
  cartItemsCount: number;
  cartTotal: number;
  selectedVendor: Vendor | null;
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (method: PaymentMethod) => void;
  clearCart: () => void;
  completeSale: () => void;
  updateQuantity?: (itemId: string, newQuantity: number) => void;
}

// Fonction utilitaire pour déterminer si un produit est un matelas
const isMatressProduct = (category: string): boolean => {
  return category === 'Matelas';
};

export function FloatingCart({
  activeTab,
  cart,
  cartItemsCount,
  cartTotal,
  selectedVendor,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  clearCart,
  completeSale,
  updateQuantity
}: FloatingCartProps) {
  const [isCartMinimized, setIsCartMinimized] = useState(false);

  // Méthodes de paiement
  const paymentMethods = [
    { id: 'card' as PaymentMethod, label: 'Carte', emoji: '💳' },
    { id: 'cash' as PaymentMethod, label: 'Espèces', emoji: '💵' },
    { id: 'check' as PaymentMethod, label: 'Chèque', emoji: '📝' },
    { id: 'multi' as PaymentMethod, label: 'Multi', emoji: '🔄' }
  ];

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

  // Ne pas afficher sur certains onglets
  if (!['produits', 'annulation'].includes(activeTab)) {
    return null;
  }

  // Mode minimisé - en haut à droite dans l'iPad
  if (isCartMinimized) {
    return (
      <div 
        style={{
          position: 'fixed',
          right: '20px',
          top: '120px',
          zIndex: 1000,
          maxWidth: '60px'
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
    <div 
      style={{
        position: 'fixed',
        right: '0px',
        top: '80px',
        bottom: '10px',
        width: '350px',
        backgroundColor: 'white',
        borderTopLeftRadius: '16px',
        borderBottomLeftRadius: '16px',
        boxShadow: '-5px 0 20px rgba(0,0,0,0.1)',
        border: '2px solid #477A0C',
        borderRight: 'none',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      
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
            </div>
            <div style={{ 
              fontSize: '14px', 
              opacity: 0.9
            }}>
              {cartItemsCount} articles
            </div>
          </div>
        </div>
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

      {/* Contenu principal du panier */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Liste des produits */}
        {cart.length > 0 && (
          <div style={{ 
            flex: 1,
            padding: '16px 20px 0 20px',
            overflow: 'auto'
          }}>
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#14281D'
            }}>
              Produits
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map((item) => (
                <div 
                  key={item.id}
                  style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: '#14281D',
                        lineHeight: '1.3',
                        marginBottom: '4px'
                      }}>
                        {item.name}
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#6B7280'
                      }}>
                        {item.price.toFixed(2)}€ / unité
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      padding: '4px'
                    }}>
                      <button
                        onClick={() => updateQuantity && updateQuantity(item.id, Math.max(0, item.quantity - 1))}
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
                          color: '#374151'
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
                        onClick={() => updateQuantity && updateQuantity(item.id, item.quantity + 1)}
                        style={{
                          backgroundColor: '#477A0C',
                          border: 'none',
                          borderRadius: '4px',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'white'
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: '#477A0C'
                    }}>
                      {(item.price * item.quantity).toFixed(2)}€
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section des méthodes de paiement et total */}
        <div style={{ 
          padding: '20px',
          borderTop: cart.length > 0 ? '1px solid #e9ecef' : 'none'
        }}>
          
          {/* Section des méthodes de paiement */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#14281D',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CreditCard size={16} />
              Mode de paiement
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '8px',
                    border: `2px solid ${selectedPaymentMethod === method.id ? '#477A0C' : '#D1D5DB'}`,
                    backgroundColor: selectedPaymentMethod === method.id ? '#477A0C' : 'white',
                    color: selectedPaymentMethod === method.id ? 'white' : '#14281D',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{method.emoji}</span>
                  <span>{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section du total */}
          <div style={{ 
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '2px solid #477A0C',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '16px', color: '#6B7280', marginBottom: '8px' }}>
              Total TTC
            </div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#477A0C',
              lineHeight: 1
            }}>
              {cartTotal.toFixed(2).replace('.', ',')}€
            </div>
            {totalSavings > 0 && (
              <div style={{ 
                fontSize: '14px', 
                color: '#F55D3E', 
                marginTop: '8px',
                fontWeight: '600'
              }}>
                Économie: {totalSavings.toFixed(2)}€
              </div>
            )}
          </div>

          {/* Section des actions */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <button
              onClick={completeSale}
              disabled={!selectedVendor || cart.length === 0}
              style={{
                backgroundColor: !selectedVendor || cart.length === 0 ? '#9CA3AF' : '#477A0C',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: !selectedVendor || cart.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                opacity: !selectedVendor || cart.length === 0 ? 0.6 : 1
              }}
            >
              <Check size={18} />
              Valider le paiement
            </button>
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
                opacity: cart.length === 0 ? 0.6 : 1
              }}
            >
              Vider le panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
