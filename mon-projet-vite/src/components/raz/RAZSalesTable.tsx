import React from 'react';
import type { VendeusesAvecDetail } from './types';

interface RAZSalesTableProps {
  venteursAvecDetail: VendeusesAvecDetail[];
}

export default function RAZSalesTable({ venteursAvecDetail }: RAZSalesTableProps) {
  const formatEuro = (amount: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatPercent = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const totalGeneral = venteursAvecDetail.reduce((sum, v) => sum + v.totalCalcule, 0);

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
        👥 Détail par Vendeuse
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          backgroundColor: 'white',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#F3F4F6' }}>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'left', 
                fontWeight: 600, 
                color: '#374151',
                borderBottom: '1px solid #E5E7EB'
              }}>
                Vendeuse
              </th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'center', 
                fontWeight: 600, 
                color: '#374151',
                borderBottom: '1px solid #E5E7EB'
              }}>
                Nb Ventes
              </th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'right', 
                fontWeight: 600, 
                color: '#374151',
                borderBottom: '1px solid #E5E7EB'
              }}>
                💳 Carte
              </th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'right', 
                fontWeight: 600, 
                color: '#374151',
                borderBottom: '1px solid #E5E7EB'
              }}>
                💰 Espèces
              </th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'right', 
                fontWeight: 600, 
                color: '#374151',
                borderBottom: '1px solid #E5E7EB'
              }}>
                📄 Chèque
              </th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'right', 
                fontWeight: 600, 
                color: '#374151',
                borderBottom: '1px solid #E5E7EB'
              }}>
                🔄 Mixte
              </th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'right', 
                fontWeight: 600, 
                color: '#374151',
                borderBottom: '1px solid #E5E7EB'
              }}>
                Total
              </th>
              <th style={{ 
                padding: '16px 20px', 
                textAlign: 'center', 
                fontWeight: 600, 
                color: '#374151',
                borderBottom: '1px solid #E5E7EB'
              }}>
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {venteursAvecDetail
              .filter(v => v.nbVentesCalcule > 0)
              .sort((a, b) => b.totalCalcule - a.totalCalcule)
              .map((vendeur) => (
                <tr 
                  key={vendeur.id}
                  style={{ 
                    borderBottom: '1px solid #F3F4F6'
                  }}
                >
                  <td style={{ 
                    padding: '16px 20px',
                    fontWeight: 600,
                    color: '#1F2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <div 
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: vendeur.color || '#6B7280'
                      }}
                    />
                    {vendeur.name}
                  </td>
                  <td style={{ 
                    padding: '16px 20px', 
                    textAlign: 'center', 
                    color: '#6B7280',
                    fontWeight: 500
                  }}>
                    {vendeur.nbVentesCalcule}
                  </td>
                  <td style={{ 
                    padding: '16px 20px', 
                    textAlign: 'right', 
                    color: '#1F2937',
                    fontWeight: 500
                  }}>
                    {formatEuro(vendeur.detailPaiements.carte)}
                  </td>
                  <td style={{ 
                    padding: '16px 20px', 
                    textAlign: 'right', 
                    color: '#1F2937',
                    fontWeight: 500
                  }}>
                    {formatEuro(vendeur.detailPaiements.especes)}
                  </td>
                  <td style={{ 
                    padding: '16px 20px', 
                    textAlign: 'right', 
                    color: '#1F2937',
                    fontWeight: 500
                  }}>
                    {formatEuro(vendeur.detailPaiements.cheque)}
                  </td>
                  <td style={{ 
                    padding: '16px 20px', 
                    textAlign: 'right', 
                    color: '#1F2937',
                    fontWeight: 500
                  }}>
                    {formatEuro(vendeur.detailPaiements.mixte)}
                  </td>
                  <td style={{ 
                    padding: '16px 20px', 
                    textAlign: 'right', 
                    color: '#059669',
                    fontWeight: 700,
                    fontSize: '1.05em'
                  }}>
                    {formatEuro(vendeur.totalCalcule)}
                  </td>
                  <td style={{ 
                    padding: '16px 20px', 
                    textAlign: 'center',
                    color: '#7C3AED',
                    fontWeight: 600
                  }}>
                    {formatPercent(vendeur.totalCalcule, totalGeneral)}
                  </td>
                </tr>
              ))}
            
            {/* Ligne de total */}
            {venteursAvecDetail.some(v => v.nbVentesCalcule > 0) && (
              <tr style={{ 
                backgroundColor: '#F3F4F6', 
                borderTop: '2px solid #E5E7EB',
                fontWeight: 700
              }}>
                <td style={{ 
                  padding: '16px 20px',
                  color: '#374151',
                  fontWeight: 700
                }}>
                  TOTAL GÉNÉRAL
                </td>
                <td style={{ 
                  padding: '16px 20px', 
                  textAlign: 'center', 
                  color: '#374151',
                  fontWeight: 700
                }}>
                  {venteursAvecDetail.reduce((sum, v) => sum + v.nbVentesCalcule, 0)}
                </td>
                <td style={{ 
                  padding: '16px 20px', 
                  textAlign: 'right', 
                  color: '#374151',
                  fontWeight: 700
                }}>
                  {formatEuro(venteursAvecDetail.reduce((sum, v) => sum + v.detailPaiements.carte, 0))}
                </td>
                <td style={{ 
                  padding: '16px 20px', 
                  textAlign: 'right', 
                  color: '#374151',
                  fontWeight: 700
                }}>
                  {formatEuro(venteursAvecDetail.reduce((sum, v) => sum + v.detailPaiements.especes, 0))}
                </td>
                <td style={{ 
                  padding: '16px 20px', 
                  textAlign: 'right', 
                  color: '#374151',
                  fontWeight: 700
                }}>
                  {formatEuro(venteursAvecDetail.reduce((sum, v) => sum + v.detailPaiements.cheque, 0))}
                </td>
                <td style={{ 
                  padding: '16px 20px', 
                  textAlign: 'right', 
                  color: '#374151',
                  fontWeight: 700
                }}>
                  {formatEuro(venteursAvecDetail.reduce((sum, v) => sum + v.detailPaiements.mixte, 0))}
                </td>
                <td style={{ 
                  padding: '16px 20px', 
                  textAlign: 'right', 
                  color: '#059669',
                  fontWeight: 700,
                  fontSize: '1.1em'
                }}>
                  {formatEuro(totalGeneral)}
                </td>
                <td style={{ 
                  padding: '16px 20px', 
                  textAlign: 'center',
                  color: '#374151',
                  fontWeight: 700
                }}>
                  100%
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {venteursAvecDetail.every(v => v.nbVentesCalcule === 0) && (
          <div style={{ 
            textAlign: 'center', 
            padding: 40, 
            color: '#6B7280',
            backgroundColor: 'white',
            borderRadius: 8
          }}>
            <div style={{ fontSize: '2em', marginBottom: 10 }}>📭</div>
            <div style={{ fontWeight: 600 }}>Aucune vente enregistrée aujourd'hui</div>
            <div style={{ fontSize: '0.9em', marginTop: 5 }}>
              Les ventes apparaîtront ici une fois qu'elles seront saisies
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
