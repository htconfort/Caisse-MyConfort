import React from 'react';
import type { ExtendedCartItem } from '../../types';

interface CancellationTabProps {
  cart: ExtendedCartItem[];
  cartTotal: number;
  clearCart: () => void;
}

export const CancellationTab: React.FC<CancellationTabProps> = ({
  cart,
  cartTotal,
  clearCart
}) => {
  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--dark-green)' }}>
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
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--dark-green)' }}>
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
            style={{ color: 'var(--dark-green)' }}>
            <span>Total à annuler</span>
            <span style={{ color: 'var(--warning-red)' }}>{cartTotal.toFixed(2)}€</span>
          </div>
          <button
            onClick={clearCart}
            className="w-full btn-secondary"
            style={{ backgroundColor: 'var(--warning-red)' }}
          >
            ⚠️ Confirmer l'annulation
          </button>
        </div>
      )}
    </div>
  );
};
