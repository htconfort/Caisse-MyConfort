exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Secret',
  };

  // Stockage en mémoire (persiste sur instance chaude uniquement) pour démo temps réel
  globalThis.__CAISSE_QUEUE__ = globalThis.__CAISSE_QUEUE__ || [];
  globalThis.__CAISSE_TOTALS__ = globalThis.__CAISSE_TOTALS__ || {};
  globalThis.__CAISSE_RECENT__ = globalThis.__CAISSE_RECENT__ || [];

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  const secret = process.env.DIRECT_IMPORT_SECRET || process.env.VITE_EXTERNAL_RUN_SECRET;
  const provided = event.headers['x-secret'] || event.headers['X-Secret'];

              if (event.httpMethod === 'GET') {
                // GET autorisé sans secret (polling app locale)
                const items = globalThis.__CAISSE_QUEUE__ || [];
                globalThis.__CAISSE_QUEUE__ = [];
                console.log(`📦 GET: dequeue ${items.length} factures. Queue vidée.`);
                return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, count: items.length, invoices: items }) };
              }

              if (event.httpMethod === 'POST' && event.path.endsWith('/webhook/facture')) {
                // Webhook spécifique pour app facturation → mise à jour CA instant directe
                try {
                  if (secret && provided !== secret) {
                    return { statusCode: 401, headers: cors, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
                  }

                  const bodyStr = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
                  const body = bodyStr ? JSON.parse(bodyStr) : {};

                  // Validation minimale du payload
                  if (!body.amount || !body.vendorId) {
                    return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: 'Missing amount or vendorId' }) };
                  }

                  console.log('📡 Webhook CA reçu:', body);

                  // Mettre à jour le CA instant
                  const amount = Number(body.amount);
                  const vendorId = String(body.vendorId).toLowerCase();
                  const next = Number(globalThis.__CAISSE_TOTALS__[vendorId] || 0) + amount;
                  globalThis.__CAISSE_TOTALS__[vendorId] = Math.round(next * 100) / 100;

                  // Ajouter à l'historique récent
                  globalThis.__CAISSE_RECENT__.unshift({
                    vendorId,
                    amount,
                    invoiceNumber: body.invoiceNumber,
                    date: body.date || new Date().toISOString().slice(0,10),
                    ts: Date.now()
                  });

                  if (globalThis.__CAISSE_RECENT__.length > 100) {
                    globalThis.__CAISSE_RECENT__ = globalThis.__CAISSE_RECENT__.slice(0, 100);
                  }

                  console.log('✅ CA instant mis à jour:', vendorId, globalThis.__CAISSE_TOTALS__[vendorId] + '€ (+' + amount + '€)');

                  // Créer la facture et mettre à jour le CA instant
                  const invoicePayload = {
                    invoiceNumber: body.invoiceNumber || `F-WEBHOOK-${Date.now()}`,
                    invoiceDate: body.date || new Date().toISOString().slice(0,10),
                    client: { name: body.clientName || 'Client Webhook' },
                    items: [{
                      sku: 'WEBHOOK-001',
                      name: 'Facture Webhook',
                      qty: 1,
                      unitPriceHT: body.amount / 1.2,
                      tvaRate: 0.2
                    }],
                    totals: {
                      ht: body.amount / 1.2,
                      tva: body.amount / 6,
                      ttc: body.amount
                    },
                    payment: {
                      method: 'transfer',
                      paid: true
                    },
                    channels: {
                      source: 'App Facturation',
                      via: 'Webhook Direct'
                    },
                    vendorId: body.vendorId,
                    vendorName: body.vendorName || body.vendorId,
                    idempotencyKey: `WEBHOOK-${body.invoiceNumber || Date.now()}`
                  };

                  // Stocker la facture
                  globalThis.__CAISSE_QUEUE__.push(invoicePayload);

                  console.log('✅ Facture webhook traitée:', invoicePayload.invoiceNumber, 'pour', invoicePayload.vendorName, invoicePayload.totals.ttc + '€');

                  // Notification UI
                  console.log('🔄 Notification CA instant envoyée');

                  return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, caUpdated: true, amount: body.amount, vendor: body.vendorId }) };
                } catch (e) {
                  console.error('❌ Erreur webhook CA:', e);
                  return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: e.message }) };
                }
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


