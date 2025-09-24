// Version simplifiée sans Netlify Blobs pour éviter les erreurs internes
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

export default async (req, ctx) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: jsonHeaders });
  }

  if (req.method === 'GET') {
    // Retourner la liste des factures
    return new Response(JSON.stringify({ 
      ok: true, 
      count: invoices.length, 
      invoices: invoices.map(inv => inv.numero_facture),
      vendorTotals,
      rev: "20250124-184500"
    }), {
      status: 200,
      headers: jsonHeaders
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: jsonHeaders
    });
  }

  if ((req.headers.get('x-secret') || '') !== SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: jsonHeaders
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
      status: 400,
      headers: jsonHeaders
    });
  }

  // Normalisation des données
  const toNum = (v, d = 0) => {
    if (v === null || v === undefined) return d;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const s = String(v).replace(/\u00A0/g, '').replace(/\s+/g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : d;
  };

  const clamp01 = (x) => {
    const n = toNum(x, 0);
    if (n > 1) return Math.min(n / 100, 1); // 20 -> 0.2
    if (n < 0) return 0;
    return n;
  };

  const raw = Array.isArray(body.produits) ? body.produits
            : Array.isArray(body.items) ? body.items
            : Array.isArray(body.products) ? body.products
            : Array.isArray(body.lignes) ? body.lignes
            : [];

  const produits = raw.map((p, i) => {
    const nom = p?.nom ?? p?.name ?? p?.designation ?? p?.title ?? `Article ${i + 1}`;
    const quantite = toNum(p?.quantite ?? p?.qty ?? p?.quantity ?? 1, 1);
    let prix_ttc = toNum(p?.prix_ttc ?? p?.unitPriceTTC ?? p?.priceTTC ?? p?.price, NaN);
    if (!(prix_ttc > 0)) {
      const prix_ht = toNum(p?.prix_ht ?? p?.unitPriceHT ?? p?.priceHT, 0);
      prix_ttc = +(prix_ht * 1.2).toFixed(2);
    }
    const remise = clamp01(p?.remise ?? p?.discount ?? 0);
    return { nom, quantite, prix_ttc, remise };
  });

  const totalFromLines = (lines) =>
    lines.reduce((s, p) => s + toNum(p.quantite, 1) * toNum(p.prix_ttc, 0) * (1 - clamp01(p.remise || 0)), 0);

  let montant_ttc = toNum(body.montant_ttc ?? body.total_ttc ?? body.totalTTC ?? body.amount ?? body.total ?? body.montant_total, NaN);
  if (!(montant_ttc > 0)) montant_ttc = totalFromLines(produits);
  if (!(montant_ttc > 0)) {
    const ht = produits.reduce((s, p) => s + (toNum(p.prix_ttc, 0) / 1.2) * toNum(p.quantite, 1), 0);
    if (ht > 0) montant_ttc = +(ht * 1.2).toFixed(2);
  }
  montant_ttc = +(toNum(montant_ttc, 0)).toFixed(2);

  const numero_facture = String(body.numero_facture ?? body.invoiceNumber ?? `AUTO-${Date.now()}`);
  const date_facture = String(body.date_facture ?? body.invoiceDate ?? new Date().toISOString().slice(0, 10));
  const nom_client = body.nom_client ?? body.nom_du_client ?? body.clientName ?? 'Client';
  const payment_method = body.payment_method ?? body.mode_paiement ?? 'card';
  const vendeuse = String(body.vendeuse ?? body.vendorName ?? 'Sylvie');
  const vendorId = String((body.vendorId ?? vendeuse)).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]/g,'');

  let lignes = produits;
  if ((!Array.isArray(lignes) || !lignes.length) && (montant_ttc > 0)) {
    lignes = [{ nom: 'Ligne unique', quantite: 1, prix_ttc: montant_ttc, remise: 0 }];
  }

  if (!(montant_ttc > 0) || !Array.isArray(lignes) || !lignes.length) {
    return new Response(JSON.stringify({ ok: true, enqueued: 0, reason: 'no_op', hint: 'Provide montant_ttc>0 or produits[]' }), {
      status: 200,
      headers: jsonHeaders
    });
  }

  const invoice = {
    numero_facture,
    date_facture,
    nom_client,
    montant_ttc,
    payment_method,
    vendeuse,
    vendorId,
    produits: lignes,
    updatedAt: new Date().toISOString(),
  };

  try {
    // Idempotence: vérifier si la facture existe déjà
    const existingIndex = invoices.findIndex(inv => inv.numero_facture === numero_facture);
    let oldAmount = 0;
    let oldVendorId = null;

    if (existingIndex >= 0) {
      // Facture existante: récupérer l'ancien montant et vendeuse
      const existingInvoice = invoices[existingIndex];
      oldAmount = existingInvoice.montant_ttc;
      oldVendorId = existingInvoice.vendorId;
      
      // Remplacer la facture existante
      invoices[existingIndex] = invoice;
    } else {
      // Nouvelle facture
      invoices.push(invoice);
    }

    // Mettre à jour les totaux des vendeuses
    if (oldVendorId && oldVendorId !== vendorId) {
      // Annuler l'ancien CA sur l'ancienne vendeuse
      vendorTotals[oldVendorId] = Math.max(0, +(vendorTotals[oldVendorId] || 0) - oldAmount);
      // Ajouter le nouveau CA à la nouvelle vendeuse
      vendorTotals[vendorId] = +(vendorTotals[vendorId] || 0) + montant_ttc;
    } else {
      // Même vendeuse: appliquer delta
      const delta = montant_ttc - oldAmount;
      vendorTotals[vendorId] = +(vendorTotals[vendorId] || 0) + delta;
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      enqueued: 1, 
      invoice,
      vendorTotals,
      message: existingIndex >= 0 ? 'Invoice updated' : 'Invoice created',
      rev: "20250124-184500"
    }), {
      status: 200,
      headers: jsonHeaders
    });
  } catch (error) {
    console.error('Error processing invoice:', error);
    return new Response(JSON.stringify({ ok: false, error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: jsonHeaders
    });
  }
};

// rev: 20250124-184500