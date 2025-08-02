export interface Sale {
    id: string; // Unique identifier for the sale
    vendorId: string; // Identifier for the vendor making the sale
    items: Array<{
        productId: string; // Identifier for the product sold
        quantity: number; // Quantity of the product sold
        price: number; // Price of the product at the time of sale
    }>;
    totalAmount: number; // Total amount for the sale
    paymentMethod: 'cash' | 'card' | 'check' | 'multi'; // Payment method used
    date: Date; // Date and time of the sale
    canceled: boolean; // Indicates if the sale was canceled
}