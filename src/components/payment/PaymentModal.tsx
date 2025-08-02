import React, { useState } from 'react';
import Modal from '../common/Modal';
import PaymentMethods from './PaymentMethods';
import PaymentSummary from './PaymentSummary';
import { Payment } from '../../types/Payment';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentComplete: (payment: Payment) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, totalAmount, onPaymentComplete }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  const handlePayment = () => {
    if (selectedPaymentMethod && amountPaid >= totalAmount) {
      const payment: Payment = {
        method: selectedPaymentMethod,
        amount: amountPaid,
      };
      onPaymentComplete(payment);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Paiement</h2>
      <PaymentMethods 
        selectedMethod={selectedPaymentMethod} 
        onSelectMethod={setSelectedPaymentMethod} 
      />
      <PaymentSummary totalAmount={totalAmount} amountPaid={amountPaid} />
      <input 
        type="number" 
        value={amountPaid} 
        onChange={(e) => setAmountPaid(Number(e.target.value))} 
        placeholder="Montant payé" 
      />
      <button onClick={handlePayment}>Finaliser le paiement</button>
    </Modal>
  );
};

export default PaymentModal;