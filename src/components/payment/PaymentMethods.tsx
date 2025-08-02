import React from 'react';

const PaymentMethods = ({ selectedPaymentMethod, onSelectPaymentMethod }) => {
    const paymentMethods = [
        { id: 'cash', label: 'Espèces' },
        { id: 'card', label: 'Carte Bancaire' },
        { id: 'check', label: 'Chèque' },
        { id: 'multi', label: 'Multi-Paiements' },
    ];

    return (
        <div className="payment-methods">
            <h2>Méthodes de Paiement</h2>
            <ul>
                {paymentMethods.map(method => (
                    <li key={method.id}>
                        <button
                            className={`payment-button ${selectedPaymentMethod === method.id ? 'selected' : ''}`}
                            onClick={() => onSelectPaymentMethod(method.id)}
                        >
                            {method.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PaymentMethods;