import React, { useState } from 'react';
import { useSyncInvoices } from '../hooks/useSyncInvoices';
import { useNotifications } from '../hooks/useNotifications';
import { SyncStatus } from './SyncStatus';
import { NotificationCenter } from './NotificationCenter';
import type { Invoice } from '../services/syncService';
import { getVendorColorInfo } from '../utils/vendorColors';
import { generateTestInvoices } from '../utils/testInvoices';
import '../styles/invoices-elegant.css';

export const InvoicesTabElegant: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | 'all'>('all');
  const [testInvoices, setTestInvoices] = useState<Invoice[]>([]);
  
  const {
    invoices,
    stats,
    loading,
    error,
    syncInvoices
  } = useSyncInvoices();

  const {
    notifications,
    removeNotification
  } = useNotifications();

  // Fonction pour créer des factures de test
  const createTestInvoices = () => {
    const testData = generateTestInvoices();
    setTestInvoices(testData);
  };

  // Filtrage des factures (inclut les factures de test)
  const getFilteredInvoices = () => {
    let filtered = [...invoices, ...testInvoices];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.clientName.toLowerCase().includes(query) ||
        invoice.number.toLowerCase().includes(query) ||
        (invoice.vendorName && invoice.vendorName.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  const filteredInvoices = getFilteredInvoices();

  // Fonction pour obtenir le badge de statut
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
      <span className={`px-4 py-2 rounded-full text-lg font-bold text-white ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number | null | undefined) => {
    const validPrice = price && !isNaN(price) ? price : 0;
    return `${validPrice.toFixed(2)}€`;
  };

  // Fonction pour traduire les statuts des items en français
  const translateItemStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      'pending': '⏳ En attente',
      'available': '✅ Disponible', 
      'delivered': '🚚 Livré',
      'cancelled': '❌ Annulé'
    };
    
    return translations[status] || status;
  };

  // Fonction pour traduire les modes de paiement en français
  const translatePaymentMethod = (method: string) => {
    const translations: { [key: string]: string } = {
      'cash': '💵 Espèces',
      'card': '💳 Carte bancaire',
      'check': '📄 Chèque',
      'transfer': '🏦 Virement',
      'multi': '🔄 Paiement multiple',
      'installments': '📅 Échelonné'
    };
    
    return translations[method] || method;
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="invoices-tab-elegant">
        <div className="loading-state-elegant">
          <div className="loading-spinner-elegant"></div>
          <p className="loading-text-elegant">
            Chargement des factures...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="invoices-tab-elegant">
      <NotificationCenter 
        notifications={notifications}
        onRemove={removeNotification}
      />        {/* Header avec statistiques */}
        <div className="header-section-elegant">
          <div className="header-top-elegant">
            <h2 className="elegant-title">
              📄 Factures
            </h2>
            <SyncStatus 
              stats={stats}
              onSync={syncInvoices}
              loading={loading}
            />
          </div>

          {/* Statistiques rapides */}
          <div className="stats-grid-elegant">
            <div className="stat-card-elegant pending">
              <div className="stat-value-elegant">{stats.pendingInvoices}</div>
              <div className="stat-label-elegant">En cours</div>
            </div>
            <div className="stat-card-elegant partial">
              <div className="stat-value-elegant">{stats.partialInvoices}</div>
              <div className="stat-label-elegant">Partielles</div>
            </div>
            <div className="stat-card-elegant paid">
              <div className="stat-value-elegant">{stats.totalInvoices - stats.pendingInvoices - stats.partialInvoices}</div>
              <div className="stat-label-elegant">Terminées</div>
            </div>
          </div>
        </div>

        {/* Section des factures */}
        <div className="invoices-section-elegant">
          {/* Filtres et recherche */}
          <div className="invoices-filters-elegant">
            <div className="filter-group-elegant">
              <label className="filter-label-elegant">Recherche</label>
              <input
                type="text"
                placeholder="Rechercher par client, numéro ou produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input-elegant"
              />
            </div>
            <div className="filter-group-elegant">
              <label className="filter-label-elegant">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Invoice['status'] | 'all')}
                className="filter-select-elegant"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyée</option>
                <option value="partial">Partielle</option>
                <option value="paid">Payée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
            
            {/* Bouton pour créer des factures de test */}
            <div className="filter-group-elegant">
              <button
                onClick={createTestInvoices}
                className="btn-test-elegant"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                🧪 Créer factures test
              </button>
            </div>
          </div>

          {/* Liste des factures */}
          {error && (
            <div className="error-card-elegant">
              <p className="error-message-elegant">
                ⚠️ Erreur: {error}
              </p>
              <button
                onClick={syncInvoices}
                className="btn-link-elegant"
              >
                Réessayer
              </button>
            </div>
          )}

          {filteredInvoices.length === 0 ? (
            <div className="empty-state-elegant">
              <p className="empty-message-elegant">
                {invoices.length === 0 ? 'Aucune facture trouvée' : 'Aucune facture ne correspond aux filtres'}
              </p>
              {invoices.length === 0 && (
                <button
                  onClick={syncInvoices}
                  className="btn-primary-elegant"
                  disabled={loading}
                >
                  🔄 Synchroniser
                </button>
              )}
            </div>
          ) : (
            <div className="invoices-list-elegant">
              {filteredInvoices.map((invoice) => {
                // Récupérer les couleurs de la vendeuse
                const vendorColors = getVendorColorInfo(invoice.vendorName);
                
                return (
                  <div key={invoice.id} className="invoice-card-elegant">
                    {/* Header coloré PLEIN avec la couleur de la vendeuse */}
                    {invoice.vendorName && (
                      <div 
                        className="vendor-header-elegant"
                        style={{
                          backgroundColor: vendorColors.backgroundColor,
                          color: vendorColors.textColor,
                          border: 'none'
                        }}
                      >
                        <div className="vendor-info-elegant">
                          <span className="vendor-icon-elegant">👤</span>
                          <span className="vendor-name-elegant">{invoice.vendorName}</span>
                        </div>
                        <span className="invoice-number-elegant">
                          {invoice.number}
                        </span>
                      </div>
                    )}

                    <div className="invoice-content-elegant">
                      {/* Informations client */}
                      <div className="client-info-elegant">
                        <div className="client-details-elegant">
                          <h3 className="client-name-elegant">
                            {invoice.clientName}
                          </h3>
                          {invoice.clientEmail && (
                            <p className="client-contact-elegant">
                              📧 {invoice.clientEmail}
                            </p>
                          )}
                          {invoice.clientPhone && (
                            <p className="client-contact-elegant">
                              📞 {invoice.clientPhone}
                            </p>
                          )}
                        </div>
                        <div className="invoice-summary-elegant">
                          {getStatusBadge(invoice.status)}
                          <p className="invoice-date-elegant">
                            Créée le {formatDate(invoice.createdAt)}
                          </p>
                          <p className="invoice-total-elegant">
                            {formatPrice(invoice.totalTTC)}
                          </p>
                        </div>
                      </div>

                      {/* Tableau des produits */}
                      <div className="products-section-elegant">
                        <h4 className="products-title-elegant">
                          📦 Produits ({invoice.items.length})
                        </h4>
                        <div className="products-table-container-elegant">
                          <table className="products-table-elegant">
                            <thead>
                              <tr>
                                <th className="product-col-elegant">Produit</th>
                                <th className="quantity-col-elegant">Quantité</th>
                                <th className="price-col-elegant">Prix</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoice.items.map((item) => (
                                <tr key={item.id} className="product-row-elegant">
                                  <td className="product-cell-elegant">
                                    <div className="product-name-wrapper-elegant">
                                      <span className="product-name-elegant">
                                        {item.productName}
                                      </span>
                                      <div className="product-badges-elegant">
                                        <span className="status-badge-small-elegant">
                                          {translateItemStatus(item.status)}
                                        </span>
                                        {item.discountPercentage && item.discountPercentage > 0 && (
                                          <span className="discount-badge-small-elegant">
                                            -{item.discountPercentage}%
                                          </span>
                                        )}
                                      </div>
                                      <span className="product-category-elegant">
                                        📂 {item.category}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="quantity-cell-elegant">
                                    <span className="quantity-value-elegant">
                                      {item.quantity}
                                    </span>
                                  </td>
                                  <td className="price-cell-elegant">
                                    {item.originalPrice && item.originalPrice !== item.unitPrice ? (
                                      <div className="price-wrapper-elegant">
                                        <span className="original-price-elegant">
                                          {formatPrice(item.originalPrice)}
                                        </span>
                                        <span className="current-price-elegant">
                                          {formatPrice(item.unitPrice)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="current-price-elegant">
                                        {formatPrice(item.unitPrice)}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Mode de règlement */}
                      {invoice.paymentDetails?.method && (
                        <div className="payment-section-elegant">
                          <h4 className="payment-title-elegant">
                            💳 Mode de règlement
                          </h4>
                          <div className="payment-method-elegant">
                            {translatePaymentMethod(invoice.paymentDetails.method)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
};
