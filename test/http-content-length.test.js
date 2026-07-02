import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import { readJsonBody } from '../src/http.js';

function createMockRequest(chunks = [], { headers = {} } = {}) {
  const request = new EventEmitter();
  request.headers = headers;
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

test('readJsonBody aceita Content-Length exato', async () => {
  const body = '{"ok":true}';
  const request = createMockRequest([body], { headers: { 'content-length': String(Buffer.byteLength(body)) } });

  assert.deepEqual(await readJsonBody(request), { ok: true });
  assert.equal(request.destroyedByHelper, false);
});

test('readJsonBody rejeita Content-Length menor que o corpo real', async () => {
  const request = createMockRequest(['{"ok":true}'], { headers: { 'content-length': '2' } });

  await assert.rejects(
    () => readJsonBody(request),
    error => error.statusCode === 400 && error.message === 'Content-Length não corresponde ao tamanho real do corpo.'
  );
  assert.equal(request.destroyedByHelper, false);
});

test('readJsonBody rejeita Content-Length maior que o corpo real', async () => {
  const request = createMockRequest(['{}'], { headers: { 'content-length': '5' } });

  await assert.rejects(
    () => readJsonBody(request),
    error => error.statusCode === 400 && error.message === 'Content-Length não corresponde ao tamanho real do corpo.'
  );
  assert.equal(request.destroyedByHelper, false);
});
