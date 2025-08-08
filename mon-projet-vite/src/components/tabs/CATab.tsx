import React, { useMemo } from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import type { Sale, Vendor } from '../../types';
import type { Invoice } from '../../services/syncService';
import { vendors } from '../../data';

interface CATabProps {
  sales: Sale[];
  vendorStats: Vendor[];
  invoices: Invoice[];
}

export const CATab: React.FC<CATabProps> = ({ sales, invoices }) => {
  // Fonction pour récupérer la couleur d'une vendeuse
  const getVendorColor = (vendorId: string): string => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.color || '#6B7280';
  };

  // 🔧 CORRECTION MAJEURE : Calcul du CA total incluant les factures N8N
  const totalCA = useMemo(() => {
    // CA des ventes caisse (existant)
    const salesCA = sales
      .filter(sale => !sale.canceled)
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    // 🎯 Debug des factures N8N
    console.log(`🔍 DEBUG FACTURES N8N:
    - Nombre total de factures: ${invoices.length}
    - Première facture:`, invoices[0]);
    
    // 🎯 CA des factures N8N - TOUTES les factures
    const invoicesCA = invoices.reduce((sum, invoice) => {
      // Utiliser le total TTC ou calculer depuis les items
      const invoiceTotal = invoice.totalTTC || 
        invoice.items.reduce((itemSum, item) => itemSum + (item.totalPrice || item.unitPrice * item.quantity), 0);
      
      console.log(`    → Facture ${invoice.number} (${invoice.clientName}): ${invoiceTotal}€`);
      return sum + invoiceTotal;
    }, 0);
    
    // Total combiné
    const combinedCA = salesCA + invoicesCA;
    
    console.log(`💰 CA INSTANTANÉ CALCULÉ:
    - Ventes caisse: ${salesCA.toFixed(2)}€ (${sales.filter(s => !s.canceled).length} ventes)
    - Factures N8N: ${invoicesCA.toFixed(2)}€ (${invoices.length} factures)
    - TOTAL: ${combinedCA.toFixed(2)}€`);
    
    return combinedCA;
  }, [sales, invoices]);

  // 🔧 CORRECTION : CA par vendeuse incluant les factures N8N
  const vendorCAs = useMemo(() => {
    const caByVendor: Record<string, number> = {};
    
    // 1. Calculer le CA des ventes caisse pour chaque vendeuse
    sales
      .filter(sale => !sale.canceled)
      .forEach(sale => {
        if (!caByVendor[sale.vendorId]) {
          caByVendor[sale.vendorId] = 0;
        }
        caByVendor[sale.vendorId] += sale.totalAmount;
      });

    // 2. 🎯 NOUVEAU : Ajouter le CA des factures N8N pour chaque vendeuse
    invoices.forEach(invoice => {
      if (invoice.vendorId) {
        const invoiceTotal = invoice.totalTTC || 
          invoice.items.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity), 0);
        
        if (!caByVendor[invoice.vendorId]) {
          caByVendor[invoice.vendorId] = 0;
        }
        caByVendor[invoice.vendorId] += invoiceTotal;
        
        console.log(`💰 Facture ${invoice.number} → Vendeuse ${invoice.vendorId} (${invoice.vendorName}): +${invoiceTotal}€`);
      } else {
        console.log(`⚠️ Facture ${invoice.number} sans vendorId (vendorName: ${invoice.vendorName})`);
      }
    });

    // 3. Mapper avec les données des vendeuses
    const result = vendors.map(vendor => ({
      ...vendor,
      realCA: caByVendor[vendor.id] || 0
    })).sort((a, b) => b.realCA - a.realCA); // Trier par CA décroissant
    
    console.log(`👥 CA PAR VENDEUSE:`, result.filter(v => v.realCA > 0));
    
    return result;
  }, [sales, invoices]);

  // Calcul du nombre total de ventes (caisse + factures)
  const totalSalesCount = useMemo(() => {
    const salesCount = sales.filter(sale => !sale.canceled).length;
    const invoicesCount = invoices.length; // TOUTES les factures comme dans le CA
    
    console.log(`📊 TRANSACTIONS TOTALES: ${salesCount} ventes caisse + ${invoicesCount} factures N8N = ${salesCount + invoicesCount} total`);
    
    return salesCount + invoicesCount;
  }, [sales, invoices]);

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold" style={{ color: '#000000' }}>
          Chiffre d'Affaires Instantané
        </h2>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#6B7280' }}>
          <TrendingUp size={16} />
          <span>Mis à jour en temps réel</span>
        </div>
      </div>

      {/* CA Global */}
      <div className="card mb-6" style={{ backgroundColor: '#F0FDF4', borderLeft: '6px solid #16A34A' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#000000' }}>
              Chiffre d'Affaires Total
            </h3>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {totalSalesCount} vente{totalSalesCount > 1 ? 's' : ''} réalisée{totalSalesCount > 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold" style={{ color: '#16A34A' }}>
              {totalCA.toFixed(2)}€
            </div>
            <div className="flex items-center gap-1 mt-1" style={{ color: '#16A34A' }}>
              <DollarSign size={14} />
              <span className="text-sm font-medium">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* CA par Vendeuse */}
      <div className="card">
        <h3 className="text-xl font-bold mb-6" style={{ color: '#000000' }}>
          Chiffre d'Affaires par Vendeuse
        </h3>

        {vendorCAs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg" style={{ color: '#000000' }}>
              Aucune vendeuse enregistrée
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendorCAs.map((vendor, index) => {
              const percentage = totalCA > 0 ? (vendor.realCA / totalCA) * 100 : 0;
              const salesCount = sales.filter(sale => 
                sale.vendorId === vendor.id && !sale.canceled
              ).length;

              return (
                <div
                  key={vendor.id}
                  className="card relative overflow-hidden"
                  style={{
                    borderLeft: `8px solid ${getVendorColor(vendor.id)}`,
                    backgroundColor: `${getVendorColor(vendor.id)}30`,
                    border: `2px solid ${getVendorColor(vendor.id)}40`
                  }}
                >
                  {/* Badge du classement pour le top 3 */}
                  {index < 3 && vendor.realCA > 0 && (
                    <div
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'
                      }}
                    >
                      {index + 1}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: getVendorColor(vendor.id) }}
                    ></div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-center mb-4">
                      <h4 className="font-bold text-lg" style={{ color: '#000000' }}>
                        {vendor.name}
                      </h4>
                    </div>
                    
                    <div>
                      <div className="text-2xl font-bold" style={{ color: '#000000' }}>
                        {vendor.realCA.toFixed(2)}€
                      </div>
                      <div className="text-sm font-semibold" style={{ color: '#000000' }}>
                        Chiffre d'affaires
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold" style={{ color: '#000000' }}>
                        {salesCount} vente{salesCount > 1 ? 's' : ''}
                      </span>
                      <span className="text-sm font-bold px-2 py-1 rounded" 
                            style={{ 
                              color: 'white',
                              backgroundColor: getVendorColor(vendor.id)
                            }}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>

                    {/* Barre de progression */}
                    <div className="w-full bg-gray-300 rounded-full h-3 border border-gray-400">
                      <div
                        className="h-3 rounded-full transition-all duration-500 shadow-inner"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: getVendorColor(vendor.id),
                          boxShadow: `inset 0 1px 3px rgba(0,0,0,0.2)`
                        }}
                      ></div>
                    </div>

                    {vendor.realCA > 0 && (
                      <div className="text-xs font-semibold" style={{ color: '#000000' }}>
                        Moyenne: {salesCount > 0 ? (vendor.realCA / salesCount).toFixed(2) : '0.00'}€ / vente
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Résumé statistique */}
        {totalCA > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold" style={{ color: '#000000' }}>
                  {vendorCAs.filter(v => v.realCA > 0).length}
                </div>
                <div className="text-sm font-semibold" style={{ color: '#000000' }}>
                  Vendeuses actives
                </div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: '#000000' }}>
                  {totalSalesCount > 0 ? (totalCA / totalSalesCount).toFixed(2) : '0.00'}€
                </div>
                <div className="text-sm font-semibold" style={{ color: '#000000' }}>
                  Panier moyen
                </div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: '#000000' }}>
                  {vendorCAs.length > 0 && totalCA > 0 ? (totalCA / vendorCAs.filter(v => v.realCA > 0).length).toFixed(2) : '0.00'}€
                </div>
                <div className="text-sm font-semibold" style={{ color: '#000000' }}>
                  CA moyen / vendeuse
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
