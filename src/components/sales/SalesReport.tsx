import React from 'react';
import { useSales } from '../../hooks/useSales';
import { VendorSelector } from '../vendor/VendorSelector';
import { SalesHistory } from './SalesHistory';

const SalesReport: React.FC = () => {
    const { salesData, totalSales, salesByVendor } = useSales();

    return (
        <div className="sales-report">
            <h2>Rapport de Ventes</h2>
            <div className="total-sales">
                <h3>Total des Ventes: {totalSales} €</h3>
            </div>
            <VendorSelector />
            <SalesHistory salesData={salesData} />
            <div className="sales-by-vendor">
                <h3>Ventes par Vendeuse</h3>
                <ul>
                    {Object.entries(salesByVendor).map(([vendor, amount]) => (
                        <li key={vendor}>
                            {vendor}: {amount} €
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SalesReport;