// Stockage partagé avec caisse-facture.js (en mémoire)
let vendorTotals = {};

export default async (req) => {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId") || "sylvie";
  
  // Retourner le CA réel de la vendeuse
  const total = Number(vendorTotals[vendorId] || 0);
  
  return new Response(JSON.stringify({ 
    ok: true, 
    vendorId, 
    ca_instant: +total.toFixed(2),
    updatedAt: new Date().toISOString(),
    allVendors: vendorTotals
  }), {
    status: 200,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
  });
};