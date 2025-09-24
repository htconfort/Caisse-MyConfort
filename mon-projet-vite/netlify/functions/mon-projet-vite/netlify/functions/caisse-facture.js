// Version complète pour traitement des factures avec CA instant
const SECRET = process.env.CAISSE_SECRET || 'MySuperSecretKey2025';

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Secret',
};

// Stockage en mémoire (temporaire pour éviter les erreurs Blobs)
let invoices = [];
let vendorTotals = {};

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: jsonHeaders });
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({
      ok: true,
      count: invoices.length,
      invoices: invoices.map(inv => inv.numero_facture),
      vendorTotals
    }), { status: 200, headers: jsonHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), {
      status: 405, headers: jsonHeaders
    });
  }

  if ((req.headers.get('x-secret') || '') !== SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401, headers: jsonHeaders
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
      status: 400, headers: jsonHeaders
    });
  }

  const toNum = (v, d = 0) => {
    if (v === null || v === undefined) return d;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const s = String(v).replace(/\u00A0/g, '').replace(/\s+/g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : d;
  };

  let montant_ttc = toNum(body.montant_ttc ?? body.total_ttc ?? body.totalTTC ?? body.amount ?? body.total, 0);
  const numero_facture = String(body.numero_facture ?? body.invoiceNumber ?? `AUTO-${Date.now()}`);
  const vendeuse = String(body.vendeuse ?? body.vendorName ?? 'Sylvie');
  const vendorId = String((body.vendorId ?? vendeuse)).toLowerCase();

  if (!(montant_ttc > 0)) {
    return new Response(JSON.stringify({ ok: true, enqueued: 0, reason: 'no_op' }), {
      status: 200, headers: jsonHeaders
    });
  }

  const invoice = {
    numero_facture,
    date_facture: String(body.date_facture ?? new Date().toISOString().slice(0, 10)),
    nom_client: body.nom_client ?? 'Client',
    montant_ttc,
    vendeuse,
    vendorId,
    updatedAt: new Date().toISOString(),
  };

  const existingIndex = invoices.findIndex(inv => inv.numero_facture === numero_facture);
  let oldAmount = 0;

  if (existingIndex >= 0) {
    oldAmount = invoices[existingIndex].montant_ttc;
    invoices[existingIndex] = invoice;
  } else {
    invoices.push(invoice);
  }

  const delta = montant_ttc - oldAmount;
  vendorTotals[vendorId] = +(vendorTotals[vendorId] || 0) + delta;

  return new Response(JSON.stringify({
    ok: true,
    enqueued: 1,
    invoice,
    vendorTotals
  }), { status: 200, headers: jsonHeaders });
};
