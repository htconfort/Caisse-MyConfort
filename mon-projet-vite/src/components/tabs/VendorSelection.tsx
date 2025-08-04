import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import type { Vendor } from '../../types';

interface VendorSelectionProps {
  vendorStats: Vendor[];
  selectedVendor: Vendor | null;
  setSelectedVendor: (vendor: Vendor) => void;
  setActiveTab: (tab: 'produits') => void;
}

export const VendorSelection: React.FC<VendorSelectionProps> = ({
  vendorStats,
  selectedVendor,
  setSelectedVendor,
  setActiveTab
}) => {
  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--dark-green)' }}>
        {!selectedVendor ? 'Sélection de la vendeuse (OBLIGATOIRE)' : 'Sélection de la vendeuse'}
      </h2>
      {!selectedVendor && (
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#FEF3CD', border: '1px solid #F59E0B' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={20} style={{ color: '#D97706' }} />
            <h3 className="font-bold" style={{ color: '#D97706' }}>
              Sélection obligatoire
            </h3>
          </div>
          <p style={{ color: '#92400E' }}>
            Vous devez sélectionner une vendeuse avant de pouvoir utiliser les fonctionnalités de la caisse.
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {vendorStats.map(vendor => (
          <div
            key={vendor.id}
            onClick={() => {
              setSelectedVendor(vendor);
              setActiveTab('produits');
            }}
            className={`card cursor-pointer touch-feedback ${
              selectedVendor?.id === vendor.id ? 'ring-4 ring-white' : ''
            }`}
            style={{
              backgroundColor: vendor.color,
              color: 'white',
              padding: '16px',
              border: selectedVendor?.id === vendor.id ? '3px solid white' : '1px solid rgba(255,255,255,0.3)'
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className={`text-lg font-bold ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                {vendor.name}
              </h3>
              {selectedVendor?.id === vendor.id && (
                <Check size={20} color={['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'black' : 'white'} />
              )}
            </div>
            <div className="space-y-1">
              <p className={`text-xs opacity-90 ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                Ventes: <span className={`font-bold ${['Johan', 'Sabrina', 'Billy'].includes(vendor.name) ? 'vendor-black-text' : 'vendor-white-text'}`}>
                  {vendor.totalSales}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
