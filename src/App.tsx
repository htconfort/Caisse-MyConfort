import React, { useState } from "react";
import CashierTabs from "./components/common/TabNavigation";
import VendorSelector from "./components/vendor/VendorSelector";
import ProductMenu from "./components/products/ProductGrid";
import Cart from "./components/cart/CartSummary";
import PaymentModal from "./components/payment/PaymentModal";
import MiscLine from "./components/common/MiscLine";
import SalesHistory from "./components/sales/SalesHistory";
import ResetModal from "./components/common/ResetModal";
import ExportButtons from "./components/sales/SalesExport";
import CAInstantane from "./components/sales/SalesReport";
import { useCart } from "./hooks/useCart";
import { CatalogProduct } from "./data/productCatalog";
import './App.css';

const App: React.FC = () => {
  const [tab, setTab] = useState<"vendeuse"|"produits"|"reglements"|"diverses"|"annulation"|"ca"|"raz">("vendeuse");
  const { addToCart } = useCart();

  const handleAddProduct = (product: CatalogProduct) => {
    // Convertir le produit du catalogue vers le format attendu par le panier
    const cartProduct = {
      id: product.name.replace(/\s+/g, '-').toLowerCase(), // ID unique basé sur le nom
      name: product.name,
      price: product.priceTTC,
      category: product.category.toLowerCase()
    };
    addToCart(cartProduct);
  };
  
  return (
    <div className="bg-gradient-to-br from-[#F2EFE2] to-white min-h-screen w-full max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#14281D] drop-shadow-sm">
        🛒 Caisse MyConfort - iPad
      </h1>
      
      <CashierTabs currentTab={tab} onChange={setTab} />
      
      <div className="mt-6">
        {tab === "vendeuse" && <VendorSelector />}
        {tab === "produits" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProductMenu onAdd={handleAddProduct} />
            </div>
            <div>
              <Cart onNavigateToPayment={() => setTab("reglements")} />
            </div>
          </div>
        )}
        {tab === "reglements" && <PaymentModal />}
        {tab === "diverses" && <MiscLine />}
        {tab === "annulation" && <Cart annulation />}
        {tab === "ca" && <CAInstantane />}
        {tab === "raz" && <ResetModal />}
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
        <ExportButtons />
        <SalesHistory />
      </div>
    </div>
  );
};

export default App;