// Version simplifiée sans Netlify Blobs pour éviter les erreurs internes
const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Stockage en mémoire (temporaire pour éviter les erreurs Blobs)
let vendorTotals = {};

export default async (req, ctx) => {
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: jsonHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: jsonHeaders
    });
  }

  const url = new URL(req.url);
  const vendorId = (url.searchParams.get('vendorId') || 'sylvie').toLowerCase();
  const total = Number(vendorTotals[vendorId] || 0);

  return new Response(JSON.stringify({ 
    ok: true, 
    vendorId, 
    ca_instant: +total.toFixed(2), 
    updatedAt: new Date().toISOString(),
    allVendors: vendorTotals,
    rev: "20250124-184500"
  }), {
    status: 200,
    headers: jsonHeaders
  });
};

// rev: 20250124-184500