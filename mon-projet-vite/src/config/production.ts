// src/config/production.ts
// Active des "garde-fous" anti-données démo en prod (ou dès que ce n'est pas localhost)

export const PRODUCTION_CONFIG = {
  DISABLE_DEMO_DATA: true,
  FORCE_EMPTY_INVOICES: true,
  DEMO_MODE: false,
  DEBUG_MODE: false,
};

declare global {
  interface Window {
    PRODUCTION_MODE?: boolean;
    DISABLE_ALL_DEMO_DATA?: boolean;
    FORCE_EMPTY_INVOICES?: boolean;
    DEMO_MODE?: boolean;
  }
}

// Activation côté client
if (typeof window !== 'undefined') {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocalhost) {
    window.PRODUCTION_MODE = true;
    window.DISABLE_ALL_DEMO_DATA = true;
    window.FORCE_EMPTY_INVOICES = true;
    window.DEMO_MODE = false;
  }
}
