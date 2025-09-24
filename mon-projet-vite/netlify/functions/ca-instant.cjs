// Version simplifiée sans Netlify Blobs pour éviter les erreurs internes
const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Stockage en mémoire (temporaire pour éviter les erreurs Blobs)
let vendorTotals = {};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: jsonHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: false, error: 'Method Not Allowed' })
    };
  }

  const vendorId = (event.queryStringParameters?.vendorId || 'sylvie').toLowerCase();
  const total = Number(vendorTotals[vendorId] || 0);

  return {
    statusCode: 200,
    headers: jsonHeaders,
    body: JSON.stringify({ 
      ok: true, 
      vendorId, 
      ca_instant: +total.toFixed(2), 
      updatedAt: new Date().toISOString(),
      allVendors: vendorTotals
    })
  };
};
