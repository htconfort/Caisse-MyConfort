import React from 'react';
import { Calendar, Clock, User, Package } from 'lucide-react';
import type { Vendor } from '../../types';
import { useSaisieRetroState } from '../../hooks/SaisieRetro/useSaisieRetroState';
import { useSaisieRetroActions } from '../../hooks/SaisieRetro/useSaisieRetroActions';
import { SaisieRetroForm } from './SaisieRetroForm';

interface SaisieRetroSystemProps {
  vendors: Vendor[];
  defaultVendorName?: string;
  eventStart?: number | null;
  eventEnd?: number | null;
  onCreated?: () => void;
}

export const SaisieRetroSystem: React.FC<SaisieRetroSystemProps> = ({
  vendors,
  defaultVendorName,
  eventStart,
  eventEnd,
  onCreated,
}) => {
  const {
    formData,
    updateFormData,
    resetForm,
    saving,
    setSaving,
    dateConstraints,
  } = useSaisieRetroState({
    vendors,
    defaultVendorName,
    eventStart,
    eventEnd,
  });

  const { handleSave } = useSaisieRetroActions({
    formData,
    eventStart,
    eventEnd,
    setSaving,
    resetForm,
    onCreated,
  });

  const containerStyle = {
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    maxWidth: '600px',
    margin: '0 auto',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    color: '#111827',
    fontSize: '16px',
    fontWeight: '600',
  };

  const infoStyle = {
    fontSize: '12px',
    color: '#6B7280',
    padding: '8px',
    backgroundColor: '#EFF6FF',
    borderRadius: '6px',
    borderLeft: '3px solid #3B82F6',
    marginBottom: '16px',
    lineHeight: '1.4',
  };

  return (
    <div style={containerStyle}>
      {/* En-tête avec icône */}
      <div style={headerStyle}>
        <Clock size={18} />
        <span>Saisie Rétroactive</span>
      </div>

      {/* Information contextuelle */}
      <div style={infoStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <Calendar size={14} />
          <strong>Période autorisée :</strong>
        </div>
        Du {dateConstraints.minDate} au {dateConstraints.maxDate}
        <br />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <User size={14} />
          <span><strong>Client :</strong> Nom obligatoire pour traçabilité</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <Package size={14} />
          <span><strong>Produit :</strong> Description du service/produit vendu</span>
        </div>
      </div>

      {/* Formulaire de saisie */}
      <SaisieRetroForm
        formData={formData}
        updateFormData={updateFormData}
        vendors={vendors}
        minDate={dateConstraints.minDate}
        maxDate={dateConstraints.maxDate}
        saving={saving}
        onSave={handleSave}
      />
    </div>
  );
};
