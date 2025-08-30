import { useState, useMemo } from 'react';
import type { Vendor } from '../../types';

export interface SaisieRetroFormData {
  vendorName: string;
  amount: string;
  paymentMethod: 'card' | 'cash' | 'check' | 'multi';
  dateStr: string;
}

interface UseSaisieRetroStateProps {
  vendors: Vendor[];
  defaultVendorName?: string;
  eventStart?: number | null;
  eventEnd?: number | null;
}

export function useSaisieRetroState({
  vendors,
  defaultVendorName,
  eventStart,
  eventEnd,
}: UseSaisieRetroStateProps) {
  // État du formulaire
  const [formData, setFormData] = useState<SaisieRetroFormData>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    return {
      vendorName: defaultVendorName || vendors[0]?.name || '',
      amount: '',
      paymentMethod: 'card',
      dateStr: `${yyyy}-${mm}-${dd}`,
    };
  });

  const [saving, setSaving] = useState(false);

  // Contraintes de dates calculées
  const dateConstraints = useMemo(() => ({
    minDate: eventStart ? new Date(eventStart).toISOString().split('T')[0] : undefined,
    maxDate: eventEnd ? new Date(eventEnd).toISOString().split('T')[0] : undefined,
  }), [eventStart, eventEnd]);

  // Helpers pour mettre à jour le formulaire
  const updateFormData = (updates: Partial<SaisieRetroFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData(prev => ({
      ...prev,
      amount: '',
    }));
  };

  return {
    formData,
    updateFormData,
    resetForm,
    saving,
    setSaving,
    dateConstraints,
    vendors,
  };
}
