// mon-projet-vite/netlify/functions/ca-instant.mjs
import { getStore } from '@netlify/blobs';

const STORE = getStore({ name: 'caisse-store', consistency: 'strong' });
const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: jsonHeaders });
  if (req.method !== 'GET') return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), { status: 405, headers: jsonHeaders });

  const url = new URL(req.url);
  const vendorId = (url.searchParams.get('vendorId') || 'sylvie').toLowerCase();
  const key = `ca/${vendorId}.json`;
  const data = await STORE.get(key, { type: 'json' }).catch(() => null);
  const total = Number(data?.total || 0);

  return new Response(JSON.stringify({ ok: true, vendorId, ca_instant: +total.toFixed(2), updatedAt: data?.updatedAt || null }), { status: 200, headers: jsonHeaders });
};
