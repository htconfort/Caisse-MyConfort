import { useState, useMemo } from 'react';
import type { Vendor, SaisieRetroFormData } from '../../types';

interface UseSaisieRetroStateOptions {
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
}: UseSaisieRetroStateOptions) {
  const [formData, setFormData] = useState<SaisieRetroFormData>({
    clientName: '',
    vendorName: defaultVendorName || vendors[0]?.name || '',
    productLabel: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [saving, setSaving] = useState(false);

  const updateFormData = (key: keyof SaisieRetroFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      vendorName: defaultVendorName || vendors[0]?.name || '',
      productLabel: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const dateConstraints = useMemo(() => {
    const today = new Date();
    const minDate = eventStart ? new Date(eventStart) : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    const maxDate = eventEnd ? new Date(eventEnd) : today;
    return {
      minDate: minDate.toISOString().split('T')[0],
      maxDate: maxDate.toISOString().split('T')[0],
    };
  }, [eventStart, eventEnd]);

  return {
    formData,
    updateFormData,
    resetForm,
    saving,
    setSaving,
    dateConstraints,
  };
}
