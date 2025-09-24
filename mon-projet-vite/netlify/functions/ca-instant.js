export default async (req) => {
  const url = new URL(req.url);
  const vendorId = (url.searchParams.get('vendorId') || 'sylvie').toLowerCase();
  
  return new Response(JSON.stringify({ 
    ok: true, 
    vendorId, 
    ca_instant: 0, 
    updatedAt: new Date().toISOString(),
    rev: "20250124-190500"
  }), {
    status: 200,
    headers: { 
      "content-type": "application/json", 
      "access-control-allow-origin": "*" 
    }
  });
};