/**
 * Worker/Endpoint simple pour recevoir les factures externes
 * Compatible avec Cloudflare Workers, Vercel Edge, ou Node.js
 * Version: 3.8.1 - MyConfort
 */

// Type pour la requête d'invoice
interface InvoiceRequest {
  invoiceNumber: string;
  invoiceDate: string;
  client: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    siret?: string;
  };
  items: Array<{
    sku?: string;
    name: string;
    qty: number;
    unitPriceHT: number;
    tvaRate: number;
  }>;
  totals: {
    ht: number;
    tva: number;
    ttc: number;
  };
  payment?: {
    method?: string;
    paid?: boolean;
    paidAmount?: number;
    depositRate?: number;
  };
  channels?: {
    source?: string;
    via?: string;
  };
  pdfBase64?: string;
  idempotencyKey?: string;
}

// Configuration
const CONFIG = {
  SECRET_TOKEN: 'myconfort-secret-2025',
  CORS_ORIGINS: ['http://localhost:5187', 'https://your-domain.com'],
  MAX_BODY_SIZE: 10 * 1024 * 1024, // 10MB
};

/**
 * Handler principal pour les requêtes
 */
async function handleRequest(request: Request): Promise<Response> {
  // Headers CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
  };

  // Gestion des requêtes OPTIONS (preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Vérification de l'authentification
  const authToken = request.headers.get('x-auth-token') || request.headers.get('X-Auth-Token');
  if (!authToken || authToken !== CONFIG.SECRET_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Token d\'authentification invalide' }), 
      { 
        status: 403, 
        headers: corsHeaders 
      }
    );
  }

  try {
    // GET: Retourner le statut du service
    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          service: 'MyConfort External Invoice Receiver',
          version: '3.8.1',
          status: 'active',
          timestamp: new Date().toISOString(),
          endpoints: {
            'POST /': 'Recevoir une facture',
            'GET /': 'Statut du service'
          }
        }),
        { headers: corsHeaders }
      );
    }

    // POST: Recevoir une facture
    if (request.method === 'POST') {
      // Vérification de la taille du body
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > CONFIG.MAX_BODY_SIZE) {
        return new Response(
          JSON.stringify({ error: 'Payload too large', maxSize: CONFIG.MAX_BODY_SIZE }),
          { status: 413, headers: corsHeaders }
        );
      }

      // Parse du JSON
      let invoiceData: InvoiceRequest;
      try {
        invoiceData = await request.json();
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON', message: 'Format JSON invalide' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Validation des champs obligatoires
      const validationErrors = validateInvoiceData(invoiceData);
      if (validationErrors.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Validation failed', 
            errors: validationErrors 
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Ajout de la clé d'idempotence si manquante
      if (!invoiceData.idempotencyKey) {
        invoiceData.idempotencyKey = invoiceData.invoiceNumber;
      }

      // Log de la facture reçue
      console.log(`📄 Facture reçue: ${invoiceData.invoiceNumber}`, {
        client: invoiceData.client.name,
        total: invoiceData.totals.ttc,
        items: invoiceData.items.length
      });

      // TODO: Ici vous pouvez persister la facture dans votre base de données
      // Exemples :
      // - Cloudflare D1 : await env.DB.prepare('INSERT INTO invoices ...').bind(...).run()
      // - Supabase : await supabase.from('invoices').insert(invoiceData)
      // - Firestore : await db.collection('invoices').add(invoiceData)
      
      // Pour l'instant, on simule la sauvegarde
      await simulatePersistence(invoiceData);

      // Réponse de succès
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Facture reçue et traitée avec succès',
          invoiceNumber: invoiceData.invoiceNumber,
          idempotencyKey: invoiceData.idempotencyKey,
          timestamp: new Date().toISOString()
        }),
        { headers: corsHeaders }
      );
    }

    // Méthode non supportée
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ Erreur dans handleRequest:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: 'Erreur interne du serveur' 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Validation des données de facture
 */
function validateInvoiceData(data: any): string[] {
  const errors: string[] = [];

  if (!data.invoiceNumber) errors.push('invoiceNumber is required');
  if (!data.invoiceDate) errors.push('invoiceDate is required');
  if (!data.client?.name) errors.push('client.name is required');
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('items array is required and must not be empty');
  }
  if (!data.totals?.ttc || typeof data.totals.ttc !== 'number') {
    errors.push('totals.ttc is required and must be a number');
  }

  // Validation des items
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item: any, index: number) => {
      if (!item.name) errors.push(`items[${index}].name is required`);
      if (typeof item.qty !== 'number' || item.qty <= 0) {
        errors.push(`items[${index}].qty must be a positive number`);
      }
      if (typeof item.unitPriceHT !== 'number' || item.unitPriceHT < 0) {
        errors.push(`items[${index}].unitPriceHT must be a non-negative number`);
      }
      if (typeof item.tvaRate !== 'number' || item.tvaRate < 0) {
        errors.push(`items[${index}].tvaRate must be a non-negative number`);
      }
    });
  }

  return errors;
}

/**
 * Simulation de la persistance (à remplacer par votre vraie DB)
 */
async function simulatePersistence(invoiceData: InvoiceRequest): Promise<void> {
  // Simuler un délai de base de données
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Log pour debug
  console.log('💾 Facture sauvegardée (simulation):', {
    number: invoiceData.invoiceNumber,
    client: invoiceData.client.name,
    total: invoiceData.totals.ttc,
    date: invoiceData.invoiceDate
  });
}

// Export pour différents environnements

// 1. Cloudflare Workers
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    return handleRequest(request);
  }
};

// 2. Vercel Edge Runtime
export async function GET(request: Request): Promise<Response> {
  return handleRequest(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleRequest(request);
}

export async function OPTIONS(request: Request): Promise<Response> {
  return handleRequest(request);
}

// 3. Node.js/Express (exemple)
/*
const express = require('express');
const app = express();

app.use(express.json({ limit: '10mb' }));

app.all('/api/invoices', async (req, res) => {
  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: req.method !== 'GET' ? JSON.stringify(req.body) : null
  });
  
  const response = await handleRequest(request);
  const data = await response.json();
  
  res.status(response.status).json(data);
});

app.listen(3001, () => {
  console.log('🚀 Invoice API listening on port 3001');
});
*/
