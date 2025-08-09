/**
 * Onglet Factures avec design compact et intégration factures externes
 * Remplace l'ancien InvoicesTabElegant avec une approche moderne
 * Version: 3.8.1 - MyConfort
 */

import React, { useState, useMemo } from 'react';
import { useSyncInvoices } from '../hooks/useSyncInvoices';
import { useExternalInvoices } from '../hooks/useExternalInvoices';
import { useNotifications } from '../hooks/useNotifications';
import CompactInvoicesDisplay from './CompactInvoicesDisplay';
import ExternalInvoicesDisplay from './ExternalInvoicesDisplay';
import { NotificationCenter } from './NotificationCenter';
import { Sale } from '../types';
import '../styles/invoices-compact.css';

interface UnifiedInvoice {
  id: string;
  number: string;
  client: { name: string; email?: string; phone?: string; };
  date: string;
  products: { count: number; firstProduct: string; };
  status: string;
  amount: number;
  type: 'internal' | 'external';
  originalData: any;
}

type ViewType = 'compact' | 'external' | 'detailed';

interface InvoicesTabCompactProps {
  sales?: Sale[]; // Ventes internes optionnelles
}

const InvoicesTabCompact: React.FC<InvoicesTabCompactProps> = ({ sales = [] }) => {
  const [activeView, setActiveView] = useState<'compact' | 'external' | 'detailed'>('compact');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const {
    invoices: syncedInvoices,
    loading: syncLoading,
    error: syncError,
    syncInvoices
  } = useSyncInvoices();

  const {
    invoices: externalInvoices,
    stats: externalStats,
    isLoading: externalLoading,
    error: externalError,
    syncWithAPI: syncExternal
  } = useExternalInvoices();

  const {
    notifications,
    removeNotification
  } = useNotifications();

  // Convertir les ventes en format facture pour l'affichage unifié
  const salesAsInvoices: Sale[] = useMemo(() => {
    return sales.filter(sale => !sale.canceled);
  }, [sales]);

  // Statistiques globales
  const globalStats = useMemo(() => {
    const totalInternal = syncedInvoices.length + salesAsInvoices.length;
    const totalExternal = externalInvoices.length;
    const totalInvoices = totalInternal + totalExternal;
    
    const totalAmountInternal = syncedInvoices.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0) +
                               salesAsInvoices.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalAmountExternal = externalStats.totalAmount;
    const totalAmount = totalAmountInternal + totalAmountExternal;

    return {
      totalInvoices,
      totalInternal,
      totalExternal,
      totalAmount,
      totalAmountInternal,
      totalAmountExternal,
      todayExternal: externalStats.today,
      todayAmountExternal: externalStats.todayAmount
    };
  }, [syncedInvoices, salesAsInvoices, externalInvoices, externalStats]);

  const handleInvoiceClick = (invoice: any) => {
    setSelectedInvoice(invoice);
    setActiveView('detailed');
  };

  const handleSyncAll = async () => {
    console.log('🔄 Synchronisation globale des factures...');
    try {
      await Promise.all([
        syncInvoices(),
        syncExternal()
      ]);
      console.log('✅ Synchronisation terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const isLoading = syncLoading || externalLoading;
  const hasError = syncError || externalError;

  return (
    <div className="invoices-tab-compact">
      {/* En-tête avec statistiques */}
      <div style={{
        background: 'linear-gradient(135deg, #477A0C 0%, #14281D 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
            📊 Centre de Facturation MyConfort
          </h2>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* Bouton de test pour ajouter des factures factices */}
            {import.meta.env.DEV && (
              <button
                onClick={() => {
                  // Ajouter des factures de test
                  const testInvoices = [
                    {
                      invoiceNumber: "TEST-001",
                      invoiceDate: new Date().toISOString(),
                      client: { name: "Client Test 1", email: "test1@email.com", phone: "06 12 34 56 78" },
                      items: [{ sku: "TEST", name: "Matelas Test", qty: 1, unitPriceHT: 1000, tvaRate: 0.20 }],
                      totals: { ht: 1000, tva: 200, ttc: 1200 },
                      payment: { method: "Carte", paid: true, paidAmount: 1200 },
                      channels: { source: "Test", via: "Manuel" },
                      idempotencyKey: "TEST-001"
                    },
                    {
                      invoiceNumber: "TEST-002",
                      invoiceDate: new Date().toISOString(),
                      client: { name: "Client Test 2", email: "test2@email.com", phone: "06 98 76 54 32" },
                      items: [{ sku: "TEST2", name: "Sommier Test", qty: 1, unitPriceHT: 800, tvaRate: 0.20 }],
                      totals: { ht: 800, tva: 160, ttc: 960 },
                      payment: { method: "Chèque", paid: false, paidAmount: 0 },
                      channels: { source: "Test", via: "Manuel" },
                      idempotencyKey: "TEST-002"
                    }
                  ];
                  
                  testInvoices.forEach(invoice => {
                    const w = window as any;
                    if (w.externalInvoiceService) {
                      w.externalInvoiceService.receiveInvoice(invoice);
                    }
                  });
                  
                  // Forcer le rechargement
                  window.location.reload();
                }}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🧪 Ajouter Test Data
              </button>
            )}
            
            <button
              onClick={handleSyncAll}
              disabled={isLoading}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                marginRight: '0.5rem'
              }}
            >
              {isLoading ? '🔄 Sync...' : '🔄 Synchroniser tout'}
            </button>
            
            {/* Bouton de diagnostic */}
            <button
              onClick={() => {
                console.log('🔍 DIAGNOSTIC FACTURES EXTERNES:');
                console.log('Nombre de factures externes:', externalInvoices.length);
                console.log('Factures externes:', externalInvoices);
                if (externalInvoices.length > 0) {
                  console.log('Exemple de facture:', externalInvoices[0]);
                  console.log('Client:', externalInvoices[0].client);
                  console.log('Items:', externalInvoices[0].items);
                  console.log('Totaux:', externalInvoices[0].totals);
                }
                alert(`${externalInvoices.length} factures externes trouvées. Voir console pour détails.`);
              }}
              style={{
                background: '#17a2b8',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              🔍 Diagnostic
            </button>
          </div>
        </div>

        {/* Statistiques principales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '1rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {globalStats.totalInvoices}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              Total Factures
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '1rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {formatCurrency(globalStats.totalAmount)}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              Chiffre d'Affaires Total
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '1rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {globalStats.totalInternal} / {globalStats.totalExternal}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              Internes / Externes
            </div>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '1rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {globalStats.todayExternal}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              Externes Aujourd'hui
            </div>
          </div>
        </div>

        {/* Navigation des vues */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(0,0,0,0.2)',
          padding: '0.25rem',
          borderRadius: '8px'
        }}>
          {[
            { id: 'compact', label: '📋 Vue Compacte', description: 'Toutes les factures' },
            { id: 'external', label: '🔗 Externes', description: `${globalStats.totalExternal} factures` },
            { id: 'detailed', label: '📄 Détails', description: selectedInvoice ? 'Facture sélectionnée' : 'Aucune sélection' }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              style={{
                flex: 1,
                background: activeView === view.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textAlign: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{view.label}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{view.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Centre de notifications */}
      {notifications.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <NotificationCenter
            notifications={notifications}
            onRemove={removeNotification}
          />
        </div>
      )}

      {/* Affichage des erreurs */}
      {hasError && (
        <div style={{
          background: '#fee',
          border: '1px solid #f88',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#c33'
        }}>
          <strong>❌ Erreurs de synchronisation:</strong>
          {syncError && <div>• Factures internes: {syncError}</div>}
          {externalError && <div>• Factures externes: {externalError}</div>}
        </div>
      )}

      {/* Contenu principal selon la vue active */}
      <div style={{ minHeight: '400px' }}>
        {activeView === 'compact' && (
          <CompactInvoicesDisplay
            internalInvoices={salesAsInvoices}
            onInvoiceClick={handleInvoiceClick}
          />
        )}

        {activeView === 'external' && (
          <ExternalInvoicesDisplay
            showStats={true}
            maxHeight="600px"
          />
        )}

        {activeView === 'detailed' && (
          <div style={{
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            {selectedInvoice ? (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '2px solid #f0f0f0'
                }}>
                  <h3 style={{ margin: 0, color: '#477A0C' }}>
                    📄 Détails de la facture {selectedInvoice.number}
                  </h3>
                  <button
                    onClick={() => setActiveView('compact')}
                    style={{
                      background: '#477A0C',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    ← Retour à la liste
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem'
                }}>
                  <div>
                    <h4 style={{ color: '#477A0C', marginBottom: '1rem' }}>
                      👤 Informations Client
                    </h4>
                    <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
                      <div><strong>Nom:</strong> {selectedInvoice.client.name}</div>
                      {selectedInvoice.client.email && (
                        <div><strong>Email:</strong> {selectedInvoice.client.email}</div>
                      )}
                      {selectedInvoice.client.phone && (
                        <div><strong>Téléphone:</strong> {selectedInvoice.client.phone}</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ color: '#477A0C', marginBottom: '1rem' }}>
                      💰 Informations Financières
                    </h4>
                    <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
                      <div><strong>Montant:</strong> {formatCurrency(selectedInvoice.amount)}</div>
                      <div><strong>Statut:</strong> {selectedInvoice.status}</div>
                      <div><strong>Type:</strong> {selectedInvoice.type === 'external' ? 'Externe' : 'Interne'}</div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ color: '#477A0C', marginBottom: '1rem' }}>
                      🛍️ Produits
                    </h4>
                    <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
                      <div><strong>Nombre:</strong> {selectedInvoice.products.count}</div>
                      <div><strong>Premier produit:</strong> {selectedInvoice.products.firstProduct}</div>
                    </div>
                  </div>
                </div>

                {/* Données brutes en mode développement */}
                {import.meta.env.DEV && (
                  <details style={{ marginTop: '2rem' }}>
                    <summary style={{ cursor: 'pointer', color: '#666' }}>
                      🔧 Données brutes (dev)
                    </summary>
                    <pre style={{
                      background: '#f5f5f5',
                      padding: '1rem',
                      borderRadius: '8px',
                      overflow: 'auto',
                      fontSize: '0.8rem',
                      marginTop: '1rem'
                    }}>
                      {JSON.stringify(selectedInvoice.originalData, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#666',
                padding: '3rem'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                <h3>Aucune facture sélectionnée</h3>
                <p>Cliquez sur une facture dans la vue compacte pour voir ses détails</p>
                <button
                  onClick={() => setActiveView('compact')}
                  style={{
                    background: '#477A0C',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginTop: '1rem'
                  }}
                >
                  Voir toutes les factures
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesTabCompact;
