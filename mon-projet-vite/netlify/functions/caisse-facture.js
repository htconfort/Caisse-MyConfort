exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Secret',
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ ok: false, error: 'Method Not Allowed' }) };
  }
  try {
    const secret = process.env.DIRECT_IMPORT_SECRET || process.env.VITE_EXTERNAL_RUN_SECRET;
    const provided = event.headers['x-secret'] || event.headers['X-Secret'];
    if (secret && provided !== secret) {
      return { statusCode: 401, headers: cors, body: JSON.stringify({ ok: false, error: 'Unauthorized' }) };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    // Normaliser unitairement OU liste
    const list = Array.isArray(body) ? body : (Array.isArray(body.invoices) ? body.invoices : [body]);

    // Validation minimale
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

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, count: sanitized.length, invoices: sanitized }) };
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};


