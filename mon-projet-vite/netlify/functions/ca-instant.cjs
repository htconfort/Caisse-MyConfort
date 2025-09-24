exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', ...cors },
      body: JSON.stringify({ ok: false, error: 'Method not allowed' })
    };
  }

  try {
    const qs = event.queryStringParameters || {};
    const vendorId = (qs.vendorId || '').toLowerCase() || null;

    const totals = globalThis.__CAISSE_TOTALS__ || {};
    const recent = globalThis.__CAISSE_RECENT__ || [];

    const payload = vendorId
      ? { vendorId, total: Number(totals[vendorId] || 0) }
      : { totals, recent };

    console.log('📊 CA instant demandé:', vendorId || 'tous', '→', payload);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...cors },
      body: JSON.stringify({ ok: true, ...payload })
    };
  } catch (error) {
    console.error('❌ Erreur CA instant:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', ...cors },
      body: JSON.stringify({
        ok: false,
        error: 'Server error',
        message: String(error && error.message || error)
      })
    };
  }
};
