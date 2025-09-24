// mon-projet-vite/netlify/functions/ping.mjs
export default async (req, ctx) => {
  const json = {
    ok: true,
    name: ctx?.functionName || "ping",
    url: req?.url || null,
    time: new Date().toISOString()
  };
  return new Response(JSON.stringify(json), {
    status: 200,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
};
