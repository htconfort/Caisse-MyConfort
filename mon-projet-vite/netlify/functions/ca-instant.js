export default async (req) => {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId") || "unknown";
  // Renvoie une réponse factice avec le vendorId demandé
  return new Response(JSON.stringify({ ok: true, vendorId, ca: Math.floor(Math.random() * 1000) }), {
    status: 200,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
  });
};