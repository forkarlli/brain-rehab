const ALLOWED_ORIGIN = 'https://forkarlli.github.io';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing x-api-key header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': request.headers.get('anthropic-version') ?? '2023-06-01',
      },
      body: request.body,
    });

    return new Response(anthropicResp.body, {
      status: anthropicResp.status,
      statusText: anthropicResp.statusText,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });
  },
};
