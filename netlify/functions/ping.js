export default async (req) => {
  return new Response(JSON.stringify({ 
    ok: true, 
    ts: Date.now(), 
    message: "pong" 
  }), {
    status: 200,
    headers: { 
      "content-type": "application/json", 
      "access-control-allow-origin": "*" 
    }
  });
};
