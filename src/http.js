export const SECURITY_HEADERS = {
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'cross-origin-resource-policy': 'same-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()'
};

export function normalizeServerEventName(value, fallback = 'message') {
  const normalized = typeof value === 'string'
    ? value.replace(/[^A-Za-z0-9_.-]+/g, '').trim()
    : '';

  return normalized || fallback;
}

export function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    ...SECURITY_HEADERS,
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers
  });
  response.end(JSON.stringify(payload, null, 2));
}

export function sendServerEvent(response, event, payload) {
  response.write(`event: ${normalizeServerEventName(event)}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function openEventStream(response) {
  response.writeHead(200, {
    ...SECURITY_HEADERS,
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-store, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no'
  });
}

function createClientClosedError() {
  return Object.assign(new Error('Requisição encerrada pelo cliente antes do corpo ser lido.'), {
    statusCode: 499,
    code: 'CLIENT_CLOSED_REQUEST'
  });
}

function isPlainJsonObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function readJsonBody(request, { maxBodyBytes = 65_536, destroyOnLimit = true } = {}) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let raw = '';
    let settled = false;
    let ended = false;

    function fail(error) {
      if (settled) return;
      settled = true;
      reject(error);
    }

    function finish(value) {
      if (settled) return;
      settled = true;
      resolve(value);
    }

    request.on('data', chunk => {
      if (settled) return;
      size += chunk.length;

      if (size > maxBodyBytes) {
        fail(Object.assign(new Error('Payload muito grande.'), { statusCode: 413 }));
        if (destroyOnLimit && typeof request.destroy === 'function') request.destroy();
        return;
      }

      raw += chunk;
    });

    request.on('end', () => {
      if (settled) return;
      ended = true;

      if (!raw.trim()) {
        finish({});
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        if (!isPlainJsonObject(parsed)) {
          fail(Object.assign(new Error('JSON precisa ser um objeto.'), { statusCode: 400 }));
          return;
        }

        finish(parsed);
      } catch (error) {
        if (error?.statusCode) {
          fail(error);
          return;
        }

        fail(Object.assign(new Error('JSON inválido.'), { statusCode: 400 }));
      }
    });

    request.on('aborted', () => {
      fail(createClientClosedError());
    });

    request.on('close', () => {
      if (!ended) fail(createClientClosedError());
    });

    request.on('error', error => {
      if (settled && error?.code === 'ERR_STREAM_PREMATURE_CLOSE') return;
      fail(error);
    });
  });
}
