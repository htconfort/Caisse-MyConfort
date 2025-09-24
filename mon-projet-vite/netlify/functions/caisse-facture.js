export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Use POST' }), { 
      status: 405, 
      headers: { 
        'content-type':'application/json',
        'access-control-allow-origin':'*' 
      }
    });
  }
  
  const secret = req.headers.get('x-secret') || '';
  if (secret !== (process.env.CAISSE_SECRET || 'MySuperSecretKey2025')) {
    return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { 
      status: 403, 
      headers: { 
        'content-type':'application/json',
        'access-control-allow-origin':'*' 
      }
    });
  }
  
  const body = await req.json().catch(()=> ({}));
  return new Response(JSON.stringify({ 
    ok: true, 
    enqueued: 1, 
    received: body,
    rev: "20250124-190500"
  }), {
    status: 200,
    headers: { 
      'content-type':'application/json',
      'access-control-allow-origin':'*' 
    }
  });
};
