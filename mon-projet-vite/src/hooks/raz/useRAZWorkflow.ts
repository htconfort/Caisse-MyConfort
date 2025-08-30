import { useState, useEffect } from 'react';
import type { WorkflowSecurityState } from '../../components/raz/types';

export function useRAZWorkflow() {
  const [isViewed, setIsViewed] = useState(false);
  const [isPrinted, setIsPrinted] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [workflowCompleted, setWorkflowCompleted] = useState(false);

  // Mise à jour du workflow completed quand les 3 étapes sont faites
  useEffect(() => {
    setWorkflowCompleted(isViewed && isPrinted && isEmailSent);
  }, [isViewed, isPrinted, isEmailSent]);

  const effectuerVisualisation = () => {
    setIsViewed(true);
    console.log('✅ Visualisation effectuée');
  };

  const effectuerImpression = () => {
    if (!isViewed) {
      alert('Veuillez d\'abord visualiser la feuille de caisse.');
      return;
    }
    setIsPrinted(true);
    console.log('✅ Impression effectuée');
  };

  const effectuerEnvoiEmail = () => {
    if (!isPrinted) {
      alert('Veuillez d\'abord imprimer la feuille de caisse.');
      return;
    }
    setIsEmailSent(true);
    console.log('✅ Email envoyé');
  };

  const resetWorkflow = () => {
    setIsViewed(false);
    setIsPrinted(false);
    setIsEmailSent(false);
    setWorkflowCompleted(false);
  };

  const workflowState: WorkflowSecurityState = {
    isViewed,
    isPrinted,
    isEmailSent,
    workflowCompleted
  };

  return {
    workflowState,
    effectuerVisualisation,
    effectuerImpression,
    effectuerEnvoiEmail,
    resetWorkflow,
    // Setters directs si besoin
    setIsViewed,
    setIsPrinted,
    setIsEmailSent
  };
}
