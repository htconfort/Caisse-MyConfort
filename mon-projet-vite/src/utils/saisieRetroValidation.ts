import type { SaisieRetroFormData } from '../types';

/**
 * Valide les champs obligatoires pour la saisie d'une vente rétroactive.
 * Retourne une liste d'erreurs détaillées pour chaque champ invalide.
 */
export function validateSaisieRetro(formData: SaisieRetroFormData): string[] {
  const errors: string[] = [];

  // Validation du nom du client
  if (!formData.clientName || formData.clientName.trim() === '') {
    errors.push("Nom du client requis");
  } else if (formData.clientName.trim().length < 2) {
    errors.push("Nom du client trop court (minimum 2 caractères)");
  }

  // Validation du nom du vendeur
  if (!formData.vendorName || formData.vendorName.trim() === '') {
    errors.push("Nom du vendeur requis");
  }

  // Validation du libellé produit
  if (!formData.productLabel || formData.productLabel.trim() === '') {
    errors.push("Produit requis");
  } else if (formData.productLabel.trim().length < 3) {
    errors.push("Description du produit trop courte (minimum 3 caractères)");
  }

  // Validation du montant
  if (!formData.amount || formData.amount.trim() === '') {
    errors.push("Montant requis");
  } else {
    const numericAmount = Number(formData.amount.replace(',', '.'));
    if (isNaN(numericAmount)) {
      errors.push("Montant invalide (doit être un nombre)");
    } else if (numericAmount <= 0) {
      errors.push("Montant invalide (doit être positif)");
    } else if (numericAmount > 10000) {
      errors.push("Montant trop élevé (maximum 10 000€)");
    }
  }

  // Validation de la date
  if (!formData.date) {
    errors.push("Date requise");
  } else {
    const dateValue = new Date(formData.date);
    if (isNaN(dateValue.getTime())) {
      errors.push("Format de date invalide");
    }
  }

  return errors;
}

/**
 * Valide la cohérence temporelle avec les contraintes d'événement.
 */
export function validateDateConstraints(
  date: string,
  eventStart?: number | null,
  eventEnd?: number | null
): string[] {
  const errors: string[] = [];

  if (!date) {
    return errors; // La validation de base gère déjà ce cas
  }

  const saleDate = new Date(date);
  saleDate.setHours(12, 0, 0, 0);
  const timestamp = saleDate.getTime();

  if (eventStart && timestamp < new Date(eventStart).setHours(0, 0, 0, 0)) {
    const startDate = new Date(eventStart).toLocaleDateString('fr-FR');
    errors.push(`La date est avant le début de l'événement (${startDate})`);
  }

  if (eventEnd && timestamp > new Date(eventEnd).setHours(23, 59, 59, 999)) {
    const endDate = new Date(eventEnd).toLocaleDateString('fr-FR');
    errors.push(`La date est après la fin de l'événement (${endDate})`);
  }

  return errors;
}

/**
 * Validation complète combinant les validations de base et les contraintes temporelles.
 */
export function validateCompleteSaisieRetro(
  formData: SaisieRetroFormData,
  eventStart?: number | null,
  eventEnd?: number | null
): string[] {
  const baseErrors = validateSaisieRetro(formData);
  const dateErrors = validateDateConstraints(formData.date, eventStart, eventEnd);
  
  return [...baseErrors, ...dateErrors];
}

/**
 * Retourne true si toutes les validations passent, false sinon.
 */
export function isValidSaisieRetro(
  formData: SaisieRetroFormData,
  eventStart?: number | null,
  eventEnd?: number | null
): boolean {
  return validateCompleteSaisieRetro(formData, eventStart, eventEnd).length === 0;
}
