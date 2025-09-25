import type { Invoice } from '@/services/syncService';
import { DollarSign, TrendingUp } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import type { Sale, Vendor } from '../../types';

interface CATabProps {
  sales: Sale[];
  vendorStats: Vendor[];
  invoices: Invoice[];
}

export const CATab: React.FC<CATabProps> = ({ sales, vendorStats, invoices }) => {
  console.log('🔄 CATab RENDER - Inputs:', {
    salesCount: sales.length,
    vendorStatsCount: vendorStats.length,
    invoicesCount: invoices.length,
    currentTime: new Date().toLocaleTimeString()
  });

  // Debug simple - doit apparaître dans la console
  console.log('🟢 CATab: Composant rendu avec succès');

  // État local pour les factures externes (se met à jour via événements)
  const [externalInvoices, setExternalInvoices] = useState<Invoice[]>(invoices);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Écouter les événements de mise à jour des factures externes
  useEffect(() => {
    console.log('🔄 CA Instant: initialisation des écouteurs d événements');

    const handleExternalInvoicesUpdate = () => {
      console.log('🔄 CA Instant: événement external-invoices-updated reçu');
      setLastUpdate(Date.now()); // Force re-render
    };

    const handleExternalInvoiceReceived = (event: CustomEvent) => {
      console.log('🔄 CA Instant: événement external-invoice-received reçu', event.detail);
      setLastUpdate(Date.now()); // Force re-render
    };

    const handleVendorStatsUpdated = () => {
      console.log('🔄 CA Instant: événement vendor-stats-updated reçu');
      setLastUpdate(Date.now()); // Force re-render
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('external-invoices-updated', handleExternalInvoicesUpdate as EventListener);
      window.addEventListener('external-invoice-received', handleExternalInvoiceReceived as EventListener);
      window.addEventListener('vendor-stats-updated', handleVendorStatsUpdated as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('external-invoices-updated', handleExternalInvoicesUpdate as EventListener);
        window.removeEventListener('external-invoice-received', handleExternalInvoiceReceived as EventListener);
        window.removeEventListener('vendor-stats-updated', handleVendorStatsUpdated as EventListener);
      }
    };
  }, []);

  // Utiliser les factures externes mises à jour
  const currentInvoices = useMemo(() => {
    // Recharger depuis externalInvoiceService si nécessaire
    if (typeof window !== 'undefined' && (window as any).externalInvoiceService) {
      try {
        const freshInvoices = (window as any).externalInvoiceService.getAllInvoices();
        if (freshInvoices.length !== externalInvoices.length) {
          console.log(`🔄 CA Instant: rechargement ${freshInvoices.length} factures externes`);
          setExternalInvoices(freshInvoices);
          return freshInvoices;
        }
      } catch (e) {
        console.warn('⚠️ Impossible de recharger les factures externes:', e);
      }
    }
    return externalInvoices;
  }, [externalInvoices, lastUpdate]);
  // Fonction pour récupérer la couleur d'une vendeuse
  const getVendorColor = (vendorId: string): string => {
    const vendor = vendorStats.find(v => v.id === vendorId);
    return vendor?.color || '#6B7280';
  };

  // 🎯 FONCTION UTILITAIRE : Vérifier si une date est aujourd'hui
  const isToday = (date: Date | string): boolean => {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.toDateString() === today.toDateString();
  };

  // 🔧 CALCUL CA INSTANT : Ventes caisse + Factures externes
  const totalCA = useMemo(() => {
    console.log(`📅 FILTRAGE CA INSTANT - Date d'aujourd'hui: ${new Date().toLocaleDateString('fr-FR')}`);

    // 🎯 CA des ventes caisse du jour
    const salesCA = sales
      .filter(sale => !sale.canceled && isToday(sale.date))
      .reduce((sum, sale) => {
        console.log(`    → Vente ${sale.id} du ${sale.date.toLocaleDateString('fr-FR')} (${sale.vendorName}): ${sale.totalAmount}€`);
        return sum + sale.totalAmount;
      }, 0);

    // 🎯 CA des factures N8N du jour
    const invoicesCA = currentInvoices
      .filter(invoice => isToday(invoice.createdAt))
      .reduce((sum, invoice) => {
        // Utiliser le total TTC ou calculer depuis les items
        const invoiceTotal = invoice.totalTTC ||
          invoice.items.reduce((itemSum, item) => itemSum + (item.totalPrice || item.unitPrice * item.quantity), 0);

        console.log(`    → Facture ${invoice.number} du ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')} (${invoice.clientName}): ${invoiceTotal}€`);
        return sum + invoiceTotal;
      }, 0);

    console.log(`📄 VENTES CAISSE DU JOUR:
    - Total ventes caisse: ${sales.length}
    - Ventes caisse d'aujourd'hui: ${sales.filter(s => !s.canceled && isToday(s.date)).length}
    - CA ventes caisse du jour: ${salesCA.toFixed(2)}€`);

    console.log(`📄 FACTURES EXTERNES DU JOUR:
    - Total factures externes: ${currentInvoices.length}
    - Factures externes d'aujourd'hui: ${currentInvoices.filter(i => isToday(i.createdAt)).length}
    - CA factures externes du jour: ${invoicesCA.toFixed(2)}€`);

    const totalCA = salesCA + invoicesCA;

    console.log(`💰 CA INSTANTANÉ COMPLET:
    - Ventes caisse: ${salesCA.toFixed(2)}€ (${sales.filter(s => !s.canceled && isToday(s.date)).length} ventes du jour)
    - Factures externes: ${invoicesCA.toFixed(2)}€ (${currentInvoices.filter(i => isToday(i.createdAt)).length} factures du jour)
    - TOTAL: ${totalCA.toFixed(2)}€`);

    return totalCA;
  }, [sales, currentInvoices]);

  // 🔧 CA par vendeuse : Ventes caisse + Factures externes
  const vendorCAs = useMemo(() => {
    const caByVendor: Record<string, number> = {};

    console.log(`👥 CALCUL CA PAR VENDEUSE - Filtrage par date du jour`);

    // 🎯 Calculer le CA des ventes caisse du jour pour chaque vendeuse
    console.log(`🛒 TRAITEMENT VENTES CAISSE (${sales.length} ventes)`);
    sales
      .filter(sale => !sale.canceled && isToday(sale.date))
      .forEach(sale => {
        console.log(`    🛒 Vente ${sale.id} - Date: ${sale.date.toLocaleDateString('fr-FR')} - VendorID: "${sale.vendorId}" - VendorName: "${sale.vendorName}" - Montant: ${sale.totalAmount}€`);

        if (sale.vendorId) {
          console.log(`    ✅ Vente VALIDÉE pour vendeuse: ${sale.vendorId}`);
          if (!caByVendor[sale.vendorId]) {
            caByVendor[sale.vendorId] = 0;
          }
          caByVendor[sale.vendorId] += sale.totalAmount;
          console.log(`    ✅ CA ajouté à ${sale.vendorId}: +${sale.totalAmount}€ (total: ${caByVendor[sale.vendorId]}€)`);
        } else {
          console.log(`    ❌ Vente IGNORÉE - vendorId invalide: "${sale.vendorId}"`);
        }
      });

    // 🎯 Calculer le CA des factures N8N du jour pour chaque vendeuse
    console.log(`📄 TRAITEMENT FACTURES EXTERNES (${currentInvoices.length} factures)`);
    currentInvoices
      .filter(invoice => isToday(invoice.createdAt))
      .forEach(invoice => {
        console.log(`    📄 Facture ${invoice.number} - Date: ${invoice.createdAt} - VendorID: "${invoice.vendorId}" - VendorName: "${invoice.vendorName}"`);

        const invoiceTotal = invoice.totalTTC ||
          invoice.items.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity), 0);

        console.log(`    📄 Montant calculé: ${invoiceTotal}€ (TTC: ${invoice.totalTTC}, items: ${invoice.items.length})`);

        if (invoice.vendorId && invoice.vendorId !== 'external') {
          console.log(`    ✅ Facture VALIDÉE pour vendeuse: ${invoice.vendorId}`);
          if (!caByVendor[invoice.vendorId]) {
            caByVendor[invoice.vendorId] = 0;
          }
          caByVendor[invoice.vendorId] += invoiceTotal;
          console.log(`    ✅ CA ajouté à ${invoice.vendorId}: +${invoiceTotal}€ (total: ${caByVendor[invoice.vendorId]}€)`);
        } else {
          console.log(`    ❌ Facture IGNORÉE - vendorId invalide: "${invoice.vendorId}"`);
          console.log(`    📋 Détails facture:`, {
            number: invoice.number,
            createdAt: invoice.createdAt,
            vendorId: invoice.vendorId,
            vendorName: invoice.vendorName,
            totalTTC: invoice.totalTTC,
            items: invoice.items
          });
        }
      });

    // 3. Mapper avec les données des vendeuses
    console.log(`👥 MAPPING CA PAR VENDEUSE:`);
    console.log(`   - caByVendor:`, caByVendor);
    console.log(`   - vendorStats disponibles:`, vendorStats.map(v => `${v.id}: ${v.name}`));

    const result = vendorStats.map(vendor => {
      const ca = caByVendor[vendor.id] || 0;
      console.log(`   📊 ${vendor.name} (${vendor.id}): ${ca}€`);
      return {
        ...vendor,
        realCA: ca
      };
    }).sort((a, b) => b.realCA - a.realCA); // Trier par CA décroissant

    console.log(`👥 CA PAR VENDEUSE:`, result.filter(v => v.realCA > 0));

    return result;
  }, [sales, currentInvoices, vendorStats]);

  // Calcul du nombre total de ventes du jour (ventes caisse + factures externes)
  const totalSalesCount = useMemo(() => {
    const salesCount = sales.filter(sale => !sale.canceled && isToday(sale.date)).length;
    const invoicesCount = currentInvoices.filter(invoice => isToday(invoice.createdAt)).length;
    const totalCount = salesCount + invoicesCount;

    console.log(`📊 TRANSACTIONS DU JOUR:
    - Ventes caisse d'aujourd'hui: ${salesCount}
    - Factures externes d'aujourd'hui: ${invoicesCount}
    - TOTAL: ${totalCount} transactions`);

    return totalCount;
  }, [sales, currentInvoices]);

  console.log('🟡 CATab: Rendu du JSX commencé');

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
                sale.vendorId === vendor.id && !sale.canceled && isToday(sale.date)
              ).length;
              const invoicesCount = currentInvoices.filter(invoice => 
                invoice.vendorId === vendor.id && isToday(invoice.createdAt)
              ).length;
              const totalVendorSales = salesCount + invoicesCount;

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
                        {totalVendorSales} vente{totalVendorSales > 1 ? 's' : ''}
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
                        Moyenne: {totalVendorSales > 0 ? (vendor.realCA / totalVendorSales).toFixed(2) : '0.00'}€ / vente
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
