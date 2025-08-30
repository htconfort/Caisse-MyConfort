import React from 'react';
import type { Vendor, SaisieRetroFormData } from '../../types';

interface SaisieRetroFormProps {
  formData: SaisieRetroFormData;
  updateFormData: (key: keyof SaisieRetroFormData, value: string) => void;
  vendors: Vendor[];
  minDate?: string;
  maxDate?: string;
  saving: boolean;
  onSave: () => void;
}

export const SaisieRetroForm: React.FC<SaisieRetroFormProps> = ({
  formData,
  updateFormData,
  vendors,
  minDate,
  maxDate,
  saving,
  onSave,
}) => {
  const inputStyle = {
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    outline: 'none',
  };

  const buttonStyle = {
    padding: '10px 16px',
    borderRadius: '6px',
    border: 'none',
    background: '#111827',
    color: '#fff',
    fontWeight: '700',
    cursor: saving ? 'not-allowed' : 'pointer',
    opacity: saving ? 0.7 : 1,
  };

  return (
    <>
      {/* Première ligne : Client et Produit */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <input
          type="text"
          placeholder="Nom du client"
          value={formData.clientName}
          onChange={(e) => updateFormData('clientName', e.target.value)}
          style={inputStyle}
        />

        <input
          type="text"
          placeholder="Produit/Service"
          value={formData.productLabel}
          onChange={(e) => updateFormData('productLabel', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Deuxième ligne : Vendeuse, Montant, Date */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        {/* Sélection vendeuse */}
        <select
          value={formData.vendorName}
          onChange={(e) => updateFormData('vendorName', e.target.value)}
          style={inputStyle}
        >
          {vendors.map((vendor) => (
            <option key={vendor.id ?? vendor.name} value={vendor.name}>
              {vendor.name}
            </option>
          ))}
        </select>

        {/* Montant */}
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="Montant (€)"
          value={formData.amount}
          onChange={(e) => updateFormData('amount', e.target.value)}
          style={inputStyle}
        />

        {/* Date */}
        <input
          type="date"
          value={formData.date}
          onChange={(e) => updateFormData('date', e.target.value)}
          min={minDate}
          max={maxDate}
          style={inputStyle}
        />
      </div>

      {/* Bouton de sauvegarde */}
      <div style={{ marginBottom: '8px' }}>
        <button onClick={onSave} disabled={saving} style={buttonStyle}>
          {saving ? 'Enregistrement…' : 'Enregistrer la vente'}
        </button>
      </div>
    </>
  );
};
