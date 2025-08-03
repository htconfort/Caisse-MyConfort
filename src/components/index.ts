// Export des composants principaux avec charte graphique MyConfort
export { default as TabNavigation } from './common/TabNavigation';
export { default as VendorSelector } from './vendor/VendorSelector';
export { default as ProductGrid } from './products/ProductGrid';
export { default as CartSummary } from './cart/CartSummary';
export { default as PaymentModal } from './payment/PaymentModal';
export { default as MiscLine } from './common/MiscLine';
export { default as SalesHistory } from './sales/SalesHistory';
export { default as ResetModal } from './common/ResetModal';
export { default as SalesExport } from './sales/SalesExport';
export { default as SalesReport } from './sales/SalesReport';

// Alias pour compatibilité avec App.tsx
export { default as CashierTabs } from './common/TabNavigation';
export { default as ProductMenu } from './products/ProductGrid';
export { default as Cart } from './cart/CartSummary';
export { default as ExportButtons } from './sales/SalesExport';
export { default as CAInstantane } from './sales/SalesReport';
