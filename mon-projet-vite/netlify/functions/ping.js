export default async (req) => {
  return new Response(JSON.stringify({
    ok: true,
    name: "ping",
    time: new Date().toISOString(),
    rev: "20250124-190500"
  }), { 
    status: 200, 
    headers: { 
      "content-type": "application/json", 
      "access-control-allow-origin": "*" 
    } 
  });
};