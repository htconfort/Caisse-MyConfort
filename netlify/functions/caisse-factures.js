const https = require('https');
const http = require('http');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get query parameters
    const queryString = event.queryStringParameters || {};
    const limit = queryString.limit || '50';
    
    // Base URL from environment variable
    const baseUrl = process.env.VITE_N8N_URL || process.env.VITE_N8N_TARGET || 'https://n8n.myconfort.fr';
    const targetUrl = `${baseUrl}/webhook/053170e3-fe71-4382-80c3-eaef4751cdeb?limit=${limit}`;
    
    console.log(`🔄 Caisse Factures - Proxying request to: ${targetUrl}`);
    
    // Prepare request options
    const url = new URL(targetUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET', // Always GET for listing invoices
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Caisse-Factures-Proxy/1.0'
      }
    };

    // Make the request
    const response = await new Promise((resolve, reject) => {
      const protocol = url.protocol === 'https:' ? https : http;
      
      const req = protocol.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.end();
    });

    // Return the response
    return {
      statusCode: response.statusCode,
      headers: {
        ...headers,
        ...response.headers
      },
      body: response.body
    };

  } catch (error) {
    console.error('❌ Caisse Factures - Proxy error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Caisse Factures Proxy failed',
        message: error.message
      })
    };
  }
};

