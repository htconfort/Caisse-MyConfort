import { useState } from 'react';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';
import type { 
  TabType, 
  PaymentMethod, 
  Vendor, 
  ExtendedCartItem 
} from '../../types';
import { paymentMethods } from '../../data/constants';

interface FloatingCartProps {
  activeTab: TabType;
  cart: ExtendedCartItem[];
  cartItemsCount: number;
  cartTotal: number;
  selectedVendor: Vendor | null;
  selectedPaymentMethod: PaymentMethod;
  setSelectedPaymentMethod: (method: PaymentMethod) => void;
  updateQuantity: (id: string, change: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  completeSale: () => void;
}

export function FloatingCart({
  activeTab,
  cart,
  cartItemsCount,
  cartTotal,
  selectedVendor,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  updateQuantity,
  removeFromCart,
  clearCart,
  completeSale
}: FloatingCartProps) {
  const [isCartMinimized, setIsCartMinimized] = useState(false);

  // Ne pas afficher le panier sur certains onglets
  if (!['produits', 'annulation'].includes(activeTab)) {
    return null;
  }

  return (
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
  );
}
