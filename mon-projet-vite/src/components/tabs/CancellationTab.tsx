import React, { useMemo, useState } from 'react';
import type { ExtendedCartItem, Sale } from '../../types';
import { vendors } from '../../data';

interface CancellationTabProps {
  cart: ExtendedCartItem[]; // Gardé pour compatibilité mais non utilisé
  cartTotal: number; // Gardé pour compatibilité mais non utilisé
  clearCart: () => void; // Gardé pour compatibilité mais non utilisé
  sales: Sale[];
  cancelLastSale: () => boolean;
  cancelSpecificSale: (saleId: string) => boolean;
}

export const CancellationTab: React.FC<CancellationTabProps> = ({
  sales,
  cancelLastSale,
  cancelSpecificSale
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedSaleForCancellation, setSelectedSaleForCancellation] = useState<Sale | null>(null);

  // Récupérer la dernière vente non annulée
  const lastSale = useMemo(() => {
    return sales
      .filter(sale => !sale.canceled)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [sales]);

  // Récupérer toutes les ventes non annulées triées par date décroissante
  const availableSales = useMemo(() => {
    return sales
      .filter(sale => !sale.canceled)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales]);

  // Fonction pour récupérer la couleur d'une vendeuse
  const getVendorColor = (vendorId: string): string => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.color || '#6B7280';
  };

  const handleCancelLastSale = () => {
    const success = cancelLastSale();
    if (success) {
      setShowConfirmation(false);
    }
  };

  const handleCancelSelectedSale = () => {
    if (!selectedSaleForCancellation) return;
    
    const success = cancelSpecificSale(selectedSaleForCancellation.id);
    if (success) {
      setSelectedSaleForCancellation(null);
    }
  };
  return (
    <div className="max-w-6xl mx-auto animate-fadeIn">
      <h2 className="text-3xl font-bold mb-8" style={{ color: '#000000' }}>
        Gestion des annulations
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Annulation d'une vente antérieure */}
        <div className="card" style={{ backgroundColor: '#FFFBEB' }}>
          <h3 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>
            Annulation d'une vente antérieure
          </h3>
          {availableSales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg" style={{ color: '#000000' }}>
                Aucune vente disponible
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                  Sélectionner une vente à annuler :
                </label>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  {availableSales.map((sale) => (
                    <div
                      key={sale.id}
                      onClick={() => setSelectedSaleForCancellation(sale)}
                      className={`p-3 border-b cursor-pointer transition-colors relative ${
                        selectedSaleForCancellation?.id === sale.id
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                      style={{
                        borderLeft: `6px solid ${getVendorColor(sale.vendorId)}`,
                        backgroundColor: selectedSaleForCancellation?.id === sale.id 
                          ? '#EFF6FF' 
                          : `${getVendorColor(sale.vendorId)}10` // 10 = transparence de 6%
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: getVendorColor(sale.vendorId) }}
                            ></div>
                            <span className="font-medium" style={{ color: '#000000' }}>
                              {sale.vendorName}
                            </span>
                          </div>
                          <div className="text-sm" style={{ color: '#000000' }}>
                            {new Date(sale.date).toLocaleDateString('fr-FR')} à {' '}
                            {new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-sm" style={{ color: '#000000' }}>
                            {sale.items.reduce((sum, item) => sum + item.quantity, 0)} article(s) - {' '}
                            {sale.paymentMethod === 'card' ? 'Carte' : 
                             sale.paymentMethod === 'cash' ? 'Espèces' : 
                             sale.paymentMethod === 'check' ? 'Chèque' : 'Multi'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold" style={{ color: '#000000' }}>
                            {sale.totalAmount.toFixed(2)}€
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSaleForCancellation && (
                <div className="border rounded-lg p-4" style={{ backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }}>
                  <h4 className="font-semibold mb-3" style={{ color: '#D97706' }}>
                    Détails de la vente sélectionnée :
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: '#000000' }}>Vendeuse:</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: getVendorColor(selectedSaleForCancellation.vendorId) }}
                        ></div>
                        <span style={{ color: getVendorColor(selectedSaleForCancellation.vendorId) }}>
                          {selectedSaleForCancellation.vendorName}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#000000' }}>Articles:</span>
                      <span style={{ color: '#000000' }}>{selectedSaleForCancellation.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span style={{ color: '#000000' }}>Montant:</span>
                      <span style={{ color: '#D97706' }}>{selectedSaleForCancellation.totalAmount.toFixed(2)}€</span>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelSelectedSale}
                    className="w-full mt-4 py-2 px-4 rounded-lg font-semibold text-white"
                    style={{ backgroundColor: '#DC2626' }}
                  >
                    🗑️ Annuler cette vente
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Annulation de la dernière vente */}
        <div className="card" style={{ backgroundColor: '#FFFBEB' }}>
          <h3 className="text-xl font-bold mb-4" style={{ color: '#000000' }}>
            Annulation rapide de la dernière vente
          </h3>
          {!lastSale ? (
            <div className="text-center py-8">
              <p className="text-lg" style={{ color: '#000000' }}>
                Aucune vente à annuler
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-medium" style={{ color: '#000000' }}>Vendeuse:</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getVendorColor(lastSale.vendorId) }}
                    ></div>
                    <span style={{ color: getVendorColor(lastSale.vendorId) }}>
                      {lastSale.vendorName}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{ color: '#000000' }}>Date:</span>
                  <span style={{ color: '#000000' }}>
                    {new Date(lastSale.date).toLocaleDateString('fr-FR')} à {' '}
                    {new Date(lastSale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{ color: '#000000' }}>Articles:</span>
                  <span style={{ color: '#000000' }}>{lastSale.items.reduce((sum, item) => sum + item.quantity, 0)} article(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{ color: '#000000' }}>Paiement:</span>
                  <span style={{ color: '#000000' }}>
                    {lastSale.paymentMethod === 'card' ? 'Carte' : 
                     lastSale.paymentMethod === 'cash' ? 'Espèces' : 
                     lastSale.paymentMethod === 'check' ? 'Chèque' : 'Multi'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold pt-2 border-t"
                  style={{ color: '#000000' }}>
                  <span>Montant:</span>
                  <span style={{ color: 'var(--warning-red)' }}>{lastSale.totalAmount.toFixed(2)}€</span>
                </div>
              </div>

              {!showConfirmation ? (
                <button
                  onClick={() => setShowConfirmation(true)}
                  className="w-full py-3 px-4 rounded-lg font-semibold"
                  style={{ 
                    backgroundColor: '#FEE2E2', 
                    color: '#DC2626',
                    border: '2px solid #DC2626'
                  }}
                >
                  🗑️ Annuler la dernière vente
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-center font-semibold" style={{ color: '#DC2626' }}>
                    ⚠️ Êtes-vous sûr de vouloir annuler cette vente ?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowConfirmation(false)}
                      className="py-2 px-4 rounded-lg font-semibold"
                      style={{ 
                        backgroundColor: '#F3F4F6', 
                        color: '#000000' 
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleCancelLastSale}
                      className="py-2 px-4 rounded-lg font-semibold text-white"
                      style={{ backgroundColor: '#DC2626' }}
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
