// Netlify Function: proxy vers n8n pour éviter CORS et masquer le domaine
// Maps: /api/n8n/* -> https://n8n.../webhook/*

exports.handler = async function(event) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  const base = process.env.N8N_BASE_WEBHOOK_URL || 'https://n8n.srv765811.hstgr.cloud/webhook';
  const secret = process.env.VITE_N8N_WEBHOOK_SECRET || process.env.N8N_WEBHOOK_SECRET || '';

  // Exemple: /.netlify/functions/n8n/webhook/caisse/facture -> /webhook/caisse/facture
  const restPath = event.path.replace(/^\/\.netlify\/functions\/n8n/, '');
  const targetUrl = base + restPath + (event.rawQuery ? `?${event.rawQuery}` : '');

  const body = event.body && event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  const forwardHeaders = {
    'Content-Type': event.headers['content-type'] || 'application/json',
  };
  if (secret) {
    forwardHeaders['x-webhook-secret'] = secret;
  }

  const response = await fetch(targetUrl, {
    method: event.httpMethod,
    headers: forwardHeaders,
    body: ['GET', 'HEAD'].includes(event.httpMethod) ? undefined : body,
  });

  const text = await response.text();
  const ct = response.headers.get('content-type') || 'application/json';

  return {
    statusCode: response.status,
    headers: { ...corsHeaders, 'Content-Type': ct },
    body: text,
  };
};



