exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Secret',
  };

  // Stockage en mémoire (persiste sur instance chaude uniquement) pour démo temps réel
  globalThis.__CAISSE_QUEUE__ = globalThis.__CAISSE_QUEUE__ || [];

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  const secret = process.env.DIRECT_IMPORT_SECRET || process.env.VITE_EXTERNAL_RUN_SECRET;
  const provided = event.headers['x-secret'] || event.headers['X-Secret'];

  if (event.httpMethod === 'GET') {
    // GET autorisé sans secret (polling app locale)
    const items = globalThis.__CAISSE_QUEUE__;
    globalThis.__CAISSE_QUEUE__ = [];
    console.log(`📦 GET: dequeue ${items.length} factures. Queue vide.`);
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, count: items.length, invoices: items }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ ok: false, error: 'Method Not Allowed' }) };
  }

  try {
    if (secret && provided !== secret) {
      return { statusCode: 401, headers: cors, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
    }

    const bodyStr = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    const body = bodyStr ? JSON.parse(bodyStr) : {};
    // Normaliser unitairement OU liste
    const list = Array.isArray(body) ? body : (Array.isArray(body.invoices) ? body.invoices : [body]);

    // Validation minimale + normalisation légère
    const sanitized = list.map((raw) => ({
      numero_facture: String(raw.numero_facture || raw.invoiceNumber || raw.id || ''),
      date_facture: String(raw.date_facture || raw.invoiceDate || new Date().toISOString().slice(0,10)),
      nom_client: raw.nom_client || raw.client?.name || 'Client',
      montant_ttc: Number(raw.montant_ttc || raw.totalTTC || raw.amount || 0),
      payment_method: raw.payment_method || raw.payment?.method || 'card',
      vendeuse: raw.vendeuse || raw.vendorName || 'Externe',
      vendorId: raw.vendorId || 'external',
      produits: Array.isArray(raw.produits) ? raw.produits : (Array.isArray(raw.items) ? raw.items.map(i=>({nom:i.name,prix_ht:i.unitPriceHT,quantite:i.qty})) : [])
    }));

    // Enqueue pour récupération par l'app (polling)
    globalThis.__CAISSE_QUEUE__.push(...sanitized);

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, enqueued: sanitized.length }) };
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};


