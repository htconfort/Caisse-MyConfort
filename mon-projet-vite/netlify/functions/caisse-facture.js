exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, received: body }),
    };
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Bad JSON' }) };
  }
};


