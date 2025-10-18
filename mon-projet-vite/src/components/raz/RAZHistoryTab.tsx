import React, { useState, useEffect } from 'react';
import { Calendar, Download, Eye, Mail, Printer, Trash2 } from 'lucide-react';
import { getDB, type RAZHistoryEntry } from '@/db/index';

export const RAZHistoryTab: React.FC = () => {
  const [history, setHistory] = useState<RAZHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<RAZHistoryEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Charger l'historique depuis IndexedDB
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const db = await getDB();
      
      // Essayer de charger depuis la table razHistory
      // Si elle n'existe pas encore, on la créera
      try {
        const entries = await db.table('razHistory').reverse().toArray();
        setHistory(entries);
      } catch (error) {
        console.log('📊 Table razHistory pas encore créée, elle sera créée au premier RAZ');
        setHistory([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement historique RAZ:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Supprimer cette entrée de l\'historique ?')) return;
    
    try {
      const db = await getDB();
      await db.table('razHistory').delete(id);
      await loadHistory();
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const viewDetails = (entry: RAZHistoryEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  const downloadAsPDF = (entry: RAZHistoryEntry) => {
    // TODO: Générer un PDF de la feuille de caisse
    alert('Export PDF en cours de développement');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', color: '#666' }}>
          Chargement de l'historique...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
          color: 'white',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '2.5em', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            📚 Historique des RAZ
          </h1>
          <p style={{ margin: '10px 0 0 0', fontSize: '1.2em', opacity: 0.9 }}>
            Consultez toutes vos feuilles de caisse et résumés de journée
          </p>
        </div>

        {/* Stats globales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #3b82f6'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
              Total RAZ effectués
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e40af' }}>
              {history.length}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #10b981'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
              CA Total archivé
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669' }}>
              {formatCurrency(history.reduce((sum, h) => sum + h.totalSales, 0))}
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderLeft: '4px solid #f59e0b'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
              Ventes archivées
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#d97706' }}>
              {history.reduce((sum, h) => sum + h.salesCount, 0)}
            </div>
          </div>
        </div>

        {/* Liste de l'historique */}
        {history.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '60px 40px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
            <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>
              Aucun RAZ archivé
            </h2>
            <p style={{ fontSize: '16px', color: '#666' }}>
              Les feuilles de caisse seront automatiquement sauvegardées ici après chaque RAZ
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {history.map((entry) => (
              <div
                key={entry.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ padding: '25px' }}>
                  {/* En-tête de l'entrée */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '20px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#1e40af',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <Calendar size={20} />
                        {entry.sessionName}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        RAZ effectué le {new Date(entry.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {entry.sessionStart && entry.sessionEnd && (
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                          Période: {new Date(entry.sessionStart).toLocaleDateString('fr-FR')} - {new Date(entry.sessionEnd).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>

                    {/* Boutons d'action */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => viewDetails(entry)}
                        style={{
                          padding: '10px 16px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        title="Voir les détails"
                      >
                        <Eye size={16} />
                        Voir
                      </button>
                      <button
                        onClick={() => downloadAsPDF(entry)}
                        style={{
                          padding: '10px 16px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        title="Télécharger PDF"
                      >
                        <Download size={16} />
                        PDF
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        style={{
                          padding: '10px 16px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Statistiques de l'entrée */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '15px',
                    padding: '20px',
                    background: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        CA Total
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
                        {formatCurrency(entry.totalSales)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        Espèces
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0891b2' }}>
                        {formatCurrency(entry.totalCash)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        Carte
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed' }}>
                        {formatCurrency(entry.totalCard)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        Chèques
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
                        {formatCurrency(entry.totalChecks)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        Ventes
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
                        {entry.salesCount}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        Vendeuses
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#db2777' }}>
                        {entry.vendorStats.length}
                      </div>
                    </div>
                  </div>

                  {/* Top vendeuses */}
                  {entry.vendorStats.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '10px' }}>
                        Top Vendeuses:
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {entry.vendorStats
                          .sort((a, b) => b.dailySales - a.dailySales)
                          .slice(0, 3)
                          .map((vendor, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: '8px 12px',
                                background: idx === 0 ? '#fef3c7' : idx === 1 ? '#e0e7ff' : '#f3e8ff',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: idx === 0 ? '#92400e' : idx === 1 ? '#3730a3' : '#581c87'
                              }}
                            >
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {vendor.name}: {formatCurrency(vendor.dailySales)}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showDetailModal && selectedEntry && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '30px',
              borderBottom: '2px solid #e5e7eb',
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              color: 'white',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                📋 {selectedEntry.sessionName}
              </h2>
              <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
                RAZ du {new Date(selectedEntry.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div style={{ padding: '30px' }}>
              {/* Résumé financier */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#1e40af' }}>
                  💰 Résumé Financier
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '15px'
                }}>
                  <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>CA Total</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                      {formatCurrency(selectedEntry.totalSales)}
                    </div>
                  </div>
                  <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>Nombre de ventes</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>
                      {selectedEntry.salesCount}
                    </div>
                  </div>
                  <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>Espèces</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0891b2' }}>
                      {formatCurrency(selectedEntry.totalCash)}
                    </div>
                  </div>
                  <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>Carte</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>
                      {formatCurrency(selectedEntry.totalCard)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Détail vendeuses */}
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#1e40af' }}>
                  👥 Détail par Vendeuse
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedEntry.vendorStats
                    .sort((a, b) => b.dailySales - a.dailySales)
                    .map((vendor, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '15px',
                          background: '#f9fafb',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ fontWeight: '600', fontSize: '16px' }}>
                          {idx + 1}. {vendor.name}
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
                          {formatCurrency(vendor.dailySales)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Bouton fermer */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    padding: '12px 32px',
                    background: '#1e40af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

