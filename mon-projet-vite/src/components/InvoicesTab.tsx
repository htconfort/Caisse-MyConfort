import React, { useState } from 'react';
import { useSyncInvoices } from '../hooks/useSyncInvoices';
import { useStockManagement } from '../hooks/useStockManagement';
import { useNotifications } from '../hooks/useNotifications';
import { InvoiceCard } from './InvoiceCard';
import { StockOverview } from './StockOverview';
import { SyncStatus } from './SyncStatus';
import { NotificationCenter } from './NotificationCenter';
import type { Invoice } from '../services/syncService';

export const InvoicesTab: React.FC = () => {
  const [activeView, setActiveView] = useState<'invoices' | 'stock'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | 'all'>('all');
  
  const {
    invoices,
    stats,
    loading,
    error,
    syncInvoices,
    updateItemStatus,
    filterInvoicesByStatus,
    searchInvoices
  } = useSyncInvoices();

  const {
    stockItems,
    loading: stockLoading,
    getStockStats
  } = useStockManagement();

  const {
    notifications,
    removeNotification,
    notifyItemStatusChanged,
    notifySyncError
  } = useNotifications();

  // Gestion du changement de statut d'un produit
  const handleStatusChange = async (invoiceId: string, itemId: string, newStatus: 'pending' | 'available' | 'delivered' | 'cancelled') => {
    const success = await updateItemStatus(invoiceId, itemId, newStatus);
    
    if (success) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      const item = invoice?.items.find(item => item.id === itemId);
      
      if (item) {
        notifyItemStatusChanged(item.productName, newStatus);
      }
    } else {
      notifySyncError('Impossible de mettre à jour le statut');
    }
  };

  // Filtrage des factures
  const getFilteredInvoices = () => {
    let filtered = invoices;
    
    if (statusFilter !== 'all') {
      filtered = filterInvoicesByStatus(statusFilter);
    }
    
    if (searchQuery.trim()) {
      filtered = searchInvoices(searchQuery);
    }
    
    return filtered;
  };

  const filteredInvoices = getFilteredInvoices();
  const stockStats = getStockStats();

  if (loading && invoices.length === 0) {
    return (
      <div className="max-w-6xl mx-auto animate-fadeIn">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg" style={{ color: '#6B7280' }}>
            Chargement des factures...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn">
      <NotificationCenter 
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Header avec statistiques */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold" style={{ color: 'var(--dark-green)' }}>
            📄 Factures & Stock
          </h2>
          <SyncStatus 
            stats={stats}
            onSync={syncInvoices}
            loading={loading}
          />
        </div>

        {/* Navigation vue */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setActiveView('invoices')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === 'invoices'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📄 Factures ({stats.totalInvoices})
          </button>
          <button
            onClick={() => setActiveView('stock')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === 'stock'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📦 Stock ({stockStats.totalProducts})
          </button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.pendingInvoices}</div>
            <div className="text-sm text-gray-600">En cours</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.partialInvoices}</div>
            <div className="text-sm text-gray-600">Partielles</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stockStats.totalAvailable}</div>
            <div className="text-sm text-gray-600">Disponibles</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stockStats.lowStockItems}</div>
            <div className="text-sm text-gray-600">Stock bas</div>
          </div>
        </div>
      </div>

      {/* Vue des factures */}
      {activeView === 'invoices' && (
        <div>
          {/* Filtres et recherche */}
          <div className="card p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher par client, numéro ou produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as Invoice['status'] | 'all')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="draft">Brouillon</option>
                  <option value="sent">Envoyée</option>
                  <option value="partial">Partielle</option>
                  <option value="paid">Payée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des factures */}
          {error && (
            <div className="card p-4 mb-6 border-l-4 border-red-500 bg-red-50">
              <p className="text-red-700">
                ⚠️ Erreur: {error}
              </p>
              <button
                onClick={syncInvoices}
                className="mt-2 text-red-600 hover:text-red-800 underline"
              >
                Réessayer
              </button>
            </div>
          )}

          {filteredInvoices.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-xl text-gray-600 mb-4">
                {invoices.length === 0 ? 'Aucune facture trouvée' : 'Aucune facture ne correspond aux filtres'}
              </p>
              {invoices.length === 0 && (
                <button
                  onClick={syncInvoices}
                  className="btn-primary"
                  disabled={loading}
                >
                  🔄 Synchroniser
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vue des stocks */}
      {activeView === 'stock' && (
        <StockOverview
          stockItems={stockItems}
          loading={stockLoading}
          stats={stockStats}
        />
      )}
    </div>
  );
};
