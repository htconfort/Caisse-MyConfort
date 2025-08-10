/**
 * Session service — wraps Dexie session helpers and exposes a simple API
 * Ensures we always talk to the singleton DB and keep a single session open.
 */
import { db } from '@/db';
import type { SessionDB } from '@/types';

// Types mirroring DB API
export type SessionTotals = { card: number; cash: number; cheque: number };
export type SessionCloseArg = SessionTotals | { closedBy?: string; note?: string; totals?: SessionTotals };

class SessionService {
  /** Ensure an open session, opening one if needed (safe variant) */
  async ensureSession(openedBy?: string): Promise<SessionDB> {
    return db.openSessionSafe(openedBy);
  }

  /** Return the current open session (if any) */
  async getCurrentSession(): Promise<SessionDB | undefined> {
    return db.getCurrentSession();
  }

  /** Open a new session if none is open (standard) */
  async openSession(openedBy?: string): Promise<SessionDB> {
    return db.openSession(openedBy);
  }

  /**
   * Close the current session if open.
   * Accepts either totals directly, or an object with closedBy/note/totals.
   */
  async closeCurrentSession(arg?: SessionCloseArg): Promise<void> {
    return db.closeSession(arg);
  }

  /** Compute today totals from DB (card/cash/cheque) */
  async computeTodayTotalsFromDB(): Promise<SessionTotals> {
    const sales = await db.getDailySales(new Date());
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
export const ensureSession = (openedBy?: string) => sessionService.ensureSession(openedBy);
export const getCurrentSession = () => sessionService.getCurrentSession();
export const openSession = (openedBy?: string) => sessionService.openSession(openedBy);
export const closeCurrentSession = (arg?: SessionCloseArg) => sessionService.closeCurrentSession(arg);
export const computeTodayTotalsFromDB = () => sessionService.computeTodayTotalsFromDB();
