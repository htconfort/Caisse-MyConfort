export default async (req, ctx) => {
  return new Response(JSON.stringify({
    ok: true,
    name: ctx?.functionName || "ping2",
    time: new Date().toISOString(),
    rev: "20250124-184500"
  }), { 
    status: 200, 
    headers: { 
      "content-type": "application/json", 
      "access-control-allow-origin": "*" 
    } 
  });
};

// rev: 20250124-184500