export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export interface Vendor {
  id: string;
  name: string;
  dailySales: number;
  color: string;
}

export interface Sale {
  id: string;
  vendorId: string;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  timestamp: Date;
  receiptNumber: string;
}

export type PaymentMethod = 'cash' | 'card' | 'check' | 'multi';

export type TabType = "vendeuse" | "produits" | "reglements" | "diverses" | "annulation" | "ca" | "raz";

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  received?: number;
  change?: number;
}

export interface MiscItem {
  id: string;
  description: string;
  price: number;
}

// Couleurs de la charte graphique
export const THEME_COLORS = {
  primary: '#477A0C',      // Vert
  secondary: '#89BBFE',    // Bleu
  accent: '#D68FD6',       // Violet
  warning: '#F55D3E',      // Rouge/Orange
  neutral: '#F2EFE2',      // Beige
  dark: '#14281D',         // Vert foncé
  darkest: '#080F0F',      // Noir
} as const;
