import React, { useState, useEffect } from 'react';
import { Calendar, Download, Eye, Mail, Printer, Trash2, Sparkles } from 'lucide-react';
import { getDB, type RAZHistoryEntry } from '@/db/index';
import { printHtmlA4 } from '@/utils/printA4';
import { populateRAZHistoryWithTestData, clearRAZHistory } from '@/utils/populateRAZHistory';
import { RAZPasswordProtection } from './RAZPasswordProtection';

export const RAZHistoryTab: React.FC = () => {
  const [history, setHistory] = useState<RAZHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<RAZHistoryEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Vérifier si déjà déverrouillé dans cette session
  useEffect(() => {
    const unlocked = sessionStorage.getItem('raz_history_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  // Charger l'historique depuis IndexedDB (quand déverrouillé)
  useEffect(() => {
    if (isUnlocked) {
      loadHistory();
    }
  }, [isUnlocked]);

  const loadHistory = async () => {
    // Ne charger que si déverrouillé
    if (!isUnlocked) {
      setLoading(false);
      return;
    }
    
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

  const loadTestData = async () => {
    if (!confirm('Charger des données de test pour la démonstration ?\n\n5 RAZ fictifs seront créés avec des foires et événements de test.')) {
      return;
    }
    
    try {
      setLoading(true);
      await populateRAZHistoryWithTestData();
      await loadHistory();
      alert('✅ Données de test chargées !\n\n5 RAZ de démonstration ont été créés.\nVous pouvez maintenant tester l\'impression et la consultation.');
    } catch (error) {
      console.error('❌ Erreur chargement données test:', error);
      alert('Erreur lors du chargement des données de test');
    } finally {
      setLoading(false);
    }
  };

  const clearAllHistory = async () => {
    if (!confirm('Supprimer TOUT l\'historique ?\n\nCette action est irréversible.')) {
      return;
    }
    
    try {
      await clearRAZHistory();
      await loadHistory();
      alert('✅ Historique RAZ vidé');
    } catch (error) {
      console.error('❌ Erreur nettoyage:', error);
      alert('Erreur lors du nettoyage');
    }
  };

  const viewDetails = (entry: RAZHistoryEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  const printCashSheet = (entry: RAZHistoryEntry) => {
    const html = generateCashSheetHTML(entry);
    printHtmlA4(html);
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

  const generateCashSheetHTML = (entry: RAZHistoryEntry): string => {
    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    const formatDateTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <style>
          @page { margin: 2cm; }
          body {
            font-family: 'Arial', sans-serif;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #477A0C;
          }
          .header h1 {
            color: #477A0C;
            font-size: 28px;
            margin: 0 0 10px 0;
          }
          .section {
            margin: 25px 0;
            page-break-inside: avoid;
          }
          .section-title {
            background: #477A0C;
            color: white;
            padding: 10px 15px;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 15px 0;
          }
          .stat-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #477A0C;
          }
          .stat-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #477A0C;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #477A0C;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          .total-row {
            background-color: #e8f5e9;
            font-weight: bold;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 FEUILLE DE CAISSE MYCONFORT</h1>
          <p><strong>${entry.sessionName}</strong></p>
          <p>RAZ effectué le ${formatDateTime(entry.date)}</p>
          ${entry.sessionStart && entry.sessionEnd ? 
            `<p>Période: ${formatDate(entry.sessionStart)} - ${formatDate(entry.sessionEnd)}</p>` 
            : ''}
        </div>

        <div class="section">
          <div class="section-title">💰 RÉSUMÉ FINANCIER</div>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-label">CA Total</div>
              <div class="stat-value">${formatCurrency(entry.totalSales)}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Nombre de ventes</div>
              <div class="stat-value">${entry.salesCount}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Ticket moyen</div>
              <div class="stat-value">${formatCurrency(entry.salesCount > 0 ? entry.totalSales / entry.salesCount : 0)}</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-label">💵 Espèces</div>
              <div class="stat-value">${formatCurrency(entry.totalCash)}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">💳 Carte Bancaire</div>
              <div class="stat-value">${formatCurrency(entry.totalCard)}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">📄 Chèques</div>
              <div class="stat-value">${formatCurrency(entry.totalChecks)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">👥 DÉTAIL PAR VENDEUSE</div>
          <table>
            <thead>
              <tr>
                <th>Rang</th>
                <th>Vendeuse</th>
                <th>CA du jour</th>
                <th>CA total</th>
                <th>% du CA</th>
              </tr>
            </thead>
            <tbody>
              ${entry.vendorStats
                .sort((a, b) => b.dailySales - a.dailySales)
                .map((vendor, idx) => `
                  <tr>
                    <td>${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : (idx + 1)}</td>
                    <td><strong>${vendor.name}</strong></td>
                    <td>${formatCurrency(vendor.dailySales)}</td>
                    <td>${formatCurrency(vendor.totalSales)}</td>
                    <td>${entry.totalSales > 0 ? ((vendor.dailySales / entry.totalSales) * 100).toFixed(1) : '0.0'}%</td>
                  </tr>
                `).join('')}
              <tr class="total-row">
                <td colspan="2">TOTAL</td>
                <td>${formatCurrency(entry.vendorStats.reduce((sum, v) => sum + v.dailySales, 0))}</td>
                <td>${formatCurrency(entry.vendorStats.reduce((sum, v) => sum + v.totalSales, 0))}</td>
                <td>100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">📊 RÉCAPITULATIF</div>
          <table>
            <tr>
              <th>Indicateur</th>
              <th>Valeur</th>
            </tr>
            <tr>
              <td>Nombre de vendeuses actives</td>
              <td>${entry.vendorStats.length}</td>
            </tr>
            <tr>
              <td>Nombre total de ventes</td>
              <td>${entry.salesCount}</td>
            </tr>
            <tr>
              <td>Chiffre d'affaires total</td>
              <td><strong>${formatCurrency(entry.totalSales)}</strong></td>
            </tr>
            <tr>
              <td>Panier moyen</td>
              <td>${formatCurrency(entry.salesCount > 0 ? entry.totalSales / entry.salesCount : 0)}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>📋 Feuille de caisse archivée - Caisse MyConfort</p>
          <p>Document généré le ${formatDateTime(entry.date)}</p>
          <p>Session: ${entry.sessionName}</p>
        </div>
      </body>
      </html>
    `;
  };

  // Afficher le formulaire de mot de passe si pas déverrouillé
  if (!isUnlocked) {
    return <RAZPasswordProtection onUnlock={() => {
      setIsUnlocked(true);
    }} />;
  }

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
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
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {history.length === 0 && (
                <button
                  onClick={loadTestData}
                  style={{
                    padding: '12px 20px',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.5)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  title="Charger des données de démonstration"
                >
                  <Sparkles size={16} />
                  Charger données de test
                </button>
              )}
              {history.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  style={{
                    padding: '12px 20px',
                    background: 'rgba(239,68,68,0.9)',
                    color: 'white',
                    border: '2px solid rgba(255,255,255,0.5)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  title="Supprimer tout l'historique"
                >
                  <Trash2 size={16} />
                  Tout supprimer
                </button>
              )}
            </div>
          </div>
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
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
              Les feuilles de caisse seront automatiquement sauvegardées ici après chaque RAZ
            </p>
            
            <div style={{
              background: '#f0f9ff',
              border: '2px dashed #3b82f6',
              borderRadius: '10px',
              padding: '25px',
              marginTop: '20px',
              maxWidth: '600px',
              margin: '30px auto'
            }}>
              <div style={{ fontSize: '20px', marginBottom: '15px', color: '#1e40af', fontWeight: 'bold' }}>
                ✨ Mode Démonstration
              </div>
              <p style={{ fontSize: '15px', color: '#666', marginBottom: '20px' }}>
                Pour voir l'interface en action sans faire de vraies ventes, vous pouvez charger des données de test.
              </p>
              <button
                onClick={loadTestData}
                style={{
                  padding: '15px 30px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                }}
              >
                <Sparkles size={20} />
                Charger 5 RAZ de démonstration
              </button>
              <p style={{ fontSize: '13px', color: '#999', marginTop: '15px' }}>
                (Ceci créera 5 feuilles de caisse fictives pour tester l'impression et la consultation)
              </p>
            </div>
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
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                        onClick={() => printCashSheet(entry)}
                        style={{
                          padding: '10px 16px',
                          background: '#477A0C',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        title="Imprimer la feuille de caisse"
                      >
                        <Printer size={16} />
                        Imprimer
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

              {/* Boutons d'action modal */}
              <div style={{ 
                display: 'flex', 
                gap: '15px', 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => {
                    printCashSheet(selectedEntry);
                  }}
                  style={{
                    padding: '12px 32px',
                    background: '#477A0C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <Printer size={20} />
                  Imprimer la feuille
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    padding: '12px 32px',
                    background: '#6b7280',
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

