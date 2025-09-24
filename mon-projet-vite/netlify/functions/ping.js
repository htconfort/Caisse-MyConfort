export default async (req, ctx) => {
  return new Response(JSON.stringify({
    ok: true,
    name: "ping",
    time: new Date().toISOString(),
    rev: "20250124-190000"
  }), { 
    status: 200, 
    headers: { 
      "content-type": "application/json", 
      "access-control-allow-origin": "*" 
    } 
  });
};
