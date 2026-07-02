import { StringDecoder } from 'node:string_decoder';

const MAX_SERVER_EVENT_NAME_LENGTH = 64;

export const SECURITY_HEADERS = {
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'cross-origin-resource-policy': 'same-origin',
  'cross-origin-opener-policy': 'same-origin',
  'x-permitted-cross-domain-policies': 'none',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()'
};

function sanitizeServerEventName(value) {
  return typeof value === 'string'
    ? value.replace(/[^A-Za-z0-9_.-]+/g, '').trim().slice(0, MAX_SERVER_EVENT_NAME_LENGTH)
    : '';
}

export function normalizeServerEventName(value, fallback = 'message') {
  const normalized = sanitizeServerEventName(value);
  if (normalized) return normalized;

  const normalizedFallback = sanitizeServerEventName(fallback);
  return normalizedFallback || 'message';
}

function createSafeJsonReplacer() {
  const seen = new WeakSet();

  return (_key, value) => {
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'symbol') return '[Symbol]';
    if (typeof value === 'function') return '[Function]';
    if (value instanceof Error) return { name: value.name, message: value.message };

    if (value !== null && typeof value === 'object') {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }

    return value;
  };
}

export function stringifyJsonPayload(payload) {
  try {
    return JSON.stringify(payload, createSafeJsonReplacer(), 2);
  } catch {
    return JSON.stringify({ error: 'Payload JSON não serializável.' }, null, 2);
  }
}

export function stringifyServerEventPayload(payload) {
  try {
    return JSON.stringify(payload, createSafeJsonReplacer());
  } catch {
    return JSON.stringify({ error: 'Payload SSE não serializável.' });
  }
}

export function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    ...headers,
    ...SECURITY_HEADERS,
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(stringifyJsonPayload(payload));
}

export function sendServerEvent(response, event, payload) {
  response.write(`event: ${normalizeServerEventName(event)}\n`);
  response.write(`data: ${stringifyServerEventPayload(payload)}\n\n`);
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

function createPayloadTooLargeError() {
  return Object.assign(new Error('Payload muito grande.'), { statusCode: 413 });
}

function parseContentLengthHeader(value) {
  if (value === undefined || value === null || value === '') return null;

  const normalized = String(value).trim();
  if (!/^\d+$/.test(normalized)) return null;

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function isPlainJsonObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeBodyChunk(chunk) {
  return Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
}

export function readJsonBody(request, { maxBodyBytes = 65_536, destroyOnLimit = true } = {}) {
  return new Promise((resolve, reject) => {
    const decoder = new StringDecoder('utf8');
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

    const declaredContentLength = parseContentLengthHeader(request.headers?.['content-length']);
    if (declaredContentLength !== null && declaredContentLength > maxBodyBytes) {
      fail(createPayloadTooLargeError());
      if (destroyOnLimit && typeof request.destroy === 'function') request.destroy();
      return;
    }

    request.on('data', chunk => {
      if (settled) return;
      const buffer = normalizeBodyChunk(chunk);
      size += buffer.length;

      if (size > maxBodyBytes) {
        fail(createPayloadTooLargeError());
        if (destroyOnLimit && typeof request.destroy === 'function') request.destroy();
        return;
      }

      raw += decoder.write(buffer);
    });

    request.on('end', () => {
      if (settled) return;
      ended = true;
      raw += decoder.end();

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
