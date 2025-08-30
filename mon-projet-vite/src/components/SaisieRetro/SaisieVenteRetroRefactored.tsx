/**
 * Composant de saisie de ventes rétroactives - Version modulaire
 * Permet d'ajouter des ventes avec une date personnalisée (ex: 29/08)
 */
import React from 'react';
import { useSaisieRetroState } from '../../hooks/SaisieRetro/useSaisieRetroState';
import { useSaisieRetroActions } from '../../hooks/SaisieRetro/useSaisieRetroActions';
import { SaisieRetroForm } from './SaisieRetroForm';
import { SaisieRetroSummary } from './SaisieRetroSummary';
import type { Vendor } from '../../types';

interface Props {
  vendors: Vendor[];              // liste vendeuses
  defaultVendorName?: string;     // optionnel
  eventStart?: number | null;     // timestamp début événement
  eventEnd?: number | null;       // timestamp fin événement
  onCreated?: () => void;         // callback post-création
}

export const SaisieVenteRetroRefactored: React.FC<Props> = ({
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

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      <h3
        style={{
          marginTop: 0,
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        📝 Saisie d'une vente datée
      </h3>

      <SaisieRetroForm
        formData={formData}
        updateFormData={updateFormData}
        vendors={vendors}
        minDate={dateConstraints.minDate}
        maxDate={dateConstraints.maxDate}
        saving={saving}
        onSave={handleSave}
      />

      <SaisieRetroSummary />
    </div>
  );
};
