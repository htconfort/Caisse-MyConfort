import React from 'react';
import { Printer, Mail, Eye, EyeOff, RefreshCw, PlayCircle, XCircle } from 'lucide-react';
import type { WorkflowSecurityState } from './types';

interface RAZActionsFooterProps {
  workflowState: WorkflowSecurityState;
  onView: () => void;
  onPrint: () => void;
  onEmail: () => void;
  onWhatsApp: () => void;
  onRAZ: () => void;
  onExportBeforeReset: () => void;
  modeApercu: boolean;
  setModeApercu: (value: boolean) => void;
  razGuardReady: boolean;
  setShowRAZGuardModal: (value: boolean) => void;
}

export default function RAZActionsFooter({
  workflowState,
  onView,
  onPrint,
  onEmail,
  onWhatsApp,
  onRAZ,
  onExportBeforeReset,
  modeApercu,
  setModeApercu,
  razGuardReady,
  setShowRAZGuardModal
}: RAZActionsFooterProps) {
  const btn = (bg: string, white = true, color?: string) => ({
    padding: '15px 25px',
    fontSize: '1.05em',
    fontWeight: 'bold',
    backgroundColor: bg,
    color: color ?? (white ? 'white' : '#14281D'),
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  });

  const btnDisabled = (bg: string, white = true, color?: string) => ({
    ...btn(bg, white, color),
    backgroundColor: '#9CA3AF',
    color: '#6B7280',
    cursor: 'not-allowed',
    opacity: 0.6
  });

  const effectuerRAZ = () => {
    if (!razGuardReady) {
      alert('Le système de protection RAZ n\'est pas encore prêt. Patientez quelques secondes.');
      return;
    }
    setShowRAZGuardModal(true);
  };

  return (
    <div style={{ 
      position: 'sticky',
      bottom: 0,
      backgroundColor: 'white',
      borderTop: '2px solid #E5E7EB',
      padding: '20px 25px',
      zIndex: 10,
      boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginBottom: 15
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#374151', 
          fontWeight: 700, 
          fontSize: 18,
          textAlign: 'center'
        }}>
          🎯 Actions Feuille de Caisse
        </h3>
      </div>

      {/* Workflow Progress */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: 15,
        marginBottom: 20,
        padding: '10px 20px',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        border: '1px solid #E5E7EB'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6,
          color: workflowState.isViewed ? '#059669' : '#6B7280',
          fontWeight: workflowState.isViewed ? 600 : 400
        }}>
          {workflowState.isViewed ? '✅' : '⚪'} Visualisé
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6,
          color: workflowState.isPrinted ? '#059669' : '#6B7280',
          fontWeight: workflowState.isPrinted ? 600 : 400
        }}>
          {workflowState.isPrinted ? '✅' : '⚪'} Imprimé
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6,
          color: workflowState.isEmailSent ? '#059669' : '#6B7280',
          fontWeight: workflowState.isEmailSent ? 600 : 400
        }}>
          {workflowState.isEmailSent ? '✅' : '⚪'} Email envoyé
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6,
          color: workflowState.workflowCompleted ? '#059669' : '#DC2626',
          fontWeight: 600
        }}>
          {workflowState.workflowCompleted ? '🔓' : '🔒'} RAZ {workflowState.workflowCompleted ? 'autorisé' : 'protégé'}
        </div>
      </div>

      {/* Boutons d'action principaux */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 20 }}>
        {/* 🖤 Bouton Noir : Voir feuille de caisse */}
        <button 
          onClick={onView} 
          style={btn(workflowState.isViewed ? '#4A5568' : '#1A202C', true)}
        >
          <Eye size={20} />
          {workflowState.isViewed ? 'Feuille vue ✓' : 'Voir feuille de caisse'}
        </button>

        {/* 🔵 Bouton Bleu : Imprimer */}
        <button 
          onClick={onPrint} 
          disabled={!workflowState.isViewed}
          style={workflowState.isViewed ? btn('#1E40AF') : btnDisabled('#1E40AF')}
        >
          <Printer size={20} />
          {workflowState.isPrinted ? 'Imprimé ✓' : 'Imprimer'}
        </button>

        {/* 🟢 Bouton Vert : Email */}
        <button 
          onClick={onEmail} 
          disabled={!workflowState.isPrinted}
          style={workflowState.isPrinted ? btn('#059669') : btnDisabled('#059669')}
        >
          <Mail size={20} />
          {workflowState.isEmailSent ? 'Email envoyé ✓' : 'Envoyer par email'}
        </button>

        {/* 🟣 Bouton Violet : WhatsApp */}
        <button 
          onClick={onWhatsApp}
          style={btn('#7C3AED')}
        >
          <RefreshCw size={20} />
          Rapport WhatsApp
        </button>
      </div>

      {/* Boutons de contrôle */}
      <div style={{ display: 'flex', gap: 15, justifyContent: 'center', marginBottom: 20 }}>
        {/* Toggle Mode Aperçu */}
        <button 
          onClick={() => setModeApercu(!modeApercu)}
          style={btn(modeApercu ? '#F59E0B' : '#6B7280')}
        >
          {modeApercu ? <EyeOff size={20} /> : <Eye size={20} />}
          {modeApercu ? 'Quitter aperçu' : 'Mode aperçu'}
        </button>

        {/* Export avant RAZ */}
        <button 
          onClick={onExportBeforeReset}
          style={btn('#8B5CF6')}
        >
          <PlayCircle size={20} />
          Export avant RAZ
        </button>
      </div>

      {/* Bouton RAZ - Séparé et mis en évidence */}
      <div style={{ 
        borderTop: '2px solid #FEE2E2',
        paddingTop: 20,
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button 
          onClick={effectuerRAZ}
          disabled={!workflowState.workflowCompleted || !razGuardReady}
          style={
            workflowState.workflowCompleted && razGuardReady
              ? {
                  ...btn('#DC2626'),
                  fontSize: '1.2em',
                  padding: '20px 40px',
                  boxShadow: '0 4px 14px 0 rgba(220, 38, 38, 0.39)',
                  border: '2px solid #FEE2E2'
                }
              : {
                  ...btnDisabled('#DC2626'),
                  fontSize: '1.2em',
                  padding: '20px 40px'
                }
          }
        >
          <XCircle size={24} />
          {workflowState.workflowCompleted 
            ? (razGuardReady ? '🚨 EFFECTUER LA RAZ' : '⏳ RAZ en préparation...') 
            : '🔒 RAZ protégée - Terminez le workflow'
          }
        </button>
      </div>

      {!workflowState.workflowCompleted && (
        <div style={{ 
          marginTop: 15, 
          textAlign: 'center', 
          color: '#DC2626', 
          fontSize: '0.9em', 
          fontWeight: 600 
        }}>
          Complétez d'abord : Visualisation → Impression → Email
        </div>
      )}
    </div>
  );
}
