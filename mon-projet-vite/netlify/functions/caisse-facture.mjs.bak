// mon-projet-vite/netlify/functions/caisse-facture.mjs
import { getStore } from '@netlify/blobs';

const SECRET = process.env.CAISSE_SECRET || 'MySuperSecretKey2025';
const STORE = getStore({ name: 'caisse-store', consistency: 'strong' }); // blob store

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Secret',
};

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: jsonHeaders });
  }

  if (req.method === 'GET') {
    // Debug léger: retourne la liste des factures (limité)
    const { blobs } = await STORE.list({ prefix: 'invoices/', cursor: undefined, limit: 20 });
    return new Response(JSON.stringify({ ok: true, count: blobs.length, invoices: blobs.map(b => b.key) }), { status: 200, headers: jsonHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405, headers: jsonHeaders });
  }

  if ((req.headers.get('x-secret') || '') !== SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), { status: 400, headers: jsonHeaders });
  }

  // ---------- Normalisation robuste (montant TTC & lignes) ----------
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

  const d = body || {};
  const raw = Array.isArray(d.produits) ? d.produits
            : Array.isArray(d.items) ? d.items
            : Array.isArray(d.products) ? d.products
            : Array.isArray(d.lignes) ? d.lignes
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

  let montant_ttc = toNum(d.montant_ttc ?? d.total_ttc ?? d.totalTTC ?? d.amount ?? d.total ?? d.montant_total, NaN);
  if (!(montant_ttc > 0)) montant_ttc = totalFromLines(produits);
  if (!(montant_ttc > 0)) {
    const ht = produits.reduce((s, p) => s + (toNum(p.prix_ttc, 0) / 1.2) * toNum(p.quantite, 1), 0);
    if (ht > 0) montant_ttc = +(ht * 1.2).toFixed(2);
  }
  montant_ttc = +(toNum(montant_ttc, 0)).toFixed(2);

  const numero_facture = String(d.numero_facture ?? d.invoiceNumber ?? `AUTO-${Date.now()}`);
  const date_facture   = String(d.date_facture ?? d.invoiceDate ?? new Date().toISOString().slice(0, 10));
  const nom_client     = d.nom_client ?? d.nom_du_client ?? d.clientName ?? 'Client';
  const payment_method = d.payment_method ?? d.mode_paiement ?? 'card';
  const vendeuse       = String(d.vendeuse ?? d.vendorName ?? 'Sylvie');
  const vendorId       = String((d.vendorId ?? vendeuse)).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]/g,'');

  let lignes = produits;
  if ((!Array.isArray(lignes) || !lignes.length) && (montant_ttc > 0)) {
    lignes = [{ nom: 'Ligne unique', quantite: 1, prix_ttc: montant_ttc, remise: 0 }];
  }

  if (!(montant_ttc > 0) || !Array.isArray(lignes) || !lignes.length) {
    // No-op: on n'enregistre pas, mais on répond ok pour ne pas casser le flux
    return new Response(JSON.stringify({ ok: true, enqueued: 0, reason: 'no_op', hint: 'Provide montant_ttc>0 or produits[]' }), { status: 200, headers: jsonHeaders });
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

  // ---------- Idempotence & CA instant ----------
  // Clés blobs
  const keyInvoice = `invoices/${numero_facture}.json`;
  const keyIndex   = `index/${numero_facture}.json`; // { vendorId, montant_ttc }
  const keyVendor  = (vid) => `ca/${vid}.json`;       // { vendorId, total, updatedAt }

  // Lire ancien index (si existe) pour calculer delta CA
  let oldIndex = null;
  try { oldIndex = await STORE.get(keyIndex, { type: 'json' }); } catch {}
  const oldVendorId = oldIndex?.vendorId || null;
  const oldAmount   = Number(oldIndex?.montant_ttc || 0);

  // Upsert facture
  await STORE.set(keyInvoice, JSON.stringify(invoice), { contentType: 'application/json' });
  await STORE.set(keyIndex, JSON.stringify({ vendorId, montant_ttc }), { contentType: 'application/json' });

  // Ajuster CA: -ancien +nouveau (et gérer changement de vendeuse)
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
    // Même vendeuse (ou première fois): appliquer delta
    const prevTotal = await getVendorTotal(vendorId);
    const delta = montant_ttc - oldAmount;
    await setVendorTotal(vendorId, +(prevTotal + delta).toFixed(2));
  }

  return new Response(JSON.stringify({ ok: true, enqueued: 1, invoice }), { status: 200, headers: jsonHeaders });
};
