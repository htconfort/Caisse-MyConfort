import { useCallback } from 'react';
import { createSale } from '../../services/salesService';
import type { SaisieRetroFormData } from './useSaisieRetroState';

interface UseSaisieRetroActionsProps {
  formData: SaisieRetroFormData;
  eventStart?: number | null;
  eventEnd?: number | null;
  setSaving: (saving: boolean) => void;
  resetForm: () => void;
  onCreated?: () => void;
}

export function useSaisieRetroActions({
  formData,
  eventStart,
  eventEnd,
  setSaving,
  resetForm,
  onCreated,
}: UseSaisieRetroActionsProps) {

  const validateForm = useCallback(() => {
    const { vendorName, amount, dateStr } = formData;
    
    // Validation du montant
    const numericAmount = Number(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Montant invalide');
    }

    // Validation vendeur
    if (!vendorName.trim()) {
      throw new Error('Vendeuse obligatoire');
    }

    // Validation date
    if (!dateStr) {
      throw new Error('Date obligatoire');
    }

    // Validation des bornes temporelles
    const saleDate = new Date(dateStr);
    saleDate.setHours(12, 0, 0, 0);
    const timestamp = saleDate.getTime();

    if (eventStart && timestamp < new Date(eventStart).setHours(0, 0, 0, 0)) {
      throw new Error('La date est avant le début de l\'événement.');
    }

    if (eventEnd && timestamp > new Date(eventEnd).setHours(23, 59, 59, 999)) {
      throw new Error('La date est après la fin de l\'événement.');
    }

    return { numericAmount, timestamp };
  }, [formData, eventStart, eventEnd]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      
      const { numericAmount, timestamp } = validateForm();
      
      await createSale({
        vendorName: formData.vendorName,
        totalAmount: numericAmount,
        paymentMethod: formData.paymentMethod,
        timestamp,
      });

      resetForm();
      
      if (onCreated) {
        onCreated();
      }

      const dateFormatted = new Date(timestamp).toLocaleDateString('fr-FR');
      alert(`✅ Vente enregistrée au ${dateFormatted} pour ${formData.vendorName}.`);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`❌ Erreur: ${message}`);
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, setSaving, resetForm, onCreated]);

  return {
    handleSave,
    validateForm,
  };
}
