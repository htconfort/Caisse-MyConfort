import React from 'react';
import { RefreshCw } from 'lucide-react';
import type { SessionDB } from '@/types';

interface RAZHeaderProps {
  session: SessionDB | undefined;
  sessLoading: boolean;
  openingSession: boolean;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  savingEvent: boolean;
  eventSaved: boolean;
  hasUnsavedEventChanges: boolean;
  canEndSessionToday: boolean;
  isTodayFirstDayOf: (openedAt?: number) => boolean;
  setEventName: (value: string) => void;
  setEventStart: (value: string) => void;
  setEventEnd: (value: string) => void;
  setEventSaved: (value: boolean) => void;
  openSession: () => void;
  closeSession: () => void;
  onSaveEventFirstDay: () => void;
}

export default function RAZHeader({
  session,
  sessLoading,
  openingSession,
  eventName,
  eventStart,
  eventEnd,
  savingEvent,
  eventSaved,
  hasUnsavedEventChanges,
  canEndSessionToday,
  isTodayFirstDayOf,
  setEventName,
  setEventStart,
  setEventEnd,
  setEventSaved,
  openSession,
  closeSession,
  onSaveEventFirstDay
}: RAZHeaderProps) {
  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    outline: 'none',
    fontSize: '0.95em'
  };

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

  if (sessLoading) {
    return (
      <div style={{ 
        backgroundColor: '#FEF3C7', 
        border: '1px solid #F59E0B', 
        borderRadius: 12, 
        padding: 20, 
        marginBottom: 25,
        textAlign: 'center' 
      }}>
        <div style={{ color: '#92400E', fontWeight: 600 }}>
          Chargement de l'état de session...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#F3F4F6', 
      border: '1px solid #D1D5DB', 
      borderRadius: 12, 
      padding: 20, 
      marginBottom: 25 
    }}>
      <div style={{ 
        color: '#374151', 
        fontWeight: 700, 
        fontSize: 18, 
        marginBottom: 15,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        🏪 Gestion de Session de Caisse
        <span style={{ fontSize: 14, fontWeight: 400, color: '#6B7280' }}>
          ({new Date().toLocaleDateString('fr-FR')})
        </span>
      </div>

      {!session ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{ color: '#7F1D1D', fontWeight: 600 }}>
            Aucune session en cours. Créer une nouvelle session de caisse ?
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px auto', gap: 10, alignItems: 'center' }}>
            <input 
              placeholder="Nom de l'événement (optionnel)" 
              value={eventName} 
              onChange={e => setEventName(e.target.value)} 
              style={inputStyle} 
            />
            <input 
              type="date" 
              placeholder="Date début" 
              value={eventStart} 
              onChange={e => setEventStart(e.target.value)} 
              style={inputStyle} 
            />
            <input 
              type="date" 
              placeholder="Date fin" 
              value={eventEnd} 
              onChange={e => setEventEnd(e.target.value)} 
              style={inputStyle} 
            />
            <button 
              onClick={openSession} 
              disabled={openingSession}
              style={{
                ...btn('#059669'),
                opacity: openingSession ? 0.6 : 1,
                cursor: openingSession ? 'not-allowed' : 'pointer'
              }}
            >
              {openingSession ? 'Ouverture...' : 'Ouvrir Session'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ color: '#065F46', fontWeight: 700, fontSize: 16 }}>Session ouverte</div>
              <div style={{ color: '#7F1D1D' }}>
                Depuis {new Date(session.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {session.eventName && (
                <div style={{ marginTop: 6, color: '#7F1D1D', fontWeight: 600 }}>
                  Événement : {session.eventName}
                  {session.eventStart && session.eventEnd && (
                    <span> (du {new Date(session.eventStart).toLocaleDateString('fr-FR')} au {new Date(session.eventEnd).toLocaleDateString('fr-FR')})</span>
                  )}
                </div>
              )}
            </div>
            <div style={{ color: '#991B1B', fontWeight: 600 }}>Gestion de session en bas de page</div>
          </div>
          
          {/* Si premier jour: permettre de fixer/modifier l'événement */}
          {isTodayFirstDayOf(session.openedAt) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px auto', gap: 10, alignItems: 'center' }}>
              <input 
                placeholder="Nom de l'événement" 
                value={eventName} 
                onChange={e => {
                  setEventName(e.target.value);
                  setEventSaved(false);
                }} 
                style={inputStyle} 
              />
              <input 
                type="date" 
                value={eventStart} 
                onChange={e => {
                  setEventStart(e.target.value);
                  setEventSaved(false);
                }} 
                style={inputStyle} 
              />
              <input 
                type="date" 
                value={eventEnd} 
                onChange={e => {
                  setEventEnd(e.target.value);
                  setEventSaved(false);
                }} 
                style={inputStyle} 
              />
              <button 
                onClick={onSaveEventFirstDay} 
                disabled={!hasUnsavedEventChanges || savingEvent}
                style={{
                  ...btn(
                    eventSaved ? '#059669' : 
                    hasUnsavedEventChanges ? '#DC2626' : 
                    '#6B7280'
                  ),
                  opacity: !hasUnsavedEventChanges ? 0.6 : 1,
                  cursor: !hasUnsavedEventChanges || savingEvent ? 'not-allowed' : 'pointer',
                  position: 'relative',
                  minWidth: '180px'
                }}
              >
                {savingEvent ? (
                  <>
                    <RefreshCw size={16} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
                    Enregistrement...
                  </>
                ) : eventSaved ? (
                  <>
                    ✓ Événement enregistré
                  </>
                ) : hasUnsavedEventChanges ? (
                  <>
                    ⚠ Enregistrer l'événement
                  </>
                ) : (
                  <>
                    Enregistrer l'événement
                  </>
                )}
              </button>
            </div>
          )}

          {/* Bouton de fermeture de session */}
          <div style={{ marginTop: 10, borderTop: '1px solid #E5E7EB', paddingTop: 15 }}>
            <button 
              onClick={closeSession}
              disabled={!canEndSessionToday}
              style={{
                ...btn(canEndSessionToday ? '#DC2626' : '#9CA3AF'),
                opacity: canEndSessionToday ? 1 : 0.6,
                cursor: canEndSessionToday ? 'pointer' : 'not-allowed'
              }}
            >
              {canEndSessionToday ? '🔴 Clôturer Session' : '⏳ Clôture non autorisée'}
            </button>
            {!canEndSessionToday && session.eventEnd && (
              <div style={{ marginTop: 8, fontSize: '0.85em', color: '#6B7280' }}>
                La session peut être clôturée à partir du {new Date(session.eventEnd).toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animation CSS pour le spinner */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
}
