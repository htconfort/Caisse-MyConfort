import { useCallback } from 'react';
import { createSale } from '../../services/salesService';
import type { SaisieRetroFormData } from '../../types';
import { validateCompleteSaisieRetro } from '../../utils/saisieRetroValidation';
import type { ToastType } from '../../hooks/useToasts';

interface UseSaisieRetroActionsWithToastsOptions {
  formData: SaisieRetroFormData;
  eventStart?: number | null;
  eventEnd?: number | null;
  setSaving: (saving: boolean) => void;
  resetForm: () => void;
  onCreated?: () => void;
  showToast?: (type: ToastType, title: string, message?: string) => void;
}

export function useSaisieRetroActionsWithToasts({
  formData,
  eventStart,
  eventEnd,
  setSaving,
  resetForm,
  onCreated,
  showToast,
}: UseSaisieRetroActionsWithToastsOptions) {

  const validateForm = useCallback(() => {
    // Utilisation de la nouvelle validation modulaire
    const errors = validateCompleteSaisieRetro(formData, eventStart, eventEnd);
    
    if (errors.length > 0) {
      throw new Error(errors.join('\n• '));
    }

    // Si validation OK, calculer les valeurs nécessaires
    const numericAmount = Number(formData.amount.replace(',', '.'));
    const saleDate = new Date(formData.date);
    saleDate.setHours(12, 0, 0, 0);
    const timestamp = saleDate.getTime();

    return { numericAmount, timestamp };
  }, [formData, eventStart, eventEnd]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      
      const { numericAmount, timestamp } = validateForm();
      
      // Création d'une vente avec les nouvelles données enrichies
      await createSale({
        vendorName: formData.vendorName,
        totalAmount: numericAmount,
        paymentMethod: 'card', // Méthode par défaut
        timestamp,
        // Informations additionnelles (commentaire ou métadonnées)
        note: `Client: ${formData.clientName} - Produit: ${formData.productLabel}`,
      });

      resetForm();
      
      if (onCreated) {
        onCreated();
      }

      const dateFormatted = new Date(timestamp).toLocaleDateString('fr-FR');
      
      // Utilisation des toasts si disponible, sinon fallback vers alert
      if (showToast) {
        showToast(
          'success',
          'Vente enregistrée avec succès !',
          `${formData.clientName} • ${formData.productLabel} • ${formData.amount}€ • ${dateFormatted}`
        );
      } else {
        alert(`✅ Vente enregistrée au ${dateFormatted}\n` +
              `Client: ${formData.clientName}\n` +
              `Vendeuse: ${formData.vendorName}\n` +
              `Produit: ${formData.productLabel}\n` +
              `Montant: ${formData.amount}€`);
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      // Utilisation des toasts si disponible, sinon fallback vers alert
      if (showToast) {
        showToast(
          'error',
          'Erreur lors de l\'enregistrement',
          message.replace(/\n• /g, ' • ')
        );
      } else {
        alert(`❌ Erreur: ${message}`);
      }
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, setSaving, resetForm, onCreated, showToast]);

  return {
    handleSave,
    validateForm,
  };
}
