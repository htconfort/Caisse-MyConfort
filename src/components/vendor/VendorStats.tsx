import React from 'react';
import { useSales } from '../../hooks/useSales';
import { Vendor } from '../../types/Vendor';

interface VendorStatsProps {
  selectedVendor: Vendor | null;
}

const VendorStats: React.FC<VendorStatsProps> = ({ selectedVendor }) => {
  const { getSalesByVendor } = useSales();
  const salesData = selectedVendor ? getSalesByVendor(selectedVendor.id) : [];

  const totalSales = salesData.reduce((acc, sale) => acc + sale.amount, 0);
  const totalTransactions = salesData.length;

  return (
    <div className="vendor-stats">
      {selectedVendor ? (
        <>
          <h2>Statistiques pour {selectedVendor.name}</h2>
          <p>Total des ventes: {totalSales.toFixed(2)} €</p>
          <p>Nombre de transactions: {totalTransactions}</p>
        </>
      ) : (
        <p>Aucun vendeur sélectionné.</p>
      )}
    </div>
  );
};

export default VendorStats;