import { useMemo } from 'react';
import { Download } from 'lucide-react';
import type { Sale } from '../../types';
import type { Invoice } from '../../services/syncService';
import { convertToCSV } from '../../utils';
import { vendors } from '../../data';

interface SalesTabProps {
  sales: Sale[];
  invoices: Invoice[];
}

export function SalesTab({ sales, invoices }: SalesTabProps) {
  // Fonction utilitaire pour récupérer la couleur d'une vendeuse
  const getVendorColor = (vendorId: string): string => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.color || '#6B7280'; // Couleur par défaut si vendeuse non trouvée
  };

  // 🔧 NOUVEAU : Convertir les factures N8N en "ventes externes" pour l'historique
  const invoicesAsSales = useMemo((): Sale[] => {
    return invoices.map((invoice) => ({
      id: `n8n-${invoice.id}`,
      date: invoice.createdAt, // Objet Date requis
      vendorId: invoice.vendorId || '1', // Par défaut Sylvie si pas de vendorId
      vendorName: invoice.vendorName || 'N8N',
      items: invoice.items.map(item => ({
        id: item.id,
        name: item.productName,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        price: item.unitPrice, // Propriété requise par ExtendedCartItem
        totalPrice: item.totalPrice || item.unitPrice * item.quantity,
        addedAt: invoice.createdAt // Objet Date requis par ExtendedCartItem
      })),
      totalAmount: invoice.totalTTC || invoice.items.reduce((sum, item) => 
        sum + (item.totalPrice || item.unitPrice * item.quantity), 0),
      paymentMethod: 'card', // Utiliser un mode de paiement valide par défaut
      canceled: false,
      isExternal: true, // Flag pour distinguer les ventes externes
      clientName: invoice.clientName,
      invoiceNumber: invoice.number
    }));
  }, [invoices]);

  // 🔧 FUSIONNER : ventes caisse + factures N8N converties
  const allSales = useMemo(() => {
    return [...sales, ...invoicesAsSales].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [sales, invoicesAsSales]);

  // Calculs dérivés basés sur TOUTES les ventes (caisse + N8N)
  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return allSales
      .filter(sale => new Date(sale.date).toDateString() === today && !sale.canceled)
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
  }, [allSales]);

  const todaySalesCount = useMemo(() => {
    const today = new Date().toDateString();
    return allSales.filter(sale => new Date(sale.date).toDateString() === today && !sale.canceled).length;
  }, [allSales]);

  const averageTicket = useMemo(() => {
    return todaySalesCount > 0 ? todaySales / todaySalesCount : 0;
  }, [todaySales, todaySalesCount]);

  const handleExportCSV = () => {
    if (allSales.length === 0) return;
    
    const csvContent = convertToCSV(allSales);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ventes_complete_${new Date().toISOString().split('T')[0]}.csv`);
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
        
        {allSales.length > 0 && (
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

      {/* Bloc Dernière vente globale */}
      {allSales.length > 0 && (
        <div className="card mb-6" style={{ 
          background: 'linear-gradient(135deg, #E8E3D3 0%, #F5F5F0 100%)',
          borderLeft: '6px solid #8B7355'
        }}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
            🏆 Dernière vente enregistrée
          </h3>
          
          {(() => {
            const lastSale = allSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
            const isFromCaisse = !lastSale.id?.toString().startsWith('n8n-');
            
            return (
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                border: '2px solid #8B7355'
              }}>
                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {isFromCaisse ? '📱' : '📋'}
                  </div>
                  <div>
                    <p className="font-bold text-lg" style={{ color: '#000000' }}>
                      {isFromCaisse ? 'Vente Caisse' : 'Vente Facturier'}
                    </p>
                    <p className="text-sm" style={{ color: '#666' }}>
                      {lastSale.vendorName} • {new Date(lastSale.date).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: '#000000' }}>
                    {lastSale.totalAmount.toFixed(2)}€
                  </p>
                  <p className="text-sm" style={{ color: '#666' }}>
                    {lastSale.items.reduce((sum, item) => sum + item.quantity, 0)} article(s)
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Section Ventes Caisse */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
          📱 Ventes Caisse (iPad)
          <span className="text-sm font-normal px-2 py-1 rounded" style={{ 
            backgroundColor: '#E8E3D3', 
            color: '#000000' 
          }}>
            {sales.filter(s => !s.canceled).length} vente{sales.filter(s => !s.canceled).length > 1 ? 's' : ''}
          </span>
        </h3>
        
        {sales.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: '#666' }}>Aucune vente caisse enregistrée</p>
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
                  .slice(0, 10)
                  .map((sale, index) => (
                    <tr 
                      key={sale.id || index} 
                      className="border-b relative" 
                      style={{ 
                        borderColor: '#F3F4F6',
                        borderLeft: `6px solid ${getVendorColor(sale.vendorId)}`,
                        backgroundColor: `${getVendorColor(sale.vendorId)}15`
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

      {/* Section Ventes Facturier */}
      <div className="card">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#000000' }}>
          📋 Ventes Facturier (N8N)
          <span className="text-sm font-normal px-2 py-1 rounded" style={{ 
            backgroundColor: '#E3F2FD', 
            color: '#1976D2' 
          }}>
            {invoicesAsSales.length} facture{invoicesAsSales.length > 1 ? 's' : ''}
          </span>
        </h3>
        
        {invoicesAsSales.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: '#666' }}>Aucune facture N8N synchronisée</p>
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
                    Conseillère
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-semibold" style={{ color: '#000000' }}>
                    Client
                  </th>
                  <th className="text-left py-2 px-3 text-sm font-semibold" style={{ color: '#000000' }}>
                    Facture N°
                  </th>
                  <th className="text-right py-2 px-3 text-sm font-semibold" style={{ color: '#000000' }}>
                    Montant
                  </th>
                  <th className="text-center py-2 px-3 text-sm font-semibold" style={{ color: '#000000' }}>
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoicesAsSales
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map((invoice, index) => (
                    <tr 
                      key={invoice.id || index} 
                      className="border-b relative" 
                      style={{ 
                        borderColor: '#F3F4F6',
                        borderLeft: `6px solid ${getVendorColor(invoice.vendorId)}`,
                        backgroundColor: `${getVendorColor(invoice.vendorId)}10`
                      }}
                    >
                      <td className="py-2 px-3 text-sm" style={{ color: '#000000' }}>
                        {new Date(invoice.date).toLocaleDateString('fr-FR')} {new Date(invoice.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 px-3 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getVendorColor(invoice.vendorId) }}
                          ></div>
                          <span style={{ color: '#000000' }}>
                            {invoice.vendorName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-sm" style={{ color: '#000000' }}>
                        {invoice.items[0]?.name || 'Client N8N'}
                      </td>
                      <td className="py-2 px-3 text-sm font-mono" style={{ color: '#1976D2' }}>
                        #{invoice.id?.toString().replace('n8n-', '')}
                      </td>
                      <td className="py-2 px-3 text-sm text-right font-bold" style={{ color: '#000000' }}>
                        {invoice.totalAmount.toFixed(2)}€
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-1 rounded text-xs" style={{ 
                          backgroundColor: '#E3F2FD', 
                          color: '#1976D2' 
                        }}>
                          Facturier
                        </span>
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
