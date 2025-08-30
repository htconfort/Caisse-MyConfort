import { useMemo } from 'react';
import type { SaisieRetroFormData } from '../../types';
import { validateCompleteSaisieRetro, isValidSaisieRetro } from '../../utils/saisieRetroValidation';

interface UseSaisieRetroValidationOptions {
  formData: SaisieRetroFormData;
  eventStart?: number | null;
  eventEnd?: number | null;
}

export function useSaisieRetroValidation({
  formData,
  eventStart,
  eventEnd,
}: UseSaisieRetroValidationOptions) {
  
  // Validation en temps réel
  const errors = useMemo(() => {
    return validateCompleteSaisieRetro(formData, eventStart, eventEnd);
  }, [formData, eventStart, eventEnd]);

  // État de validité global
  const isValid = useMemo(() => {
    return isValidSaisieRetro(formData, eventStart, eventEnd);
  }, [formData, eventStart, eventEnd]);

  // Erreurs par champ pour affichage spécifique
  const fieldErrors = useMemo(() => {
    const fieldErrorMap: Record<string, string[]> = {
      clientName: [],
      vendorName: [],
      productLabel: [],
      amount: [],
      date: [],
    };

    errors.forEach(error => {
      if (error.includes('client')) {
        fieldErrorMap.clientName.push(error);
      } else if (error.includes('vendeur')) {
        fieldErrorMap.vendorName.push(error);
      } else if (error.includes('produit') || error.includes('Produit')) {
        fieldErrorMap.productLabel.push(error);
      } else if (error.includes('montant') || error.includes('Montant')) {
        fieldErrorMap.amount.push(error);
      } else if (error.includes('date') || error.includes('Date')) {
        fieldErrorMap.date.push(error);
      }
    });

    return fieldErrorMap;
  }, [errors]);

  // Vérifie si un champ spécifique est valide
  const isFieldValid = (fieldName: keyof SaisieRetroFormData) => {
    return fieldErrors[fieldName].length === 0;
  };

  // Obtient la première erreur d'un champ
  const getFieldError = (fieldName: keyof SaisieRetroFormData) => {
    return fieldErrors[fieldName][0] || null;
  };

  return {
    errors,           // Liste complète des erreurs
    isValid,          // true si le formulaire est valide
    fieldErrors,      // Erreurs par champ
    isFieldValid,     // Fonction pour vérifier un champ
    getFieldError,    // Fonction pour obtenir l'erreur d'un champ
  };
}
