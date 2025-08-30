import { useMemo } from 'react';
import type { Sale, Vendor } from '../../types';
import type { VendeusesAvecDetail, CalculsFinanciers } from '../../components/raz/types';

export function useRAZCalculs(sales: Sale[], vendorStats: Vendor[]) {
  return useMemo((): CalculsFinanciers => {
    const validSales = sales.filter(sale => !sale.canceled);
    
    // Calcul des totaux par type de paiement
    const parPaiement = validSales.reduce(
      (acc, sale) => {
        switch (sale.paymentMethod) {
          case 'card':
            acc.carte += sale.totalAmount;
            break;
          case 'cash':
            acc.especes += sale.totalAmount;
            break;
          case 'check':
            acc.cheque += sale.totalAmount;
            break;
          case 'multi':
            acc.mixte += sale.totalAmount;
            break;
        }
        return acc;
      },
      { carte: 0, especes: 0, cheque: 0, mixte: 0 }
    );

    // Calculs des totaux
    const totalTTC = validSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    // Note: Nous supposons une TVA de 20% (peut être calculée autrement selon vos besoins)
    const totalTVA = totalTTC * 0.2 / 1.2; // TVA incluse dans le prix
    const totalHT = totalTTC - totalTVA;
    const nbVentes = validSales.length;

    // Enrichissement des vendeurs avec détails de paiement
    const venteursAvecDetail: VendeusesAvecDetail[] = vendorStats.map(vendor => {
      const ventesVendeur = validSales.filter(sale => sale.vendorId === vendor.id);
      
      const detailPaiements = ventesVendeur.reduce(
        (acc, sale) => {
          switch (sale.paymentMethod) {
            case 'card':
              acc.carte += sale.totalAmount;
              break;
            case 'cash':
              acc.especes += sale.totalAmount;
              break;
            case 'check':
              acc.cheque += sale.totalAmount;
              break;
            case 'multi':
              acc.mixte += sale.totalAmount;
              break;
          }
          return acc;
        },
        { carte: 0, especes: 0, cheque: 0, mixte: 0 }
      );

      const totalCalcule = ventesVendeur.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const nbVentesCalcule = ventesVendeur.length;

      return {
        ...vendor,
        detailPaiements,
        totalCalcule,
        nbVentesCalcule
      };
    });

    return {
      parPaiement,
      totalTTC,
      totalTVA,
      totalHT,
      nbVentes,
      venteursAvecDetail
    };
  }, [sales, vendorStats]);
}
