import { useCallback } from 'react';
import { createSale } from '../../services/salesService';
import type { SaisieRetroFormData } from '../../types';

interface UseSaisieRetroActionsOptions {
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
}: UseSaisieRetroActionsOptions) {

  const validateForm = useCallback(() => {
    const { clientName, vendorName, productLabel, amount, date } = formData;
    
    // Validation du nom du client
    if (!clientName.trim()) {
      throw new Error('Nom du client obligatoire');
    }

    // Validation vendeur
    if (!vendorName.trim()) {
      throw new Error('Vendeuse obligatoire');
    }

    // Validation du produit
    if (!productLabel.trim()) {
      throw new Error('Libellé du produit obligatoire');
    }

    // Validation du montant
    const numericAmount = Number(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Montant invalide');
    }

    // Validation date
    if (!date) {
      throw new Error('Date obligatoire');
    }

    // Validation des bornes temporelles
    const saleDate = new Date(date);
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
      alert(`✅ Vente enregistrée au ${dateFormatted}\n` +
            `Client: ${formData.clientName}\n` +
            `Vendeuse: ${formData.vendorName}\n` +
            `Produit: ${formData.productLabel}\n` +
            `Montant: ${formData.amount}€`);
      
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
