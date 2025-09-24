export default async () => {
  return new Response(JSON.stringify({
    ok: true,
    message: "Hello from test function",
    time: new Date().toISOString(),
    rev: "20250124-190200"
  }), { 
    status: 200, 
    headers: { 
      "content-type": "application/json", 
      "access-control-allow-origin": "*" 
    } 
  });
};