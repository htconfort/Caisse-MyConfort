import React, { useState, useEffect } from 'react';
import { Vendor, THEME_COLORS } from '../../types';

const VendorSelector: React.FC = () => {
  const [vendors] = useState<Vendor[]>([
    { 
      id: '1', 
      name: 'Marie Dupont', 
      dailySales: 0, 
      color: THEME_COLORS.primary 
    },
    { 
      id: '2', 
      name: 'Sophie Martin', 
      dailySales: 0, 
      color: THEME_COLORS.secondary 
    },
    { 
      id: '3', 
      name: 'Claire Bernard', 
      dailySales: 0, 
      color: THEME_COLORS.accent 
    },
    { 
      id: '4', 
      name: 'Emma Rousseau', 
      dailySales: 0, 
      color: THEME_COLORS.dark 
    },
  ]);
  
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [vendorStats, setVendorStats] = useState<Record<string, number>>({});

  useEffect(() => {
    const saved = localStorage.getItem('selectedVendor');
    if (saved) setSelectedVendor(saved);
    
    const stats = localStorage.getItem('vendorStats');
    if (stats) setVendorStats(JSON.parse(stats));
  }, []);

  const handleVendorChange = (vendorId: string) => {
    setSelectedVendor(vendorId);
    localStorage.setItem('selectedVendor', vendorId);
  };

  const getVendorSales = (vendorId: string) => {
    return vendorStats[vendorId] || 0;
  };

  const totalDailySales = Object.values(vendorStats).reduce((sum, sales) => sum + sales, 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        👤 <span>Sélection Vendeuse</span>
      </h2>
      
      {/* Statistiques globales */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6 border border-blue-100">
        <div className="text-center">
          <div className="text-sm text-blue-600 font-medium">
            Chiffre d'affaires total du jour
          </div>
          <div className="text-3xl font-bold text-blue-800">
            {totalDailySales.toFixed(2)}€
          </div>
        </div>
      </div>
      
      {/* Grille des vendeuses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {vendors.map((vendor) => {
          const isSelected = selectedVendor === vendor.id;
          const sales = getVendorSales(vendor.id);
          
          return (
            <button
              key={vendor.id}
              onClick={() => handleVendorChange(vendor.id)}
              className={`
                p-6 rounded-xl border-2 transition-all duration-200 touch-manipulation
                transform hover:scale-105 active:scale-95 shadow-md
                ${isSelected 
                  ? `border-blue-400 bg-blue-50 ring-2 ring-blue-200` 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }
              `}
            >
              <div className="text-center">
                {/* Avatar coloré */}
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: vendor.color }}
                >
                  {vendor.name.split(' ').map(n => n[0]).join('')}
                </div>
                
                {/* Nom */}
                <div className="font-semibold text-gray-800 mb-2">
                  {vendor.name}
                </div>
                
                {/* CA du jour */}
                <div className="text-sm text-gray-600 mb-1">
                  CA jour:
                </div>
                <div className="text-lg font-bold text-green-600">
                  {sales.toFixed(2)}€
                </div>
                
                {/* Indicateur de sélection */}
                {isSelected && (
                  <div className="mt-3 text-blue-600 font-medium">
                    ✅ Sélectionnée
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Informations de la vendeuse sélectionnée */}
      {selectedVendor && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
              style={{ 
                backgroundColor: vendors.find(v => v.id === selectedVendor)?.color || THEME_COLORS.primary 
              }}
            >
              {vendors.find(v => v.id === selectedVendor)?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-green-800 font-semibold">
                Vendeuse active: {vendors.find(v => v.id === selectedVendor)?.name}
              </p>
              <p className="text-green-600 text-sm">
                Toutes les ventes seront attribuées à cette vendeuse
              </p>
            </div>
          </div>
        </div>
      )}

      {!selectedVendor && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-yellow-800 font-semibold">
                Aucune vendeuse sélectionnée
              </p>
              <p className="text-yellow-600 text-sm">
                Veuillez sélectionner une vendeuse pour commencer les ventes
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorSelector;