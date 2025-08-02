import React from 'react';
import { useSales } from '../../hooks/useSales';
import { Sale } from '../../types/Sale';
import './SalesHistory.css';

const SalesHistory: React.FC = () => {
    const { sales } = useSales();

    return (
        <div className="sales-history">
            <h2>Historique des Ventes</h2>
            {sales.length === 0 ? (
                <p>Aucune vente enregistrée.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Vendeuse</th>
                            <th>Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((sale: Sale, index: number) => (
                            <tr key={index}>
                                <td>{new Date(sale.date).toLocaleString()}</td>
                                <td>{sale.vendor}</td>
                                <td>{sale.amount.toFixed(2)} €</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default SalesHistory;