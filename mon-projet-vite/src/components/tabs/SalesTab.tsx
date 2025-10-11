import React, { useMemo, useState } from 'react';
import { Download, ChevronDown, ChevronRight, ShoppingBag, Calendar, CreditCard, TrendingUp, Euro, FileText, Store } from 'lucide-react';
import type { Sale } from '../../types';
import type { Invoice } from '@/services/syncService';
import { convertToCSV } from '../../utils';
import { vendors } from '../../data';
import '../../styles/sales-tab.css';

interface SalesTabProps {
  sales: Sale[];
  invoices: Invoice[];
}

type SalesSubTab = 'all' | 'caisse' | 'facturier';

// Format € solide
const fmtEUR = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

// Libellé paiement enrichi
const getPaymentBadge = (paymentMethod: Sale['paymentMethod']) => {
  const badges = {
    'card': { label: 'Carte', class: 'payment-badge-card', icon: '💳' },
    'cash': { label: 'Espèces', class: 'payment-badge-cash', icon: '💰' },
    'check': { label: 'Chèque', class: 'payment-badge-check', icon: '📝' },
    'mixed': { label: 'Mixte', class: 'payment-badge-mixed', icon: '🔄' }
  };
  return badges[paymentMethod] || badges['card'];
};

// Couleur vendeuse
const getVendorColor = (vendorId: string): string => {
  const vendor = vendors.find(v => v.id === vendorId);
  return vendor?.color || '#6B7280';
};

