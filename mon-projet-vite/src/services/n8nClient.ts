function normalizeBase(url?: string): string {
  if (!url) return '';
  return url.replace(/\/$/, '');
}

// Priorités d'URL (override explicite > base proxy > vide)
const WEBHOOK_BASE: string = normalizeBase(import.meta.env.VITE_N8N_WEBHOOK_URL as string) || '';
const N8N_BASE: string = normalizeBase((import.meta.env.VITE_N8N_URL as string) || '/api/n8n');
const N8N_SYNC_URL: string = normalizeBase(import.meta.env.VITE_N8N_SYNC_URL as string) || '';
const N8N_GET_FACTURES_URL: string = normalizeBase(import.meta.env.VITE_N8N_GET_FACTURES_URL as string) || '';
const N8N_STATUS_URL: string = normalizeBase(import.meta.env.VITE_N8N_STATUS_URL as string) || '';

function assertConfigured(): void {
  // Avec fallback par défaut sur /api/n8n, on considère toujours configuré
  if (!N8N_BASE) {
    throw new Error('Configuration N8N invalide: base URL absente.');
  }
}

export async function sendInvoice(payload: unknown): Promise<any> {
  assertConfigured();
  const url = WEBHOOK_BASE || N8N_SYNC_URL || `${N8N_BASE}/caisse/facture`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('n8n facture failed');
  return response.json();
}

export async function updateStatus(numero_facture: string, patch: Record<string, unknown>): Promise<any> {
  assertConfigured();
  const base = WEBHOOK_BASE?.replace(/\/caisse\/facture$/, '') || '';
  const statusUrlFromWebhook = base ? `${base}/caisse/status` : '';
  const url = statusUrlFromWebhook || N8N_STATUS_URL || `${N8N_BASE}/caisse/status`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numero_facture, ...patch }),
  });
  if (!response.ok) throw new Error('n8n status failed');
  return response.json();
}

export async function listInvoices(limit: number = 50): Promise<any> {
  assertConfigured();
  const baseFromWebhook = WEBHOOK_BASE?.replace(/\/caisse\/facture$/, '') || '';
  const listBase = N8N_GET_FACTURES_URL || (baseFromWebhook ? `${baseFromWebhook}/caisse/factures` : `${N8N_BASE}/caisse/factures`);
  const response = await fetch(`${listBase}?limit=${encodeURIComponent(String(limit))}`);
  if (!response.ok) throw new Error('n8n list failed');
  return response.json();
}



