// mon-projet-vite/netlify/functions/ca-instant.cjs (CommonJS)
const { getStore } = require('@netlify/blobs');

const STORE = getStore({
  name: 'caisse-store',
  consistency: 'strong',
  siteID: process.env.NETLIFY_SITE_ID,
  token: process.env.NETLIFY_BLOBS_ACCESS_TOKEN
});
const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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
  const key = `ca/${vendorId}.json`;

  try {
    const data = await STORE.get(key, { type: 'json' });
    const total = Number(data?.total || 0);

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({
        ok: true,
        vendorId,
        ca_instant: +total.toFixed(2),
        updatedAt: data?.updatedAt || null
      })
    };
  } catch (error) {
    console.error('Error in ca-instant function:', error);
    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: true, vendorId, ca_instant: 0, updatedAt: null })
    };
  }
};