const N8N_BASE: string = (import.meta.env.VITE_N8N_URL as string) || '';

function assertConfigured(): void {
  if (!N8N_BASE) {
    throw new Error('VITE_N8N_URL manquante. Configure-la dans les variables Netlify (.env).');
  }
}

export async function sendInvoice(payload: unknown): Promise<any> {
  assertConfigured();
  const response = await fetch(`${N8N_BASE}/caisse/facture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('n8n facture failed');
  return response.json();
}

export async function updateStatus(numero_facture: string, patch: Record<string, unknown>): Promise<any> {
  assertConfigured();
  const response = await fetch(`${N8N_BASE}/caisse/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numero_facture, ...patch }),
  });
  if (!response.ok) throw new Error('n8n status failed');
  return response.json();
}

export async function listInvoices(limit: number = 50): Promise<any> {
  assertConfigured();
  const response = await fetch(`${N8N_BASE}/caisse/factures?limit=${encodeURIComponent(String(limit))}`);
  if (!response.ok) throw new Error('n8n list failed');
  return response.json();
}


