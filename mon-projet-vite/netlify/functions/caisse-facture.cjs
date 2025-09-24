// mon-projet-vite/netlify/functions/caisse-facture.cjs (CommonJS)
const { getStore } = require('@netlify/blobs');

const SECRET = process.env.CAISSE_SECRET || 'MySuperSecretKey2025';
const STORE = getStore({
  name: 'caisse-store',
  consistency: 'strong',
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_BLOBS_ACCESS_TOKEN
});

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Secret',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: jsonHeaders, body: '' };
  }

  if (event.httpMethod === 'GET') {
    try {
      const { blobs } = await STORE.list({ prefix: 'invoices/', cursor: undefined, limit: 20 });
      return {
        statusCode: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ ok: true, count: blobs.length, invoices: blobs.map(b => b.key) })
      };
    } catch (error) {
      console.error('Error listing invoices:', error);
      return {
        statusCode: 500,
        headers: jsonHeaders,
        body: JSON.stringify({ ok: false, error: 'Internal Server Error' })
      };
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: false, error: 'Method Not Allowed' })
    };
  }

  if ((event.headers['x-secret'] || '') !== SECRET) {
    return {
      statusCode: 401,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: false, error: 'Unauthorized' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON body' })
    };
  }

  // Normalisation des données
  const toNum = (v, d = 0) => {
    if (v === null || v === undefined) return d;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const s = String(v).replace(/\u00A0/g, '').replace(/\s+/g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : d;
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
    const remise = Math.min(Math.max(toNum(p?.remise ?? p?.discount ?? 0, 0), 1), 1);
    return { nom, quantite, prix_ttc, remise };
  });

  const totalFromLines = (lines) =>
    lines.reduce((s, p) => s + toNum(p.quantite, 1) * toNum(p.prix_ttc, 0) * (1 - (toNum(p.remise || 0, 0))), 0);

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
    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: true, enqueued: 0, reason: 'no_op', hint: 'Provide montant_ttc>0 or produits[]' })
    };
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

  // Clés blobs
  const keyInvoice = `invoices/${numero_facture}.json`;
  const keyIndex = `index/${numero_facture}.json`;
  const keyVendor = (vid) => `ca/${vid}.json`;

  try {
    // Lire ancien index
    let oldIndex = null;
    try { oldIndex = await STORE.get(keyIndex, { type: 'json' }); } catch {}
    const oldVendorId = oldIndex?.vendorId || null;
    const oldAmount = Number(oldIndex?.montant_ttc || 0);

    // Upsert facture
    await STORE.set(keyInvoice, JSON.stringify(invoice), { contentType: 'application/json' });
    await STORE.set(keyIndex, JSON.stringify({ vendorId, montant_ttc }), { contentType: 'application/json' });

    // Ajuster CA
    async function getVendorTotal(vid) {
      const v = await STORE.get(keyVendor(vid), { type: 'json' }).catch(() => null);
      return Number(v?.total || 0);
    }
    async function setVendorTotal(vid, total) {
      return STORE.set(keyVendor(vid), JSON.stringify({ vendorId: vid, total, updatedAt: new Date().toISOString() }), { contentType: 'application/json' });
    }

    if (oldVendorId && oldVendorId !== vendorId) {
      // Annuler l'ancien CA sur l'ancienne vendeuse
      const prevTotal = await getVendorTotal(oldVendorId);
      await setVendorTotal(oldVendorId, Math.max(0, +(prevTotal - oldAmount).toFixed(2)));
      // Ajouter le nouveau CA à la nouvelle vendeuse
      const newTotal = await getVendorTotal(vendorId);
      await setVendorTotal(vendorId, +(newTotal + montant_ttc).toFixed(2));
    } else {
      // Même vendeuse: appliquer delta
      const prevTotal = await getVendorTotal(vendorId);
      const delta = montant_ttc - oldAmount;
      await setVendorTotal(vendorId, +(prevTotal + delta).toFixed(2));
    }

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: true, enqueued: 1, invoice })
    };
  } catch (error) {
    console.error('Error processing invoice:', error);
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: false, error: 'Internal Server Error' })
    };
  }
};