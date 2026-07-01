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

const POST_ROUTES = [
  '/api/generate',
  '/api/generate-stream',
  '/api/read-file',
  '/api/large-code-plan'
];

test('rotas POST rejeitam Content-Type não JSON de forma consistente', async () => {
  await withTestServer(async baseUrl => {
    for (const route of POST_ROUTES) {
      const response = await fetch(`${baseUrl}${route}`, {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'task=Gerar codigo'
      });
      const body = await response.json();

      assert.equal(response.status, 415, route);
      assert.match(body.error, /Content-Type precisa ser application\/json/, route);
      assert.equal(body.expectedContentType, 'application/json', route);
      assert.equal(typeof body.requestId, 'string', route);
    }
  });
});

test('rotas POST aceitam media type JSON estruturado com sufixo +json', async () => {
  await withTestServer(async baseUrl => {
    for (const route of POST_ROUTES) {
      const response = await fetch(`${baseUrl}${route}`, {
        method: 'POST',
        headers: { 'content-type': 'application/vnd.teste+json; charset=utf-8' },
        body: JSON.stringify({})
      });
      const body = await response.json();

      assert.notEqual(response.status, 415, route);
      assert.equal(response.headers.get('content-type').startsWith('application/json'), true, route);
      assert.equal(typeof body.requestId, 'string', route);
    }
  });
});
