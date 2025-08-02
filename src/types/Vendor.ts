export interface Vendor {
    id: string;
    name: string;
    sales: number;
    commissionRate: number;
    totalSales: number;
    salesHistory: Sale[];
}