import { getStore } from "@netlify/blobs";

export default async (req) => {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId") || "sylvie";

  try {
    const store = getStore("caisse-store");
    
    // Lecture du total depuis le blob
    const data = await store.get(`ca/${vendorId}.json`, { type: "json" });
    const total = Number(data?.total || 0);

    return new Response(JSON.stringify({
      ok: true,
      vendorId,
      ca_instant: +total.toFixed(2),
      updatedAt: data?.updatedAt || new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        "content-type": "application/json", 
        "access-control-allow-origin": "*" 
      }
    });
  } catch (error) {
    console.error("Error reading CA instant:", error);
    return new Response(JSON.stringify({
      ok: true,
      vendorId,
      ca_instant: 0,
      updatedAt: new Date().toISOString(),
      error: "Storage error"
    }), {
      status: 200,
      headers: { 
        "content-type": "application/json", 
        "access-control-allow-origin": "*" 
      }
    });
  }
};