export function SalesTab({ sales, invoices }: SalesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SalesSubTab>('all');
  const [expandedSales, setExpandedSales] = useState<Set<string>>(new Set());

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
      paymentMethod: 'card' as const,
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

  // Filtrer selon l'onglet actif
  const filteredSales = useMemo(() => {
    switch (activeSubTab) {
      case 'caisse':
        return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'facturier':
        return invoicesAsSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      default:
        return allSales;
    }
  }, [allSales, sales, invoicesAsSales, activeSubTab]);

  // Statistiques
  const stats = useMemo(() => {
    const caisseSales = sales.filter(s => !s.canceled);
    const facturierSales = invoicesAsSales.filter(s => !s.canceled);
    
    return {
      totalSales: caisseSales.length + facturierSales.length,
      totalAmount: caisseSales.reduce((sum, s) => sum + s.totalAmount, 0) + 
                   facturierSales.reduce((sum, s) => sum + s.totalAmount, 0),
      caisseCount: caisseSales.length,
      caisseAmount: caisseSales.reduce((sum, s) => sum + s.totalAmount, 0),
      facturierCount: facturierSales.length,
      facturierAmount: facturierSales.reduce((sum, s) => sum + s.totalAmount, 0)
    };
  }, [sales, invoicesAsSales]);

  // Toggle expansion d'une vente
  const toggleSaleExpansion = (saleId: string) => {
    const newExpanded = new Set(expandedSales);
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId);
    } else {
      newExpanded.add(saleId);
    }
    setExpandedSales(newExpanded);
  };

  // Export CSV
  const exportToCSV = () => {
    const csvData = filteredSales.map(sale => ({
      'ID': sale.id,
      'Date': new Date(sale.date).toLocaleDateString('fr-FR'),
      'Heure': new Date(sale.date).toLocaleTimeString('fr-FR'),
      'Vendeuse': sale.vendorName,
      'Client': sale.clientName || sale.manualInvoiceData?.clientName || '-',
      'Numéro Facture': sale.manualInvoiceData?.invoiceNumber || (sale.isExternal ? `N8N-${sale.invoiceNumber}` : '-'),
      'Source': sale.isExternal ? 'Facturier N8N' : 'Caisse/iPad',
      'Articles': sale.items.length,
      'Moyen de paiement': getPaymentBadge(sale.paymentMethod).label,
      'Montant total': sale.totalAmount.toFixed(2),
      'Statut': sale.canceled ? 'Annulée' : 'Validée'
    }));

    const csv = convertToCSV(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
    <div className="sales-container">
      {/* En-tête principal */}
      <div className="sales-header">
        <h1>
          <ShoppingBag className="icon" />
          Historique des Ventes
        </h1>
        <button
          onClick={exportToCSV}
          className="export-button"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          <Download size={16} />
          Exporter CSV
        </button>
      </div>

      {/* Sous-onglets */}
      <div className="sales-subtabs">
        <button
          className={`sales-subtab ${activeSubTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('all')}
        >
          <TrendingUp size={16} />
          Toutes les ventes
        </button>
        <button
          className={`sales-subtab ${activeSubTab === 'caisse' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('caisse')}
        >
          <Store size={16} />
          Ventes Caisse/iPad
        </button>
        <button
          className={`sales-subtab ${activeSubTab === 'facturier' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('facturier')}
        >
          <FileText size={16} />
          Ventes Facturier N8N
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="sales-stats">
        <div className="stat-card">
          <div className="stat-card-header">
            <TrendingUp size={16} style={{ color: '#667eea' }} />
            <span className="stat-card-title">Total Ventes</span>
          </div>
          <p className="stat-card-value">{stats.totalSales}</p>
          <p className="stat-card-subtitle">Ventes validées</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <Euro size={16} style={{ color: '#059669' }} />
            <span className="stat-card-title">Chiffre d'Affaires</span>
          </div>
          <p className="stat-card-value">{fmtEUR(stats.totalAmount)}</p>
          <p className="stat-card-subtitle">Montant total</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <Store size={16} style={{ color: '#3b82f6' }} />
            <span className="stat-card-title">Caisse/iPad</span>
          </div>
          <p className="stat-card-value">{stats.caisseCount}</p>
          <p className="stat-card-subtitle">{fmtEUR(stats.caisseAmount)}</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <FileText size={16} style={{ color: '#f59e0b' }} />
            <span className="stat-card-title">Facturier N8N</span>
          </div>
          <p className="stat-card-value">{stats.facturierCount}</p>
          <p className="stat-card-subtitle">{fmtEUR(stats.facturierAmount)}</p>
        </div>
      </div>

      {/* Tableau des ventes */}
      <div className="sales-table-container">
        <div className="sales-table-header">
          <h2 className="sales-table-title">
            <ShoppingBag size={20} />
            {activeSubTab === 'all' ? 'Toutes les ventes' : 
             activeSubTab === 'caisse' ? 'Ventes Caisse/iPad' : 'Ventes Facturier N8N'}
          </h2>
          <span className="sales-table-count">
            {filteredSales.length} vente{filteredSales.length > 1 ? 's' : ''}
          </span>
        </div>

        {filteredSales.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3 className="empty-state-title">Aucune vente trouvée</h3>
            <p className="empty-state-description">
              {activeSubTab === 'all' ? 'Aucune vente n\'a encore été enregistrée.' :
               activeSubTab === 'caisse' ? 'Aucune vente depuis la caisse/iPad.' :
               'Aucune facture N8N synchronisée.'}
            </p>
          </div>
        ) : (
          <div className="sales-table-scroll">
            <table className="sales-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th className="col-date">Date/Heure</th>
                  <th className="col-vendor">Vendeuse</th>
                  <th className="col-client">Client</th>
                  <th className="col-facture">Facture</th>
                  <th className="col-items">Articles</th>
                  <th className="col-payment">Paiement</th>
                  <th className="col-amount">Montant</th>
                  <th className="col-status">Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => {
                  const isExpanded = expandedSales.has(sale.id);
                  const paymentBadge = getPaymentBadge(sale.paymentMethod);
                  const vendorColor = getVendorColor(sale.vendorId);
                  
                  return (
                    <React.Fragment key={sale.id}>
                      <tr>
                        <td className="col-id">
                          {sale.id.slice(-8)}
                        </td>
                        <td className="col-date">
                          <div>
                            <div>{new Date(sale.date).toLocaleDateString('fr-FR')}</div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                              {new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </td>
                        <td className="col-vendor">
                          <div className="vendor-badge vendor-badge-caisse">
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: vendorColor
                              }}
                            />
                            {sale.vendorName}
                          </div>
                        </td>
                        <td className="col-client">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {sale.clientName && (
                              <div style={{ fontWeight: '600', color: '#374151' }}>
                                {sale.clientName}
                              </div>
                            )}
                            {sale.manualInvoiceData?.clientName && sale.manualInvoiceData.clientName !== sale.clientName && (
                              <div style={{ fontWeight: '600', color: '#374151' }}>
                                {sale.manualInvoiceData.clientName}
                              </div>
                            )}
                            {!sale.clientName && !sale.manualInvoiceData?.clientName && (
                              <span style={{ color: '#6b7280', fontStyle: 'italic' }}>-</span>
                            )}
                          </div>
                        </td>
                        <td className="col-facture">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {sale.manualInvoiceData?.invoiceNumber && (
                              <div style={{ 
                                fontWeight: '700', 
                                color: '#059669',
                                background: '#dcfce7',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                textAlign: 'center'
                              }}>
                                {sale.manualInvoiceData.invoiceNumber}
                              </div>
                            )}
                            {sale.isExternal && sale.invoiceNumber && (
                              <div style={{ 
                                fontWeight: '600', 
                                color: '#f59e0b',
                                background: '#fef3c7',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                textAlign: 'center'
                              }}>
                                N8N-{sale.invoiceNumber}
                              </div>
                            )}
                            {!sale.manualInvoiceData?.invoiceNumber && !sale.invoiceNumber && (
                              <span style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '12px' }}>-</span>
                            )}
                          </div>
                        </td>
                        <td className="col-items">
                          <div className="items-preview">
                            {sale.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="item-preview">
                                <span className="quantity">{item.quantity}</span>
                                <span className="name">{item.name}</span>
                                <span className="price">{fmtEUR(item.totalPrice)}</span>
                              </div>
                            ))}
                            {sale.items.length > 2 && (
                              <div className="item-preview">
                                <span style={{ fontSize: '10px', color: '#6b7280' }}>
                                  +{sale.items.length - 2} autre{sale.items.length - 2 > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="col-payment">
                          <span className={`payment-badge ${paymentBadge.class}`}>
                            {paymentBadge.icon} {paymentBadge.label}
                          </span>
                        </td>
                        <td className="col-amount">
                          {fmtEUR(sale.totalAmount)}
                        </td>
                        <td className="col-status">
                          <span className={`status-badge ${sale.canceled ? 'status-badge-canceled' : 'status-badge-active'}`}>
                            {sale.canceled ? '❌ Annulée' : '✅ Validée'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="expand-button"
                            onClick={() => toggleSaleExpansion(sale.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronDown size={14} />
                                Réduire
                              </>
                            ) : (
                              <>
                                <ChevronRight size={14} />
                                Détails
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      
                      {isExpanded && (
                        <tr>
                          <td colSpan={10}>
                            <div className="sale-details">
                              <div className="sale-details-header">
                                <h3 className="sale-details-title">
                                  Détails de la vente {sale.id.slice(-8)}
                                </h3>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '12px', color: '#6b7280' }}>
                                  {sale.manualInvoiceData?.invoiceNumber && (
                                    <span style={{ 
                                      background: '#dcfce7', 
                                      color: '#059669', 
                                      padding: '2px 8px', 
                                      borderRadius: '4px',
                                      fontWeight: '600'
                                    }}>
                                      📄 Facture: {sale.manualInvoiceData.invoiceNumber}
                                    </span>
                                  )}
                                  {sale.manualInvoiceData?.clientName && (
                                    <span style={{ fontWeight: '500' }}>
                                      👤 Client: {sale.manualInvoiceData.clientName}
                                    </span>
                                  )}
                                  <span>
                                    🏪 Vendeuse: {sale.vendorName}
                                  </span>
                                  <span>
                                    💳 Paiement: {getPaymentBadge(sale.paymentMethod).label}
                                  </span>
                                </div>
                              </div>
                              <div className="sale-details-items">
                                {sale.items.map((item, idx) => (
                                  <div key={idx} className="sale-detail-item">
                                    <div className="sale-detail-item-info">
                                      <span className="sale-detail-item-quantity">
                                        {item.quantity}
                                      </span>
                                      <span className="sale-detail-item-name">
                                        {item.name}
                                      </span>
                                      {item.category && (
                                        <span className="sale-detail-item-category">
                                          {item.category}
                                        </span>
                                      )}
                                    </div>
                                    <span className="sale-detail-item-price">
                                      {fmtEUR(item.totalPrice)}
                                    </span>
                                  </div>
                                ))}
                              </div>
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
        )}
      </div>
    </div>
  );
}