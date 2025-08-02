import React from 'react';
import { usePayment } from '../../hooks/usePayment';
import { formatCurrency } from '../../utils/formatting';

const PaymentSummary: React.FC = () => {
    const { totalAmount, selectedPaymentMethod } = usePayment();

    return (
        <div className="payment-summary">
            <h2>Résumé du Paiement</h2>
            <div className="summary-details">
                <p><strong>Total à Payer:</strong> {formatCurrency(totalAmount)}</p>
                <p><strong>Méthode de Paiement:</strong> {selectedPaymentMethod}</p>
            </div>
        </div>
    );
};

export default PaymentSummary;