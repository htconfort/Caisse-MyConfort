import React from 'react';
import { Calendar, Clock, User, Package } from 'lucide-react';
import type { Vendor } from '../../types';
import { useSaisieRetroState } from '../../hooks/SaisieRetro/useSaisieRetroState';
import { useSaisieRetroActionsWithToasts } from '../../hooks/SaisieRetro/useSaisieRetroActionsWithToasts';
import { useSaisieRetroValidation } from '../../hooks/SaisieRetro/useSaisieRetroValidation';
import { useToasts } from '../../hooks/useToasts';
import { ToastContainer } from '../common/Toast';
import { SaisieRetroForm } from './SaisieRetroForm';

interface SaisieRetroSystemAdvancedProps {
  vendors: Vendor[];
  defaultVendorName?: string;
  eventStart?: number | null;
  eventEnd?: number | null;
  onCreated?: () => void;
}

export const SaisieRetroSystemAdvanced: React.FC<SaisieRetroSystemAdvancedProps> = ({
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

  const { toasts, removeToast, success, error } = useToasts();

  const { isValid, errors, getFieldError } = useSaisieRetroValidation({
    formData,
    eventStart,
    eventEnd,
  });

  const { handleSave } = useSaisieRetroActionsWithToasts({
    formData,
    eventStart,
    eventEnd,
    setSaving,
    resetForm,
    onCreated,
    showToast: (type, title, message) => {
      if (type === 'success') {
        success(title, message);
      } else if (type === 'error') {
        error(title, message);
      }
    },
  });

  const containerStyle = {
    padding: '16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    maxWidth: '600px',
    margin: '0 auto',
    position: 'relative' as const,
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

  const validationSummaryStyle = {
    padding: '8px',
    borderRadius: '6px',
    marginBottom: '12px',
    fontSize: '12px',
  };

  return (
    <>
      <div style={containerStyle}>
        {/* En-tête avec icône */}
        <div style={headerStyle}>
          <Clock size={18} />
          <span>Saisie Rétroactive Avancée</span>
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

        {/* Résumé de validation */}
        {errors.length > 0 && (
          <div 
            style={{
              ...validationSummaryStyle,
              backgroundColor: '#FEF2F2',
              borderLeft: '3px solid #EF4444',
              color: '#991B1B',
            }}
          >
            <strong>Erreurs de validation :</strong>
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {isValid && (
          <div 
            style={{
              ...validationSummaryStyle,
              backgroundColor: '#F0FDF4',
              borderLeft: '3px solid #10B981',
              color: '#166534',
            }}
          >
            ✅ Formulaire valide - Prêt à enregistrer !
          </div>
        )}

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

        {/* Indicateurs de validation par champ */}
        <div style={{ marginTop: '12px', fontSize: '11px', color: '#6B7280' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              Client: {getFieldError('clientName') ? '❌' : '✅'} 
              {getFieldError('clientName') && <span style={{ color: '#EF4444' }}> {getFieldError('clientName')}</span>}
            </div>
            <div>
              Produit: {getFieldError('productLabel') ? '❌' : '✅'}
              {getFieldError('productLabel') && <span style={{ color: '#EF4444' }}> {getFieldError('productLabel')}</span>}
            </div>
            <div>
              Vendeur: {getFieldError('vendorName') ? '❌' : '✅'}
              {getFieldError('vendorName') && <span style={{ color: '#EF4444' }}> {getFieldError('vendorName')}</span>}
            </div>
            <div>
              Montant: {getFieldError('amount') ? '❌' : '✅'}
              {getFieldError('amount') && <span style={{ color: '#EF4444' }}> {getFieldError('amount')}</span>}
            </div>
          </div>
          <div style={{ marginTop: '4px' }}>
            Date: {getFieldError('date') ? '❌' : '✅'}
            {getFieldError('date') && <span style={{ color: '#EF4444' }}> {getFieldError('date')}</span>}
          </div>
        </div>
      </div>

      {/* Container de toasts */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};
