import assert from 'node:assert/strict';
import test from 'node:test';

import { server } from '../src/server.js';

async function withTestServer(callback) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    return await callback(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  }
}

test('POST /api/generate rejeita task vazia ou somente espaços antes de chamar Ollama', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task: String.fromCharCode(32, 32, 32, 10, 9, 32, 32), language: 'Node.js' })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /task precisa ser texto não vazio/);
    assert.equal(typeof body.requestId, 'string');
  });
});

test('POST /api/generate-stream rejeita task vazia antes de abrir SSE', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/generate-stream`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task: '', language: 'Dart' })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /task precisa ser texto não vazio/);
    assert.equal(typeof body.requestId, 'string');
  });
});
