import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import {
  normalizeServerEventName,
  openEventStream,
  readJsonBody,
  SECURITY_HEADERS,
  sendJson,
  sendServerEvent,
  stringifyServerEventPayload
} from '../src/http.js';

function createMockResponse() {
  return {
    statusCode: null,
    headers: null,
    chunks: [],
    ended: false,
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    write(chunk) {
      this.chunks.push(String(chunk));
    },
    end(chunk = '') {
      if (chunk) this.chunks.push(String(chunk));
      this.ended = true;
    }
  };
}

function createMockRequest(chunks = []) {
  const request = new EventEmitter();
  request.destroyedByHelper = false;
  request.destroy = () => {
    request.destroyedByHelper = true;
  };
  process.nextTick(() => {
    for (const chunk of chunks) request.emit('data', Buffer.from(chunk));
    request.emit('end');
  });
  return request;
}

function createAbortedMockRequest() {
  const request = new EventEmitter();
  request.destroy = () => {};
  process.nextTick(() => {
    request.emit('data', Buffer.from('{"a"'));
    request.emit('aborted');
    request.emit('close');
  });
  return request;
}

test('SECURITY_HEADERS define proteções HTTP leves e estáveis', () => {
  assert.deepEqual(SECURITY_HEADERS, {
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
    'cross-origin-resource-policy': 'same-origin',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()'
  });
});

test('sendJson responde JSON sem cache persistente e com headers de segurança', () => {
  const response = createMockResponse();

  sendJson(response, 201, { ok: true }, { 'x-test': '1' });

  assert.equal(response.statusCode, 201);
  assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['content-security-policy'], "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-frame-options'], 'DENY');
  assert.equal(response.headers['referrer-policy'], 'no-referrer');
  assert.equal(response.headers['cross-origin-resource-policy'], 'same-origin');
  assert.equal(response.headers['permissions-policy'], 'camera=(), microphone=(), geolocation=()');
  assert.equal(response.headers['x-test'], '1');
  assert.equal(response.ended, true);
  assert.deepEqual(JSON.parse(response.chunks.join('')), { ok: true });
});

test('sendJson não permite sobrescrever headers críticos por engano', () => {
  const response = createMockResponse();

  sendJson(response, 200, { ok: true }, {
    'content-type': 'text/html',
    'cache-control': 'public, max-age=3600',
    'content-security-policy': "default-src *",
    'x-content-type-options': 'unsafe',
    allow: 'GET'
  });

  assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['content-security-policy'], SECURITY_HEADERS['content-security-policy']);
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers.allow, 'GET');
});

test('normalizeServerEventName remove caracteres fora do token seguro e usa fallback', () => {
  assert.equal(normalizeServerEventName('token\nretry: 0\r'), 'tokenretry0');
  assert.equal(normalizeServerEventName(' token.created-v1_ok '), 'token.created-v1_ok');
  assert.equal(normalizeServerEventName('evento com espaço'), 'eventocomespao');
  assert.equal(normalizeServerEventName('\n\t'), 'message');
  assert.equal(normalizeServerEventName(null), 'message');
  assert.equal(normalizeServerEventName(null, 'safe'), 'safe');
});

test('stringifyServerEventPayload serializa valores não JSON sem quebrar SSE', () => {
  assert.equal(
    stringifyServerEventPayload({ id: 1n, marker: Symbol('x'), work: () => true, error: new Error('falha') }),
    '{"id":"1","marker":"[Symbol]","work":"[Function]","error":{"name":"Error","message":"falha"}}'
  );
});

test('stringifyServerEventPayload usa fallback seguro para payload circular', () => {
  const payload = { ok: true };
  payload.self = payload;

  assert.equal(stringifyServerEventPayload(payload), '{"error":"Payload SSE não serializável."}');
});

test('sendServerEvent formata evento SSE em uma única mensagem', () => {
  const response = createMockResponse();

  sendServerEvent(response, 'token', { token: 'abc' });

  assert.equal(response.chunks.join(''), 'event: token\ndata: {"token":"abc"}\n\n');
});

test('sendServerEvent normaliza nome de evento SSE antes de escrever no stream', () => {
  const response = createMockResponse();

  sendServerEvent(response, 'token\nevent: error', { token: 'abc' });

  assert.equal(response.chunks.join(''), 'event: tokeneventerror\ndata: {"token":"abc"}\n\n');
});

test('sendServerEvent não quebra com payload SSE contendo BigInt', () => {
  const response = createMockResponse();

  sendServerEvent(response, 'metadata', { requestId: 1n });

  assert.equal(response.chunks.join(''), 'event: metadata\ndata: {"requestId":"1"}\n\n');
});

test('openEventStream configura cabeçalhos de streaming leve e seguro', () => {
  const response = createMockResponse();

  openEventStream(response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type'], 'text/event-stream; charset=utf-8');
  assert.equal(response.headers['cache-control'], 'no-store, no-transform');
  assert.equal(response.headers['content-security-policy'], "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-frame-options'], 'DENY');
  assert.equal(response.headers['referrer-policy'], 'no-referrer');
  assert.equal(response.headers['cross-origin-resource-policy'], 'same-origin');
  assert.equal(response.headers['permissions-policy'], 'camera=(), microphone=(), geolocation=()');
  assert.equal(response.headers.connection, 'keep-alive');
});

test('readJsonBody lê JSON, aceita corpo vazio e bloqueia payload grande', async () => {
  assert.deepEqual(await readJsonBody(createMockRequest(['{"a":1}'])), { a: 1 });
  assert.deepEqual(await readJsonBody(createMockRequest(['   '])), {});

  const oversizedRequest = createMockRequest(['123456']);
  await assert.rejects(
    () => readJsonBody(oversizedRequest, { maxBodyBytes: 4 }),
    error => error.statusCode === 413
  );
  assert.equal(oversizedRequest.destroyedByHelper, true);
});

test('readJsonBody permite não destruir stream ao exceder limite quando configurado', async () => {
  const oversizedRequest = createMockRequest(['123456']);

  await assert.rejects(
    () => readJsonBody(oversizedRequest, { maxBodyBytes: 4, destroyOnLimit: false }),
    error => error.statusCode === 413
  );

  assert.equal(oversizedRequest.destroyedByHelper, false);
});

test('readJsonBody retorna erro 400 para JSON inválido', async () => {
  await assert.rejects(
    () => readJsonBody(createMockRequest(['{invalido'])),
    error => error.statusCode === 400
  );
});

test('readJsonBody rejeita JSON que não seja objeto', async () => {
  for (const payload of ['[]', 'null', 'true', '123', '"texto"']) {
    await assert.rejects(
      () => readJsonBody(createMockRequest([payload])),
      error => error.statusCode === 400 && /objeto/.test(error.message)
    );
  }
});

test('readJsonBody retorna 499 quando cliente encerra antes do corpo completo', async () => {
  await assert.rejects(
    () => readJsonBody(createAbortedMockRequest()),
    error => error.statusCode === 499 && error.code === 'CLIENT_CLOSED_REQUEST'
  );
});
