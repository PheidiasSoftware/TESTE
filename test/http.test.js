import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import {
  openEventStream,
  readJsonBody,
  sendJson,
  sendServerEvent
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

test('sendJson responde JSON sem cache persistente', () => {
  const response = createMockResponse();

  sendJson(response, 201, { ok: true }, { 'x-test': '1' });

  assert.equal(response.statusCode, 201);
  assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['x-test'], '1');
  assert.equal(response.ended, true);
  assert.deepEqual(JSON.parse(response.chunks.join('')), { ok: true });
});

test('sendServerEvent formata evento SSE em uma única mensagem', () => {
  const response = createMockResponse();

  sendServerEvent(response, 'token', { token: 'abc' });

  assert.equal(response.chunks.join(''), 'event: token\ndata: {"token":"abc"}\n\n');
});

test('openEventStream configura cabeçalhos de streaming leve', () => {
  const response = createMockResponse();

  openEventStream(response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type'], 'text/event-stream; charset=utf-8');
  assert.equal(response.headers['cache-control'], 'no-store, no-transform');
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
