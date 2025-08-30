import { useState, useEffect, useCallback, useMemo } from 'react';
import type { SessionDB } from '@/types';
import { 
  ensureSession as ensureSessionHelper, 
  closeCurrentSession as closeCurrentSessionHelper, 
  computeTodayTotalsFromDB, 
  getCurrentSession as getCurrentSessionHelper, 
  updateCurrentSessionEvent as updateCurrentSessionEventHelper 
} from '@/services/sessionService';

export function useRAZSession() {
  const [session, setSession] = useState<SessionDB | undefined>();
  const [sessLoading, setSessLoading] = useState(true);
  const [openingSession, setOpeningSession] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventSaved, setEventSaved] = useState(false);

  const toInputDate = useCallback((ms?: number) => {
    if (!ms) return '';
    const d = new Date(ms);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const endOfDay = useCallback((ms: number) => {
    const d = new Date(ms);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, []);

  const isTodayFirstDayOf = useCallback((openedAt?: number) => {
    if (!openedAt) return false;
    const today = new Date();
    const sessionDate = new Date(openedAt);
    
    today.setHours(0, 0, 0, 0);
    sessionDate.setHours(0, 0, 0, 0);
    
    return today.getTime() === sessionDate.getTime();
  }, []);

  const refreshSession = useCallback(async () => {
    setSessLoading(true);
    try {
      const sess = await getCurrentSessionHelper();
      setSession(sess);
    } catch (e) {
      console.error('Erreur refresh session:', e);
      setSession(undefined);
    } finally {
      setSessLoading(false);
    }
  }, []);

  const canEndSessionToday = useMemo(() => {
    if (!session?.eventEnd) return false;
    const today = new Date();
    const sessionEndDate = new Date(session.eventEnd);
    return today.getTime() >= sessionEndDate.getTime();
  }, [session?.eventEnd]);

  const hasUnsavedEventChanges = useMemo(() => {
    if (!session) return false;
    
    const currentEventName = eventName || '';
    const currentEventStart = eventStart || '';
    const currentEventEnd = eventEnd || '';
    
    const sessionEventName = session.eventName || '';
    const sessionEventStart = session.eventStart ? toInputDate(session.eventStart) : '';
    const sessionEventEnd = session.eventEnd ? toInputDate(session.eventEnd) : '';
    
    return currentEventName !== sessionEventName || 
           currentEventStart !== sessionEventStart || 
           currentEventEnd !== sessionEventEnd;
  }, [session, eventName, eventStart, eventEnd, toInputDate]);

  const openSession = useCallback(async () => {
    setOpeningSession(true);
    try {
      const eventStartMs = eventStart ? new Date(eventStart).getTime() : undefined;
      const eventEndMs = eventEnd ? new Date(eventEnd).getTime() : undefined;
      
      const sessionParams = {
        openedBy: 'system',
        ...(eventName && { eventName }),
        ...(eventStartMs && { eventStart: eventStartMs }),
        ...(eventEndMs && { eventEnd: eventEndMs })
      };
      
      await ensureSessionHelper(sessionParams);
      await refreshSession();
    } catch (e) {
      console.error('Erreur ouverture session:', e);
      alert("Erreur lors de l'ouverture de la session: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setOpeningSession(false);
    }
  }, [eventName, eventStart, eventEnd, refreshSession]);

  const onSaveEventFirstDay = useCallback(async () => {
    if (!hasUnsavedEventChanges) return;
    
    setSavingEvent(true);
    setEventSaved(false);
    
    try {
      await updateCurrentSessionEventHelper({ 
        eventName: eventName || undefined, 
        eventStart: eventStart || undefined, 
        eventEnd: eventEnd || undefined 
      });
      await refreshSession();
      setEventSaved(true);
      
      // Auto-hide success feedback after 2 seconds
      setTimeout(() => setEventSaved(false), 2000);
    } catch (e) {
      console.error('Erreur mise à jour événement:', e);
      const msg = e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement de l\'événement';
      alert(msg);
    } finally {
      setSavingEvent(false);
    }
  }, [eventName, eventStart, eventEnd, refreshSession, hasUnsavedEventChanges]);

  const closeSession = useCallback(async () => {
    if (session?.eventEnd) {
      const now = Date.now();
      if (now < endOfDay(session.eventEnd)) {
        alert(`La session ne peut pas être clôturée avant la fin de l'événement (dernier jour: ${new Date(session.eventEnd).toLocaleDateString('fr-FR')}).`);
        return;
      }
    }
    const ok = window.confirm('Clôturer la session de caisse en cours ?');
    if (!ok) return;
    try {
      const totals = await computeTodayTotalsFromDB();
      await closeCurrentSessionHelper({ closedBy: 'system', totals });
      await refreshSession();
    } catch (e) {
      console.error('Erreur fermeture session:', e);
      const msg = e instanceof Error ? e.message : 'Erreur lors de la fermeture de la session';
      alert(msg);
    }
  }, [session, refreshSession, endOfDay]);

  // Initialiser les champs événement quand la session change
  useEffect(() => {
    if (session) {
      setEventName(session.eventName || '');
      setEventStart(session.eventStart ? toInputDate(session.eventStart) : '');
      setEventEnd(session.eventEnd ? toInputDate(session.eventEnd) : '');
      setEventSaved(false);
    }
  }, [session, toInputDate]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  return {
    // États
    session,
    sessLoading,
    openingSession,
    eventName,
    eventStart,
    eventEnd,
    savingEvent,
    eventSaved,
    canEndSessionToday,
    hasUnsavedEventChanges,
    
    // Setters
    setEventName,
    setEventStart,
    setEventEnd,
    setEventSaved,
    
    // Actions
    openSession,
    closeSession,
    onSaveEventFirstDay,
    refreshSession,
    
    // Helpers
    isTodayFirstDayOf,
    toInputDate,
    endOfDay
  };
}
