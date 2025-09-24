export default async (req) => {
  return new Response(JSON.stringify({ ok: true, ts: Date.now(), message: "pong" }), {
    status: 200,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
  });
};
# Timestamp: Wed Sep 24 19:48:50 CEST 2025
