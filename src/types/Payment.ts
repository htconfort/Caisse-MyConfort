export interface Payment {
    id: string;
    amount: number;
    method: 'cash' | 'credit_card' | 'check' | 'multi_payment';
    date: Date;
    vendorId: string;
    saleId: string;
}