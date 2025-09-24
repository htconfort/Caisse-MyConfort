exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  const json = {
    ok: true,
    name: "caisse-functions",
    functions: ["caisse-facture", "ca-instant", "ping"],
    url: event.url || null,
    time: new Date().toISOString(),
    blobs: true
  };

  return {
    statusCode: 200,
    headers: { "content-type": "application/json", ...cors },
    body: JSON.stringify(json)
  };
};
