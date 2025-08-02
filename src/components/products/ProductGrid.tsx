import React from "react";
import { productCatalog, productCategories, CatalogProduct } from "../../data/productCatalog";

export default function ProductMenu({ onAdd }: { onAdd?: (p: CatalogProduct) => void }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        🛍️ <span>Catalogue Produits</span>
      </h2>
      
      {productCategories.map((cat) => (
        <div key={cat} className="mb-6">
          <h3 className="text-xl font-semibold text-[#477A0C] mb-4 pb-2 border-b-2 border-[#477A0C]/20">
            {cat}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {productCatalog
              .filter((p) => p.category === cat)
              .map((p) => (
                <button
                  key={p.name}
                  className={`
                    bg-white shadow-md px-4 py-3 rounded-lg border-2 transition-all duration-200
                    min-h-[80px] flex flex-col items-start justify-center touch-manipulation
                    transform hover:scale-[1.02] active:scale-[0.98]
                    ${p.priceTTC === 0 
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-70' 
                      : 'border-gray-200 hover:border-[#477A0C] hover:bg-green-50 cursor-pointer'
                    }
                  `}
                  onClick={() => onAdd && p.priceTTC > 0 && onAdd(p)}
                  disabled={p.priceTTC === 0}
                >
                  <span className={`font-medium text-left leading-tight ${
                    p.priceTTC === 0 ? 'text-gray-500' : 'text-gray-800'
                  }`}>
                    {p.name}
                    {p.priceTTC === 0 && <span className="ml-2 text-xs">🔒</span>}
                  </span>
                  <span className="text-sm mt-1">
                    {p.priceTTC > 0 ? (
                      <span className="text-[#477A0C] font-bold">
                        {p.priceTTC.toFixed(2)} € TTC
                      </span>
                    ) : (
                      <span className="text-red-400 text-xs font-medium">
                        Non vendu seul
                      </span>
                    )}
                  </span>
                </button>
              ))}
          </div>
        </div>
      ))}
      
      {/* Statistiques du catalogue */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">
            📊 Catalogue MyConfort
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Total produits:</span>
              <div className="text-lg font-bold text-[#477A0C]">
                {productCatalog.length}
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700">Catégories:</span>
              <div className="text-lg font-bold text-[#477A0C]">
                {productCategories.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}