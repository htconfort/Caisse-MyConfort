/**
 * Session service — wraps Dexie session helpers and exposes a simple API
 * Ensures we always talk to the singleton DB and keep a single session open.
 */
import { db } from '@/db/schema';
import type { SessionDB } from '@/types';

// Types mirroring DB API
export type SessionTotals = { card: number; cash: number; cheque: number };
export type SessionCloseArg = SessionTotals | { closedBy?: string; note?: string; totals?: SessionTotals };
export type SessionOpenArg = string | { openedBy?: string; note?: string; eventName?: string; eventStart?: number | Date | string; eventEnd?: number | Date | string };

class SessionService {
  /** Ensure an open session, opening one if needed */
  async ensureSession(openedByOrOpts?: SessionOpenArg): Promise<SessionDB> {
    console.log('🔍 SessionService.ensureSession appelé avec:', openedByOrOpts);
    console.log('🔍 db instance:', db);
    
    if (!db) {
      throw new Error('❌ Instance db non disponible');
    }
    
    // Vérifier si une session est déjà ouverte
    const currentSession = await this.getCurrentSession();
    if (currentSession) {
      console.log('✅ Session existante trouvée:', currentSession.id);
      return currentSession;
    }
    
    // Ouvrir une nouvelle session
    const openedBy = typeof openedByOrOpts === 'string' ? openedByOrOpts : 
                    openedByOrOpts?.openedBy || 'system';
    
    console.log('🔄 Ouverture nouvelle session pour:', openedBy);
    return await db.openSession(openedBy);
  }

  /** Return the current open session (if any) */
  async getCurrentSession(): Promise<SessionDB | undefined> {
    const result = await db.getCurrentSession();
    return result || undefined;
  }

  /** Open a new session if none is open (standard) */
  async openSession(openedByOrOpts?: SessionOpenArg): Promise<SessionDB> {
    const openedBy = typeof openedByOrOpts === 'string' ? openedByOrOpts : 
                    openedByOrOpts?.openedBy || 'system';
    return db.openSession(openedBy);
  }

  /** Update current session's event details (only first day) */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateCurrentSessionEvent(_args: { eventName?: string; eventStart?: number | Date | string; eventEnd?: number | Date | string }): Promise<SessionDB> {
    // Cette méthode devra être implémentée dans le schéma si nécessaire
    console.log('⚠️ updateCurrentSessionEvent pas encore implémentée dans le schéma');
    const currentSession = await this.getCurrentSession();
    if (!currentSession) {
      throw new Error('Aucune session active');
    }
    return currentSession;
  }

  /**
   * Close the current session if open.
   * Accepts either totals directly, or an object with closedBy/note/totals.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async closeCurrentSession(_arg?: SessionCloseArg): Promise<void> {
    return db.closeSession();
  }

  /** Compute today totals from DB (card/cash/cheque) */
  async computeTodayTotalsFromDB(): Promise<SessionTotals> {
    // Cette méthode devra être implémentée dans le schéma avec getDailySales
    console.log('⚠️ getDailySales pas encore implémentée dans le schéma');
    
    // Retourner des totaux par défaut pour l'instant
    const defaultTotals: SessionTotals = {
      card: 0,
      cash: 0,
      cheque: 0
    };
    
    return defaultTotals;
  }
}

export const sessionService = new SessionService();
export default sessionService;

// Named helpers for convenience in components
export const ensureSession = (openedByOrOpts?: SessionOpenArg) => sessionService.ensureSession(openedByOrOpts);
export const getCurrentSession = () => sessionService.getCurrentSession();
export const openSession = (openedByOrOpts?: SessionOpenArg) => sessionService.openSession(openedByOrOpts);
export const updateCurrentSessionEvent = (args: { eventName?: string; eventStart?: number | Date | string; eventEnd?: number | Date | string }) => sessionService.updateCurrentSessionEvent(args);
export const closeCurrentSession = (arg?: SessionCloseArg) => sessionService.closeCurrentSession(arg);
export const computeTodayTotalsFromDB = () => sessionService.computeTodayTotalsFromDB();
