import { useMemo } from 'react';
import { Download } from 'lucide-react';
import type { Sale } from '../../types';
import { convertToCSV } from '../../utils';
import { vendors } from '../../data';

interface SalesTabProps {
  sales: Sale[];
}

export function SalesTab({ sales }: SalesTabProps) {
  // Fonction utilitaire pour récupérer la couleur d'une vendeuse
  const getVendorColor = (vendorId: string): string => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.color || '#6B7280'; // Couleur par défaut si vendeuse non trouvée
  };

  // Calculs dérivés
  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return sales
      .filter(sale => new Date(sale.date).toDateString() === today && !sale.canceled)
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
  }, [sales]);

  const todaySalesCount = useMemo(() => {
    const today = new Date().toDateString();
    return sales.filter(sale => new Date(sale.date).toDateString() === today && !sale.canceled).length;
  }, [sales]);

  const averageTicket = useMemo(() => {
    return todaySalesCount > 0 ? todaySales / todaySalesCount : 0;
  }, [todaySales, todaySalesCount]);

  const handleExportCSV = () => {
    if (sales.length === 0) return;
    
    const csvContent = convertToCSV(sales);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ventes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold" style={{ color: '#000000' }}>
          Historique des ventes
        </h2>
        
        {sales.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="btn-primary flex items-center gap-2"
          >
            <Download size={16} />
            Exporter CSV
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#000000' }}>
            Ventes du jour
          </h3>
          <p className="text-2xl font-bold" style={{ color: '#000000' }}>
            {todaySales.toFixed(2)}€
          </p>
        </div>
        
        <div className="card text-center">
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#000000' }}>
            Panier moyen
          </h3>
          <p className="text-2xl font-bold" style={{ color: '#000000' }}>
            {averageTicket.toFixed(2)}€
          </p>
        </div>
        
        <div className="card text-center">
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#000000' }}>
            Nombre de ventes
          </h3>
          <p className="text-2xl font-bold" style={{ color: '#000000' }}>
            {todaySalesCount}
          </p>
        </div>
      </div>

      {/* Liste des ventes */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4" style={{ color: '#000000' }}>
          Dernières ventes
        </h3>
        
        {sales.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: '#000000' }}>Aucune vente enregistrée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                  <th className="text-left py-2 px-3 text-sm font-semibold" style={{ color: '#000000' }}>
                    Date/Heure
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-semibold" style={{ color: '#000000' }}>
                    Vendeuse
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-semibold" style={{ color: '#000000' }}>
                    Articles
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-semibold" style={{ color: '#000000' }}>
                    Paiement
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-semibold" style={{ color: '#000000' }}>
                    Montant
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-semibold" style={{ color: '#000000' }}>
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 20)
                  .map((sale, index) => (
                    <tr 
                      key={sale.id || index} 
                      className="border-b relative" 
                      style={{ 
                        borderColor: '#F3F4F6',
                        borderLeft: `6px solid ${getVendorColor(sale.vendorId)}`,
                        backgroundColor: `${getVendorColor(sale.vendorId)}15` // 15 = transparence de 8%
                      }}
                    >
                      <td className="py-2 px-3 text-sm" style={{ color: '#000000' }}>
                        {new Date(sale.date).toLocaleDateString('fr-FR')} {new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 px-3 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getVendorColor(sale.vendorId) }}
                          ></div>
                          <span style={{ color: '#000000' }}>
                            {sale.vendorName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-sm" style={{ color: '#000000' }}>
                        {sale.items.reduce((sum, item) => sum + item.quantity, 0)} article(s)
                      </td>
                      <td className="py-2 px-3 text-sm">
                        <span className="px-2 py-1 rounded text-xs" style={{ 
                          backgroundColor: '#E8E3D3', 
                          color: '#000000' 
                        }}>
                          {sale.paymentMethod === 'card' ? 'Carte' : 
                           sale.paymentMethod === 'cash' ? 'Espèces' : 
                           sale.paymentMethod === 'check' ? 'Chèque' : 'Virement'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-sm text-right font-bold" style={{ color: '#000000' }}>
                        {sale.totalAmount.toFixed(2)}€
                      </td>
                      <td className="py-2 px-3 text-center">
                        {sale.canceled ? (
                          <span className="px-2 py-1 rounded text-xs" style={{ 
                            backgroundColor: '#FEE2E2', 
                            color: '#DC2626' 
                          }}>
                            Annulée
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs" style={{ 
                            backgroundColor: '#D1FAE5', 
                            color: '#059669' 
                          }}>
                            Validée
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
    </div>
  );
}
