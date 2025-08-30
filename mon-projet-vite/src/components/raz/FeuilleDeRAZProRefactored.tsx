import React, { useState } from 'react';
import { RAZGuardModal } from '../RAZGuardModal';
import { useRAZGuardSetting } from '../../hooks/useRAZGuardSetting';

// Composants modulaires
import RAZHeader from './RAZHeader';
import RAZSummaryCard from './RAZSummaryCard';
import RAZSalesTable from './RAZSalesTable';
import RAZPendingPayments from './RAZPendingPayments';
import RAZActionsFooter from './RAZActionsFooter';

// Hooks personnalisés
import { useRAZSession } from '../../hooks/raz/useRAZSession';
import { useRAZCalculs } from '../../hooks/raz/useRAZCalculs';
import { useRAZWorkflow } from '../../hooks/raz/useRAZWorkflow';
import { useRAZPendingPayments } from '../../hooks/raz/useRAZPendingPayments';

// Types
import type { FeuilleDeRAZProProps } from './types';

function FeuilleDeRAZProRefactored({ sales, vendorStats, exportDataBeforeReset, executeRAZ }: Omit<FeuilleDeRAZProProps, 'invoices'>) {
  // ===== HOOKS PERSONNALISÉS =====
  const sessionHook = useRAZSession();
  const calculs = useRAZCalculs(sales, vendorStats);
  const workflowHook = useRAZWorkflow();
  const pendingPaymentsHook = useRAZPendingPayments();

  // ===== ÉTATS LOCAUX =====
  const [modeApercu, setModeApercu] = useState(false);

  // ===== RAZ GUARD MODAL =====
  const { mode: razGuardMode, ready: razGuardReady } = useRAZGuardSetting("daily");

  // ===== GESTION DES ACTIONS =====
  const effectuerRAZComplet = () => {
    workflowHook.resetWorkflow();
    pendingPaymentsHook.refreshPendingPayments();
    sessionHook.refreshSession();
    executeRAZ();
  };

  const imprimer = () => {
    workflowHook.effectuerImpression();
    window.print();
  };

  const envoyerEmail = () => {
    workflowHook.effectuerEnvoiEmail();
    // TODO: Logique d'envoi email
    console.log('📧 Email envoyé');
  };

  const genererRapportWhatsApp = () => {
    // TODO: Intégration WhatsApp
    console.log('📱 Rapport WhatsApp généré');
  };

  // ===== RENDU =====
  return (
    <div style={{ 
      fontFamily: 'Inter, system-ui, sans-serif',
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: '#FAFAFA',
      minHeight: '100vh'
    }}>
      {/* En-tête avec gestion de session */}
      <RAZHeader
        session={sessionHook.session}
        sessLoading={sessionHook.sessLoading}
        openingSession={sessionHook.openingSession}
        eventName={sessionHook.eventName}
        eventStart={sessionHook.eventStart}
        eventEnd={sessionHook.eventEnd}
        savingEvent={sessionHook.savingEvent}
        eventSaved={sessionHook.eventSaved}
        hasUnsavedEventChanges={sessionHook.hasUnsavedEventChanges}
        canEndSessionToday={sessionHook.canEndSessionToday}
        isTodayFirstDayOf={sessionHook.isTodayFirstDayOf}
        setEventName={sessionHook.setEventName}
        setEventStart={sessionHook.setEventStart}
        setEventEnd={sessionHook.setEventEnd}
        setEventSaved={sessionHook.setEventSaved}
        openSession={sessionHook.openSession}
        closeSession={sessionHook.closeSession}
        onSaveEventFirstDay={sessionHook.onSaveEventFirstDay}
      />

      {/* Récapitulatif financier */}
      <RAZSummaryCard calculs={calculs} />

      {/* Tableau détaillé des ventes par vendeuse */}
      <RAZSalesTable venteursAvecDetail={calculs.venteursAvecDetail} />

      {/* Règlements à venir */}
      <RAZPendingPayments 
        reglementsData={pendingPaymentsHook.reglementsData}
      />

      {/* Actions principales - Footer collant */}
      <RAZActionsFooter
        workflowState={workflowHook.workflowState}
        onView={workflowHook.effectuerVisualisation}
        onPrint={imprimer}
        onEmail={envoyerEmail}
        onWhatsApp={genererRapportWhatsApp}
        onRAZ={effectuerRAZComplet}
        onExportBeforeReset={exportDataBeforeReset}
        modeApercu={modeApercu}
        setModeApercu={setModeApercu}
        razGuardReady={razGuardReady}
        setShowRAZGuardModal={() => {/* Géré directement par RAZGuardModal */}}
      />

      {/* Modales */}
      <RAZGuardModal
        isViewed={workflowHook.workflowState.isViewed}
        isPrinted={workflowHook.workflowState.isPrinted}
        isEmailSent={workflowHook.workflowState.isEmailSent}
        onAcknowledge={effectuerRAZComplet}
        showMode={razGuardMode}
        sessionId={sessionHook.session?.id?.toString() || 'default'}
      />

      {/* Mode aperçu - peut être extrait dans un composant séparé si nécessaire */}
      {modeApercu && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 30,
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: '#374151' }}>📄 Aperçu Feuille de Caisse</h2>
              <button 
                onClick={() => setModeApercu(false)}
                style={{
                  marginTop: 10,
                  padding: '8px 16px',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Fermer l'aperçu
              </button>
            </div>
            
            {/* Contenu de l'aperçu - version simplifiée */}
            <div style={{ color: '#374151' }}>
              <h3>📊 Résumé des ventes</h3>
              <p><strong>Total TTC:</strong> {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(calculs.totalTTC)}</p>
              <p><strong>Nombre de ventes:</strong> {calculs.nbVentes}</p>
              <p><strong>Vendeuses actives:</strong> {calculs.venteursAvecDetail.filter(v => v.nbVentesCalcule > 0).length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Styles globaux pour l'impression */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body { 
              font-family: 'Inter', Arial, sans-serif; 
              font-size: 12px; 
              line-height: 1.4;
            }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
          }
          @media screen { 
            .print-only { display: none; } 
            .no-print { display: block; } 
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
}

export default FeuilleDeRAZProRefactored;
