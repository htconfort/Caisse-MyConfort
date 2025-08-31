import React, { useMemo, useState } from 'react';
import { Download, ChevronDown, ChevronRight, ShoppingBag, Calendar, CreditCard } from 'lucide-react';
import type { Sale } from '../../types';
import type { Invoice } from '@/services/syncService';
import { convertToCSV } from '../../utils';
import { vendors } from '../../data';

interface SalesTabProps {
  sales: Sale[];
  invoices: Invoice[];
}

// Format € solide
const fmtEUR = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

// Libellé paiement enrichi pour correspondre au nouveau système de paiement
const paymentLabel = (p: Sale['paymentMethod']) => {
  const labels = {
    'card': '💳 Carte bleue',
    'cash': '💵 Espèces',
    'check': '🧾 Chèque',
    'multi': '🔄 Mixte/Autre'
  };
  return labels[p] || '❓ Non défini';
};

// Couleur pour les modes de paiement
const getPaymentColor = (method: Sale['paymentMethod']) => {
  const colors = {
    'card': { bg: '#EBF8FF', text: '#1E40AF', border: '#3B82F6' },
    'cash': { bg: '#F0FDF4', text: '#166534', border: '#10B981' },
    'check': { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
    'multi': { bg: '#F3E8FF', text: '#7C3AED', border: '#8B5CF6' }
  };
  return colors[method] || { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' };
};

export function SalesTab({ sales, invoices }: SalesTabProps) {
  // État pour gérer l'expansion des détails de vente
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());

  // Fonction pour basculer l'expansion d'une vente
  const toggleSaleExpansion = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  // Couleur vendeuse depuis ton data store
  const getVendorColor = (vendorId: string): string => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor?.color || '#6B7280';
  };

  // Convertir factures N8N -> ventes externes
  const invoicesAsSales = useMemo<Sale[]>(() => {
    return invoices.map((invoice) => ({
      id: `n8n-${invoice.id}`,
      date: invoice.createdAt,
      vendorId: invoice.vendorId || '1',
      vendorName: invoice.vendorName || 'N8N',
      items: invoice.items.map(item => ({
        id: item.id,
        name: item.productName,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        price: item.unitPrice,
        totalPrice: item.totalPrice || item.unitPrice * item.quantity,
        addedAt: invoice.createdAt
      })),
      totalAmount:
        invoice.totalTTC ||
        invoice.items.reduce((sum, it) => sum + (it.totalPrice || it.unitPrice * it.quantity), 0),
      paymentMethod: 'card',
      canceled: false,
      isExternal: true,
      clientName: invoice.clientName,
      invoiceNumber: invoice.number
    }));
  }, [invoices]);

  // Fusion & tri descendant
  const allSales = useMemo(() => {
    return [...sales, ...invoicesAsSales].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [sales, invoicesAsSales]);

  // Statistiques par mode de paiement
  const paymentStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayValidSales = sales.filter(s => 
      new Date(s.date).toDateString() === today && !s.canceled
    );
    
    const stats = {
      card: { count: 0, amount: 0, label: '💳 Carte bleue' },
      cash: { count: 0, amount: 0, label: '💵 Espèces' },
      check: { count: 0, amount: 0, label: '🧾 Chèque' },
      multi: { count: 0, amount: 0, label: '🔄 Mixte/Autre' }
    };

    todayValidSales.forEach(sale => {
      if (stats[sale.paymentMethod]) {
        stats[sale.paymentMethod].count++;
        stats[sale.paymentMethod].amount += sale.totalAmount;
      }
    });

    return stats;
  }, [sales]);

  // KPIs du jour
  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return allSales
      .filter(s => new Date(s.date).toDateString() === today && !s.canceled)
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [allSales]);

  const todaySalesCount = useMemo(() => {
    const today = new Date().toDateString();
    return allSales.filter(s => new Date(s.date).toDateString() === today && !s.canceled).length;
  }, [allSales]);

  const averageTicket = useMemo(
    () => (todaySalesCount > 0 ? todaySales / todaySalesCount : 0),
    [todaySales, todaySalesCount]
  );

  // Export CSV
  const handleExportCSV = () => {
    if (allSales.length === 0) return;
    const csvContent = convertToCSV(allSales);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventes_complete_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const lastSale = allSales[0];

  // Palette de couleurs sympathiques pour les blocs
  const colors = {
    kpis: {
      ventesJour: { bg: 'linear-gradient(135deg, #E8F5E8 0%, #F0FDF4 100%)', border: '#10B981', text: '#064E3B' },
      panierMoyen: { bg: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)', border: '#3B82F6', text: '#1E3A8A' },
      nombreVentes: { bg: 'linear-gradient(135deg, #FEF3E2 0%, #FFFBEB 100%)', border: '#F59E0B', text: '#92400E' }
    },
    derniereVente: {
      bg: 'linear-gradient(135deg, #FDF2F8 0%, #FCF2F8 100%)',
      border: '#EC4899',
      accent: '#BE185D'
    },
    caisse: {
      bg: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
      border: '#0EA5E9',
      badge: '#0284C7'
    },
    facturier: {
      bg: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
      border: '#8B5CF6',
      badge: '#7C3AED'
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* En-tête sticky + CTA */}
      <div className="section-header flex justify-between items-center">
        <h2 className="text-3xl font-bold vendor-black-text">Historique des ventes</h2>
        {allSales.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="btn-primary flex items-center gap-2 touch-feedback"
            aria-label="Exporter les ventes au format CSV"
          >
            <Download size={18} />
            Exporter CSV
          </button>
        )}
      </div>

      {/* KPIs (3 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div 
          className="card text-center"
          style={{
            background: colors.kpis.ventesJour.bg,
            borderLeft: `4px solid ${colors.kpis.ventesJour.border}`,
            borderTop: `1px solid ${colors.kpis.ventesJour.border}20`
          }}
        >
          <h3 className="text-sm font-semibold mb-2" style={{ color: colors.kpis.ventesJour.text }}>
            💰 Ventes du jour
          </h3>
          <p className="text-3xl font-bold" style={{ color: colors.kpis.ventesJour.text }}>
            {fmtEUR(todaySales)}
          </p>
        </div>
        <div 
          className="card text-center"
          style={{
            background: colors.kpis.panierMoyen.bg,
            borderLeft: `4px solid ${colors.kpis.panierMoyen.border}`,
            borderTop: `1px solid ${colors.kpis.panierMoyen.border}20`
          }}
        >
          <h3 className="text-sm font-semibold mb-2" style={{ color: colors.kpis.panierMoyen.text }}>
            🛒 Panier moyen
          </h3>
          <p className="text-3xl font-bold" style={{ color: colors.kpis.panierMoyen.text }}>
            {fmtEUR(averageTicket)}
          </p>
        </div>
        <div 
          className="card text-center"
          style={{
            background: colors.kpis.nombreVentes.bg,
            borderLeft: `4px solid ${colors.kpis.nombreVentes.border}`,
            borderTop: `1px solid ${colors.kpis.nombreVentes.border}20`
          }}
        >
          <h3 className="text-sm font-semibold mb-2" style={{ color: colors.kpis.nombreVentes.text }}>
            📊 Nombre de ventes
          </h3>
          <p className="text-3xl font-bold" style={{ color: colors.kpis.nombreVentes.text }}>
            {todaySalesCount}
          </p>
        </div>
      </div>

      {/* Statistiques des modes de paiement */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(paymentStats).map(([method, stats]) => {
          const color = getPaymentColor(method as Sale['paymentMethod']);
          return (
            <div
              key={method}
              className="card text-center transition-all duration-200 hover:scale-105 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${color.bg} 0%, ${color.bg}80 100%)`,
                borderLeft: `4px solid ${color.border}`,
                borderTop: `1px solid ${color.border}40`,
                boxShadow: `0 2px 8px ${color.border}20`
              }}
            >
              <h3 className="text-sm font-semibold mb-2" style={{ color: color.text }}>
                {stats.label}
              </h3>
              <div className="space-y-1">
                <p className="text-xl font-bold" style={{ color: color.text }}>
                  {fmtEUR(stats.amount)}
                </p>
                <p className="text-xs opacity-75" style={{ color: color.text }}>
                  {stats.count} vente{stats.count > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dernière vente */}
      {lastSale && (
        <div
          className="card mb-6"
          style={{
            background: colors.derniereVente.bg,
            borderLeft: `6px solid ${colors.derniereVente.border}`,
            borderTop: `2px solid ${colors.derniereVente.border}30`
          }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: colors.derniereVente.accent }}>
            🏆 Dernière vente enregistrée
          </h3>
          <div
            className="flex justify-between items-center p-4 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.7)', 
              border: `2px solid ${colors.derniereVente.border}`,
              boxShadow: `0 2px 8px ${colors.derniereVente.border}20`
            }}
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl" aria-hidden>
                {String(lastSale.id).startsWith('n8n-') ? '📋' : '📱'}
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: colors.derniereVente.accent }}>
                  {String(lastSale.id).startsWith('n8n-') ? 'Vente Facturier' : 'Vente Caisse'}
                </p>
                <p className="text-sm" style={{ color: '#666' }}>
                  {lastSale.vendorName} • {new Date(lastSale.date).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold" style={{ color: colors.derniereVente.accent }}>
                {fmtEUR(lastSale.totalAmount)}
              </p>
              <p className="text-sm" style={{ color: '#666' }}>
                {lastSale.items.reduce((s, it) => s + it.quantity, 0)} article(s)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ventes Caisse */}
      <div 
        className="card mb-6"
        style={{
          background: colors.caisse.bg,
          borderLeft: `6px solid ${colors.caisse.border}`,
          borderTop: `2px solid ${colors.caisse.border}30`
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-bold" style={{ color: colors.caisse.badge }}>
            📱 Ventes Caisse (iPad)
          </h3>
          <span 
            className="rounded-full text-xs font-semibold px-3 py-1"
            style={{ 
              background: `${colors.caisse.badge}20`, 
              color: colors.caisse.badge,
              border: `1px solid ${colors.caisse.badge}40`
            }}
          >
            {sales.filter(s => !s.canceled).length} vente{sales.filter(s => !s.canceled).length > 1 ? 's' : ''}
          </span>
        </div>

        {sales.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: '#666' }}>Aucune vente caisse enregistrée</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
            <div className="table-scroll table-sticky">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                    <th className="text-left py-3 px-4 font-semibold vendor-black-text">Date/Heure</th>
                    <th className="text-left py-3 px-4 font-semibold vendor-black-text">Vendeuse</th>
                    <th className="text-left py-3 px-4 font-semibold vendor-black-text">Articles</th>
                    <th className="text-left py-3 px-4 font-semibold vendor-black-text">Paiement</th>
                    <th className="text-right py-3 px-4 font-semibold vendor-black-text">Montant</th>
                    <th className="text-center py-3 px-4 font-semibold vendor-black-text">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {sales
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((sale, idx) => {
                      const saleKey = (sale.id ? String(sale.id) : '') + '|' + new Date(sale.date).getTime() + '|' + idx;
                      const isExpanded = expandedSales.has(saleKey);
                      
                      return (
                        <React.Fragment key={saleKey}>
                          <tr
                            className="border-b cursor-pointer transition-all duration-200 hover:bg-gray-50"
                            style={{
                              borderColor: '#F3F4F6',
                              borderLeft: `6px solid ${getVendorColor(sale.vendorId)}`,
                              background: `${getVendorColor(sale.vendorId)}15`
                            }}
                            onClick={() => toggleSaleExpansion(saleKey)}
                            title="Cliquer pour voir les détails"
                          >
                            <td className="py-3 px-4 vendor-black-text">
                              <div className="flex items-center gap-2">
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <div>
                                  <div>{new Date(sale.date).toLocaleDateString('fr-FR')}</div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ background: getVendorColor(sale.vendorId) }} />
                                <span className="font-semibold vendor-black-text">{sale.vendorName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 vendor-black-text">
                              <div className="flex items-center gap-1">
                                <ShoppingBag size={14} />
                                {sale.items.reduce((sum, it) => sum + it.quantity, 0)} article(s)
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span 
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all duration-200 hover:scale-105 shadow-sm"
                                style={{ 
                                  background: getPaymentColor(sale.paymentMethod).bg,
                                  color: getPaymentColor(sale.paymentMethod).text,
                                  border: `1px solid ${getPaymentColor(sale.paymentMethod).border}40`,
                                  boxShadow: `0 1px 3px ${getPaymentColor(sale.paymentMethod).border}20`
                                }}
                                title={`Mode de paiement: ${paymentLabel(sale.paymentMethod)}`}
                              >
                                {paymentLabel(sale.paymentMethod)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold vendor-black-text">
                              {fmtEUR(sale.totalAmount)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {sale.canceled ? (
                                <span className="px-2 py-1 rounded text-xs" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                                  Annulée
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded text-xs" style={{ background: '#D1FAE5', color: '#059669' }}>
                                  Validée
                                </span>
                              )}
                            </td>
                          </tr>
                          
                          {/* Ligne de détails expansible */}
                          {isExpanded && (
                            <tr style={{ background: '#F8F9FA' }}>
                              <td colSpan={6} className="px-4 py-4">
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <ShoppingBag size={16} />
                                    Détail des articles
                                  </h4>
                                  <div className="grid gap-2">
                                    {sale.items.map((item, itemIdx) => (
                                      <div 
                                        key={itemIdx}
                                        className="flex justify-between items-center p-2 bg-white rounded border border-gray-200"
                                      >
                                        <div>
                                          <span className="font-medium">{item.name}</span>
                                          <span className="text-sm text-gray-500 ml-2">
                                            (x{item.quantity})
                                          </span>
                                        </div>
                                        <span className="font-semibold">
                                          {fmtEUR(item.price * item.quantity)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t">
                                    <div className="flex items-center gap-1">
                                      <Calendar size={14} />
                                      {new Date(sale.date).toLocaleString('fr-FR')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <CreditCard size={14} />
                                      {paymentLabel(sale.paymentMethod)}
                                    </div>
                                  </div>
                                  
                                  {/* Détails des chèques à venir si applicable */}
                                  {sale.checkDetails && (
                                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                      <h5 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                                        📄 Détails des chèques à venir
                                      </h5>
                                      <div className="space-y-1 text-sm text-amber-700">
                                        <div className="flex justify-between">
                                          <span>Nombre de chèques :</span>
                                          <span className="font-semibold">{sale.checkDetails.count}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Montant par chèque :</span>
                                          <span className="font-semibold">{fmtEUR(sale.checkDetails.amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Montant total :</span>
                                          <span className="font-semibold">{fmtEUR(sale.checkDetails.totalAmount)}</span>
                                        </div>
                                        {sale.checkDetails.notes && (
                                          <div className="pt-2 border-t border-amber-300">
                                            <div className="text-xs text-amber-600">
                                              <strong>Notes :</strong> {sale.checkDetails.notes}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Ventes Facturier (N8N) */}
      <div 
        className="card"
        style={{
          background: colors.facturier.bg,
          borderLeft: `6px solid ${colors.facturier.border}`,
          borderTop: `2px solid ${colors.facturier.border}30`
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-bold" style={{ color: colors.facturier.badge }}>
            📋 Ventes Facturier (N8N)
          </h3>
          <span 
            className="rounded-full text-xs font-semibold px-3 py-1"
            style={{ 
              background: `${colors.facturier.badge}20`, 
              color: colors.facturier.badge,
              border: `1px solid ${colors.facturier.badge}40`
            }}
          >
            {invoicesAsSales.length} facture{invoicesAsSales.length > 1 ? 's' : ''}
          </span>
        </div>

        {invoicesAsSales.length === 0 ? (
          <div className="text-center py-8">
            <p style={{ color: '#666' }}>Aucune facture N8N synchronisée</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
            <div className="table-scroll table-sticky">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                    <th className="text-left py-3 px-4 font-semibold vendor-black-text">Date/Heure</th>
                    <th className="text-left py-3 px-4 font-semibold vendor-black-text">Conseillère</th>
                    <th className="text-left py-3 px-4 font-semibold vendor-black-text">Client</th>
                    <th className="text-left py-3 px-4 font-semibold vendor-black-text">Facture N°</th>
                    <th className="text-right py-3 px-4 font-semibold vendor-black-text">Montant</th>
                    <th className="text-center py-3 px-4 font-semibold vendor-black-text">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesAsSales
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((invoice, idx) => (
                      <tr
                        key={String(invoice.id) + '|' + new Date(invoice.date).getTime() + '|' + idx}
                        className="border-b"
                        style={{
                          borderColor: '#F3F4F6',
                          borderLeft: `6px solid ${getVendorColor(invoice.vendorId)}`,
                          background: `${getVendorColor(invoice.vendorId)}10`
                        }}
                      >
                        <td className="py-3 px-4 vendor-black-text">
                          {new Date(invoice.date).toLocaleDateString('fr-FR')}{' '}
                          {new Date(invoice.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: getVendorColor(invoice.vendorId) }} />
                            <span className="font-semibold vendor-black-text">{invoice.vendorName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 vendor-black-text">
                          {invoice.items[0]?.name || 'Client N8N'}
                        </td>
                        <td className="py-3 px-4 font-mono" style={{ color: 'var(--secondary-blue)' }}>
                          #{String(invoice.id).replace('n8n-', '')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold vendor-black-text">
                          {fmtEUR(invoice.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-1 rounded text-xs" style={{ background: '#E3F2FD', color: '#1976D2' }}>
                            Facturier
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}