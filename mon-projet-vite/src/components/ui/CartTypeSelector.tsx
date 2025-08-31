import React from 'react';
import { Package, FileText } from 'lucide-react';

export type CartType = 'classique' | 'facturier';

interface CartTypeSelectorProps {
  cartType: CartType;
  onChange: (type: CartType) => void;
  className?: string;
}

export function CartTypeSelector({ cartType, onChange, className = '' }: CartTypeSelectorProps) {
  return (
    <div 
      className={className}
      style={{
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        border: '2px solid #e5e7eb',
        marginBottom: '16px'
      }}
    >
      <div style={{ 
        fontSize: '14px', 
        fontWeight: '600', 
        color: '#14281D', 
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🛒 Type de panier
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '8px',
        marginBottom: '12px' 
      }}>
        <button
          onClick={() => onChange('classique')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '8px',
            border: cartType === 'classique' ? '2px solid #477A0C' : '2px solid #d1d5db',
            backgroundColor: cartType === 'classique' ? '#f0f9ff' : 'white',
            color: cartType === 'classique' ? '#477A0C' : '#6B7280',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            ...(cartType === 'classique' && { boxShadow: '0 2px 8px rgba(71, 122, 12, 0.2)' })
          }}
        >
          <Package size={16} />
          Classique
        </button>
        
        <button
          onClick={() => onChange('facturier')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '8px',
            border: cartType === 'facturier' ? '2px solid #3b82f6' : '2px solid #d1d5db',
            backgroundColor: cartType === 'facturier' ? '#dbeafe' : 'white',
            color: cartType === 'facturier' ? '#3b82f6' : '#6B7280',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            ...(cartType === 'facturier' && { boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)' })
          }}
        >
          <FileText size={16} />
          Facturier
        </button>
      </div>
      
      <div style={{ 
        fontSize: '12px', 
        color: '#6B7280',
        lineHeight: 1.4
      }}>
        {cartType === 'classique' ? (
          <span>
            ✅ <strong>Toutes catégories disponibles</strong> - Vente directe caisse.
          </span>
        ) : (
          <span>
            ⚠️ <strong>Matelas & Sur-matelas bloqués</strong> pour éviter les doublons N8N.
          </span>
        )}
      </div>
    </div>
  );
}

export default CartTypeSelector;
