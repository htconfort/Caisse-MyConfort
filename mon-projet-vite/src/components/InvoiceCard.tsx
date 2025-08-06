import React from 'react';
import type { Invoice, InvoiceItem, PaymentDetails } from '../services/syncService';

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

  const getPaymentMethodIcon = (method: PaymentDetails['method']) => {
    const icons = {
      cash: '💰',
      card: '💳',
      check: '📝',
      transfer: '🏦',
      installments: '📅',
      multi: '🔄'
    };
    return icons[method] || '💰';
  };

  const getPaymentMethodLabel = (method: PaymentDetails['method']) => {
    const labels = {
      cash: 'Espèces',
      card: 'Carte bancaire',
      check: 'Chèque(s)',
      transfer: 'Virement',
      installments: 'Échelonnement',
      multi: 'Paiement multiple'
    };
    return labels[method] || 'Non spécifié';
  };

  const getPaymentStatusBadge = (status: PaymentDetails['status']) => {
    const statusConfig = {
      pending: { color: 'bg-gray-500', label: '⏳ En attente' },
      partial: { color: 'bg-orange-500', label: '🔄 Partiel' },
      completed: { color: 'bg-green-500', label: '✅ Payé' },
      overdue: { color: 'bg-red-500', label: '⚠️ En retard' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
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
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
        {/* Détails du règlement */}
        {invoice.paymentDetails && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              {getPaymentMethodIcon(invoice.paymentDetails.method)} Détails du règlement
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mode de paiement et statut */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Mode de paiement:</span>
                  <span className="text-sm text-gray-900">
                    {getPaymentMethodLabel(invoice.paymentDetails.method)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Statut:</span>
                  {getPaymentStatusBadge(invoice.paymentDetails.status)}
                </div>
              </div>

              {/* Montants */}
              <div>
                <div className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Total:</span> {formatPrice(invoice.paymentDetails.totalAmount)}
                </div>
                <div className="text-sm text-green-600 mb-1">
                  <span className="font-medium">Payé:</span> {formatPrice(invoice.paymentDetails.paidAmount)}
                </div>
                {invoice.paymentDetails.remainingAmount > 0 && (
                  <div className="text-sm text-orange-600">
                    <span className="font-medium">Restant:</span> {formatPrice(invoice.paymentDetails.remainingAmount)}
                  </div>
                )}
              </div>
            </div>

            {/* Détails spécifiques aux chèques */}
            {invoice.paymentDetails.checkDetails && (
              <div className="mt-3 p-3 bg-white rounded border-l-4 border-blue-400">
                <h6 className="font-medium text-gray-900 mb-2">📝 Détails des chèques</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-700">
                      <span className="font-medium">Total chèques:</span> {invoice.paymentDetails.checkDetails.totalChecks}
                    </div>
                    <div className="text-green-600">
                      <span className="font-medium">Reçus:</span> {invoice.paymentDetails.checkDetails.checksReceived}
                    </div>
                    <div className="text-orange-600">
                      <span className="font-medium">À venir:</span> {invoice.paymentDetails.checkDetails.checksRemaining}
                    </div>
                  </div>
                  <div>
                    {invoice.paymentDetails.checkDetails.nextCheckDate && (
                      <div className="text-blue-600">
                        <span className="font-medium">Prochain chèque:</span><br />
                        {formatDate(invoice.paymentDetails.checkDetails.nextCheckDate)}
                      </div>
                    )}
                  </div>
                </div>
                {invoice.paymentDetails.checkDetails.characteristics && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                    <span className="font-medium">Caractéristiques:</span> {invoice.paymentDetails.checkDetails.characteristics}
                  </div>
                )}
              </div>
            )}

            {/* Détails spécifiques aux cartes bancaires/virements */}
            {invoice.paymentDetails.transactionDetails && (
              <div className="mt-3 p-3 bg-white rounded border-l-4 border-green-400">
                <h6 className="font-medium text-gray-900 mb-2">💳 Détails de la transaction</h6>
                <div className="text-sm space-y-1">
                  {invoice.paymentDetails.transactionDetails.reference && (
                    <div className="text-gray-700">
                      <span className="font-medium">Référence:</span> {invoice.paymentDetails.transactionDetails.reference}
                    </div>
                  )}
                  {invoice.paymentDetails.transactionDetails.bankName && (
                    <div className="text-gray-700">
                      <span className="font-medium">Banque:</span> {invoice.paymentDetails.transactionDetails.bankName}
                    </div>
                  )}
                  {invoice.paymentDetails.transactionDetails.accountLast4 && (
                    <div className="text-gray-700">
                      <span className="font-medium">Carte:</span> **** {invoice.paymentDetails.transactionDetails.accountLast4}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Détails des échelonnements */}
            {invoice.paymentDetails.installments && (
              <div className="mt-3 p-3 bg-white rounded border-l-4 border-purple-400">
                <h6 className="font-medium text-gray-900 mb-2">📅 Paiement échelonné</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-700">
                      <span className="font-medium">Total échéances:</span> {invoice.paymentDetails.installments.totalInstallments}
                    </div>
                    <div className="text-green-600">
                      <span className="font-medium">Payées:</span> {invoice.paymentDetails.installments.completedInstallments}
                    </div>
                    <div className="text-gray-700">
                      <span className="font-medium">Montant échéance:</span> {formatPrice(invoice.paymentDetails.installments.installmentAmount)}
                    </div>
                  </div>
                  <div>
                    {invoice.paymentDetails.installments.nextPaymentDate && (
                      <div className="text-orange-600">
                        <span className="font-medium">Prochaine échéance:</span><br />
                        {formatDate(invoice.paymentDetails.installments.nextPaymentDate)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes de paiement */}
            {invoice.paymentDetails.paymentNotes && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Notes de règlement:</span>
                <p className="text-sm text-gray-600 mt-1">{invoice.paymentDetails.paymentNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Autres informations */}
        {(invoice.vendorName || invoice.notes) && (
          <div>
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
    </div>
  );
};
