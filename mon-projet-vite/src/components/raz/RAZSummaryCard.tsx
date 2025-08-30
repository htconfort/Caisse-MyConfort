import React from 'react';
import type { CalculsFinanciers } from './types';

interface RAZSummaryCardProps {
  calculs: CalculsFinanciers;
}

export default function RAZSummaryCard({ calculs }: RAZSummaryCardProps) {
  const formatEuro = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatPercent = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  return (
    <div style={{ 
      backgroundColor: '#F9FAFB', 
      border: '1px solid #E5E7EB', 
      borderRadius: 12, 
      padding: 25, 
      marginBottom: 25 
    }}>
      <h3 style={{ 
        margin: '0 0 20px 0', 
        color: '#374151', 
        fontWeight: 700, 
        fontSize: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        💰 Récapitulatif Financier
        <span style={{ 
          fontSize: 14, 
          fontWeight: 400, 
          color: '#6B7280',
          backgroundColor: '#E5E7EB',
          padding: '4px 8px',
          borderRadius: 6
        }}>
          {calculs.nbVentes} vente{calculs.nbVentes > 1 ? 's' : ''}
        </span>
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
        {/* Totaux principaux */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: 20, 
          borderRadius: 8, 
          border: '1px solid #E5E7EB' 
        }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#374151' }}>💎 Totaux</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Total HT:</span>
              <span style={{ fontWeight: 600, color: '#059669' }}>{formatEuro(calculs.totalHT)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>TVA:</span>
              <span style={{ fontWeight: 600, color: '#DC2626' }}>{formatEuro(calculs.totalTVA)}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              borderTop: '1px solid #E5E7EB', 
              paddingTop: 8, 
              marginTop: 4 
            }}>
              <span style={{ color: '#374151', fontWeight: 600 }}>Total TTC:</span>
              <span style={{ fontWeight: 700, color: '#1F2937', fontSize: '1.1em' }}>
                {formatEuro(calculs.totalTTC)}
              </span>
            </div>
          </div>
        </div>

        {/* Répartition des paiements */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: 20, 
          borderRadius: 8, 
          border: '1px solid #E5E7EB' 
        }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#374151' }}>💳 Paiements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                💳 Carte:
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 600, color: '#1F2937' }}>
                  {formatEuro(calculs.parPaiement.carte)}
                </span>
                <div style={{ fontSize: '0.8em', color: '#6B7280' }}>
                  {formatPercent(calculs.parPaiement.carte, calculs.totalTTC)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                💰 Espèces:
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 600, color: '#1F2937' }}>
                  {formatEuro(calculs.parPaiement.especes)}
                </span>
                <div style={{ fontSize: '0.8em', color: '#6B7280' }}>
                  {formatPercent(calculs.parPaiement.especes, calculs.totalTTC)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                📄 Chèque:
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 600, color: '#1F2937' }}>
                  {formatEuro(calculs.parPaiement.cheque)}
                </span>
                <div style={{ fontSize: '0.8em', color: '#6B7280' }}>
                  {formatPercent(calculs.parPaiement.cheque, calculs.totalTTC)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                🔄 Mixte:
              </span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 600, color: '#1F2937' }}>
                  {formatEuro(calculs.parPaiement.mixte)}
                </span>
                <div style={{ fontSize: '0.8em', color: '#6B7280' }}>
                  {formatPercent(calculs.parPaiement.mixte, calculs.totalTTC)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: 20, 
          borderRadius: 8, 
          border: '1px solid #E5E7EB' 
        }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#374151' }}>📊 Statistiques</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Nombre de ventes:</span>
              <span style={{ fontWeight: 600, color: '#1F2937' }}>{calculs.nbVentes}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Panier moyen:</span>
              <span style={{ fontWeight: 600, color: '#059669' }}>
                {calculs.nbVentes > 0 ? formatEuro(calculs.totalTTC / calculs.nbVentes) : formatEuro(0)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Vendeuses actives:</span>
              <span style={{ fontWeight: 600, color: '#7C3AED' }}>
                {calculs.venteursAvecDetail.filter(v => v.nbVentesCalcule > 0).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
