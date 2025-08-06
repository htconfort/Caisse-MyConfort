import React from 'react';
import type { Invoice, InvoiceItem } from '../services/syncService';

interface InvoiceCardProps {
  invoice: Invoice;
  onStatusChange: (invoiceId: string, itemId: string, newStatus: InvoiceItem['status']) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onStatusChange }) => {
  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      draft: { color: 'bg-gray-500', label: '📝 Brouillon' },
      sent: { color: 'bg-blue-500', label: '📤 Envoyée' },
      partial: { color: 'bg-orange-500', label: '🔄 Partielle' },
      paid: { color: 'bg-green-500', label: '✅ Payée' },
      cancelled: { color: 'bg-red-500', label: '❌ Annulée' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getItemStatusColor = (status: InvoiceItem['status']) => {
    const colors = {
      pending: 'text-gray-600 bg-gray-100',
      available: 'text-green-600 bg-green-100',
      delivered: 'text-blue-600 bg-blue-100',
      cancelled: 'text-red-600 bg-red-100'
    };
    return colors[status] || colors.pending;
  };

  const getItemStatusIcon = (status: InvoiceItem['status']) => {
    const icons = {
      pending: '⏳',
      available: '✅',
      delivered: '📦',
      cancelled: '❌'
    };
    return icons[status] || '⏳';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)}€`;
  };

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      {/* En-tête de la facture */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {invoice.number}
          </h3>
          <p className="text-gray-600">{invoice.clientName}</p>
          {invoice.clientEmail && (
            <p className="text-sm text-gray-500">{invoice.clientEmail}</p>
          )}
        </div>
        <div className="text-right">
          {getStatusBadge(invoice.status)}
          <p className="text-sm text-gray-500 mt-1">
            Créée le {formatDate(invoice.createdAt)}
          </p>
          <p className="text-lg font-bold text-green-600 mt-1">
            {formatPrice(invoice.totalTTC)}
          </p>
        </div>
      </div>

      {/* Liste des produits */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 mb-3">
          Produits ({invoice.items.length})
        </h4>
        
        {invoice.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{item.productName}</span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {item.category}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Quantité: {item.quantity} × {formatPrice(item.unitPrice)} = {formatPrice(item.totalPrice)}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Statut actuel */}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}>
                {getItemStatusIcon(item.status)} {item.status}
              </span>
              
              {/* Boutons d'action pour changer le statut */}
              <div className="flex gap-1">
                {item.status !== 'available' && (
                  <button
                    onClick={() => onStatusChange(invoice.id, item.id, 'available')}
                    className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                    title="Marquer comme disponible"
                  >
                    ✅
                  </button>
                )}
                {item.status !== 'delivered' && item.status !== 'cancelled' && (
                  <button
                    onClick={() => onStatusChange(invoice.id, item.id, 'delivered')}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="Marquer comme livré"
                  >
                    📦
                  </button>
                )}
                {item.status !== 'cancelled' && (
                  <button
                    onClick={() => onStatusChange(invoice.id, item.id, 'cancelled')}
                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Annuler ce produit"
                  >
                    ❌
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Informations supplémentaires */}
      {(invoice.vendorName || invoice.notes) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {invoice.vendorName && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Vendeuse:</span> {invoice.vendorName}
            </p>
          )}
          {invoice.notes && (
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Notes:</span> {invoice.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
