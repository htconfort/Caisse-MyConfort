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
  // Nettoyer la base Functions et un éventuel prefix /api/n8n restant
  let restPath = event.path
    .replace(/^\/\.netlify\/functions\/n8n/, '')
    .replace(/^\/api\/n8n/, '');
  if (!restPath.startsWith('/')) restPath = '/' + restPath;
  const targetUrl = base + restPath + (event.rawQuery ? `?${event.rawQuery}` : '');
  const body = event.body && event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  const response = await fetch(targetUrl, { method: event.httpMethod, headers: { 'Content-Type': event.headers['content-type'] || 'application/json' }, body: ['GET','HEAD'].includes(event.httpMethod) ? undefined : body });
  const text = await response.text();
  return { statusCode: response.status, headers: { ...corsHeaders, 'Content-Type': response.headers.get('content-type') || 'application/json' }, body: text };
};


