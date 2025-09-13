/**
 * Session service — wraps Dexie session helpers and exposes a simple API
 * Ensures we always talk to the singleton DB and keep a single session open.
 */
import { db } from '@/db/schema';
import type { SessionDB } from '@/types';

// Types mirroring DB API
export type SessionTotals = { card: number; cash: number; cheque: number };
export type SessionCloseArg = SessionTotals | { closedBy?: string; note?: string; totals?: SessionTotals };
export type SessionOpenArg = string | { openedBy?: string; note?: string; eventName?: string; eventStart?: number | Date | string; eventEnd?: number | Date | string; eventLocation?: string };

class SessionService {
  /** Ensure an open session, opening one if needed (safe variant) */
  async ensureSession(openedByOrOpts?: SessionOpenArg): Promise<SessionDB> {
    console.log('🔍 SessionService.ensureSession appelé avec:', openedByOrOpts);
    console.log('🔍 db instance:', db);
    
    if (!db) {
      throw new Error('❌ Instance db non disponible');
    }
    
    // Utiliser l'assertion de type pour accéder à la méthode
    return (db as any).openSessionSafe(openedByOrOpts);
  }

  /** Return the current open session (if any) */
  async getCurrentSession(): Promise<SessionDB | undefined> {
    const result = await (db as any).getCurrentSession();
    return result || undefined;
  }

  /** Open a new session if none is open (standard) */
  async openSession(openedByOrOpts?: SessionOpenArg): Promise<SessionDB> {
    return (db as any).openSession(openedByOrOpts);
  }

  /** Update current session's event details (only first day) */
  async updateCurrentSessionEvent(args: { eventName?: string; eventStart?: number | Date | string; eventEnd?: number | Date | string; eventLocation?: string }): Promise<SessionDB> {
    return (db as any).updateCurrentSessionEvent(args);
  }

  /**
   * Close the current session if open.
   * Accepts either totals directly, or an object with closedBy/note/totals.
   */
  async closeCurrentSession(arg?: SessionCloseArg): Promise<void> {
    return (db as any).closeSession(arg as SessionCloseArg);
  }

  /** Compute today totals from DB (card/cash/cheque) */
  async computeTodayTotalsFromDB(): Promise<SessionTotals> {
    const sales = await (db as any).getDailySales(new Date());
    let card = 0, cash = 0, cheque = 0;
    for (const s of sales) {
      switch (s.paymentMethod) {
        case 'card':
          card += s.totalAmount || 0;
          break;
        case 'cash':
          cash += s.totalAmount || 0;
          break;
        case 'check':
          cheque += s.totalAmount || 0;
          break;
        default:
          // 'multi' or others are ignored for session totals here
          break;
      }
    }
    return { card, cash, cheque };
  }
}

export const sessionService = new SessionService();
export default sessionService;

// Named helpers for convenience in components
export const ensureSession = (openedByOrOpts?: SessionOpenArg) => sessionService.ensureSession(openedByOrOpts);
export const getCurrentSession = () => sessionService.getCurrentSession();
export const openSession = (openedByOrOpts?: SessionOpenArg) => sessionService.openSession(openedByOrOpts);
export const updateCurrentSessionEvent = (args: { eventName?: string; eventStart?: number | Date | string; eventEnd?: number | Date | string; eventLocation?: string }) => sessionService.updateCurrentSessionEvent(args);
export const closeCurrentSession = (arg?: SessionCloseArg) => sessionService.closeCurrentSession(arg);
export const computeTodayTotalsFromDB = () => sessionService.computeTodayTotalsFromDB();
