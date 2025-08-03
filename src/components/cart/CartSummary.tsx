import React from 'react';
import { useCart } from '../../hooks/useCart';

interface CartProps {
  annulation?: boolean;
  onNavigateToPayment?: () => void;
}

const CartSummary: React.FC<CartProps> = ({ annulation = false, onNavigateToPayment }) => {
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotalPrice, 
    getTotalItems,
    isEmpty 
  } = useCart();

  if (annulation) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-red-600 flex items-center gap-2">
          ❌ <span>Annulation</span>
        </h2>
        
        {isEmpty ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-lg">Panier vide</p>
            <p className="text-sm">Aucun article à annuler</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{item.product.name}</div>
                    <div className="text-sm text-gray-600">
                      {item.product.price.toFixed(2)}€ × {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-600">
                      {item.total.toFixed(2)}€
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="px-3 py-2 bg-[#F55D3E] text-white rounded-lg hover:opacity-90 transition-all duration-200 touch-manipulation transform hover:scale-105 active:scale-95"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="text-xl font-bold text-center p-4 bg-red-100 rounded-lg">
                Total à annuler: {getTotalPrice().toFixed(2)}€
              </div>
              <button
                onClick={clearCart}
                className="w-full py-4 bg-[#F55D3E] text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-all duration-200 touch-manipulation transform hover:scale-[1.02] active:scale-[0.98]"
              >
                🗑️ Vider tout le panier
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        🛒 <span>Panier</span>
        {!isEmpty && (
          <span className="bg-[#477A0C] text-white text-sm px-2 py-1 rounded-full">
            {getTotalItems()}
          </span>
        )}
      </h2>
      
      {isEmpty ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-lg">Panier vide</p>
          <p className="text-sm">Ajoutez des produits pour commencer</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 leading-tight">
                    {item.product.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {item.product.price.toFixed(2)}€ × {item.quantity}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-3">
                  <span className="font-bold text-[#477A0C] text-lg">
                    {item.total.toFixed(2)}€
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors touch-manipulation flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-8 bg-[#477A0C] text-white rounded-lg hover:opacity-90 transition-all touch-manipulation flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Total */}
          <div className="border-t-2 pt-4 mb-6">
            <div className="flex justify-between items-center text-2xl font-bold">
              <span className="text-gray-700">Total:</span>
              <span className="text-[#477A0C]">
                {getTotalPrice().toFixed(2)}€
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {getTotalItems()} article{getTotalItems() > 1 ? 's' : ''}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              className="w-full py-4 bg-[#D68FD6] text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-all duration-200 touch-manipulation transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={onNavigateToPayment}
            >
              💳 Procéder au paiement
            </button>
            <button
              onClick={clearCart}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors touch-manipulation"
            >
              🗑️ Vider le panier
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartSummary;