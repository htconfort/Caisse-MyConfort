import { useState } from 'react';
import { Payment } from '../types/Payment';

const usePayment = () => {
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [isPaymentComplete, setIsPaymentComplete] = useState<boolean>(false);
    const [paymentDetails, setPaymentDetails] = useState<Payment | null>(null);

    const handlePaymentMethodChange = (method: string) => {
        setPaymentMethod(method);
    };

    const processPayment = (amount: number) => {
        if (amount <= 0) {
            throw new Error('Invalid payment amount');
        }
        setAmountPaid(amount);
        setIsPaymentComplete(true);
        setPaymentDetails({ method: paymentMethod, amount });
    };

    const resetPayment = () => {
        setPaymentMethod('cash');
        setAmountPaid(0);
        setIsPaymentComplete(false);
        setPaymentDetails(null);
    };

    return {
        paymentMethod,
        amountPaid,
        isPaymentComplete,
        paymentDetails,
        handlePaymentMethodChange,
        processPayment,
        resetPayment,
    };
};

export default usePayment;