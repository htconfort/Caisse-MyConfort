import { getStore } from "@netlify/blobs";

const SECRET = process.env.CAISSE_SECRET || 'MySuperSecretKey2025';

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
    // Debug: retourne la liste des factures
    try {
      const store = getStore("caisse-store");
      const { blobs } = await store.list({ prefix: 'invoices/' });
      return new Response(JSON.stringify({
        ok: true,
        count: blobs.length,
        invoices: blobs.map(b => b.key)
      }), { status: 200, headers: jsonHeaders });
    } catch (error) {
      return new Response(JSON.stringify({
        ok: true,
        count: 0,
        invoices: [],
        error: error.message
      }), { status: 200, headers: jsonHeaders });
    }
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

  // Normalisation des données
  const toNum = (v, d = 0) => {
    if (v === null || v === undefined) return d;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const s = String(v).replace(/\u00A0/g, '').replace(/\s+/g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : d;
  };

  const d = body || {};
  const numero_facture = String(d.numero_facture ?? d.invoiceNumber ?? `AUTO-${Date.now()}`);
  const date_facture = String(d.date_facture ?? d.invoiceDate ?? new Date().toISOString().slice(0, 10));
  const nom_client = d.nom_client ?? d.nom_du_client ?? d.clientName ?? 'Client';
  const payment_method = d.payment_method ?? d.mode_paiement ?? 'card';
  const vendeuse = String(d.vendeuse ?? d.vendorName ?? 'Sylvie');
  const vendorId = String((d.vendorId ?? vendeuse)).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]/g,'');
  
  let montant_ttc = toNum(d.montant_ttc ?? d.total_ttc ?? d.totalTTC ?? d.amount ?? d.total ?? d.montant_total, 0);
  
  // Si pas de montant, calculer depuis les produits
  if (!(montant_ttc > 0)) {
    const produits = Array.isArray(d.produits) ? d.produits : Array.isArray(d.items) ? d.items : Array.isArray(d.products) ? d.products : [];
    montant_ttc = produits.reduce((s, p) => s + toNum(p.quantite, 1) * toNum(p.prix_ttc, 0), 0);
  }
  
  montant_ttc = +(montant_ttc).toFixed(2);

  if (!(montant_ttc > 0)) {
    return new Response(JSON.stringify({ 
      ok: true, 
      enqueued: 0, 
      reason: 'no_op', 
      hint: 'Provide montant_ttc>0 or produits[]' 
    }), { status: 200, headers: jsonHeaders });
  }

  const invoice = {
    numero_facture,
    date_facture,
    nom_client,
    montant_ttc,
    payment_method,
    vendeuse,
    vendorId,
    produits: Array.isArray(d.produits) ? d.produits : [],
    updatedAt: new Date().toISOString(),
  };

  try {
    const store = getStore("caisse-store");
    
    // Idempotence: vérifier si la facture existe déjà
    const keyInvoice = `invoices/${numero_facture}.json`;
    const keyIndex = `index/${numero_facture}.json`;
    
    let oldIndex = null;
    try {
      oldIndex = await store.get(keyIndex, { type: "json" });
    } catch {}
    
    const oldVendorId = oldIndex?.vendorId || null;
    const oldAmount = Number(oldIndex?.montant_ttc || 0);

    // Sauvegarder la facture
    await store.set(keyInvoice, JSON.stringify(invoice));
    await store.set(keyIndex, JSON.stringify({ vendorId, montant_ttc }));

    // Mettre à jour le CA de la vendeuse
    const keyVendor = `ca/${vendorId}.json`;
    let vendorData = { vendorId, total: 0, updatedAt: new Date().toISOString() };
    
    try {
      vendorData = await store.get(keyVendor, { type: "json" });
    } catch {}
    
    if (oldVendorId && oldVendorId !== vendorId) {
      // Annuler l'ancien CA sur l'ancienne vendeuse
      const oldKeyVendor = `ca/${oldVendorId}.json`;
      let oldVendorData = { vendorId: oldVendorId, total: 0, updatedAt: new Date().toISOString() };
      try {
        oldVendorData = await store.get(oldKeyVendor, { type: "json" });
      } catch {}
      
      oldVendorData.total = Math.max(0, +(oldVendorData.total - oldAmount).toFixed(2));
      oldVendorData.updatedAt = new Date().toISOString();
      await store.set(oldKeyVendor, JSON.stringify(oldVendorData));
      
      // Ajouter le nouveau CA à la nouvelle vendeuse
      vendorData.total = +(vendorData.total + montant_ttc).toFixed(2);
    } else {
      // Même vendeuse: appliquer delta
      const delta = montant_ttc - oldAmount;
      vendorData.total = +(vendorData.total + delta).toFixed(2);
    }
    
    vendorData.updatedAt = new Date().toISOString();
    await store.set(keyVendor, JSON.stringify(vendorData));

    return new Response(JSON.stringify({
      ok: true,
      enqueued: 1,
      invoice,
      message: oldIndex ? 'Invoice updated' : 'Invoice created'
    }), { status: 200, headers: jsonHeaders });
  } catch (error) {
    console.error('Error processing invoice:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: 'Internal Server Error', 
      details: error.message 
    }), { status: 500, headers: jsonHeaders });
  }
};