import assert from 'node:assert/strict';
import test from 'node:test';

import { server } from '../src/server.js';

async function withTestServer(callback) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  }
}

function assertStatusDoesNotExposeLocalSecrets(body) {
  const serialized = JSON.stringify(body);

  assert.equal(body.ollama.endpoint, 'redacted');
  assert.equal(Object.hasOwn(body, 'ollamaUrl'), false);
  assert.equal(Object.hasOwn(body, 'OLLAMA_URL'), false);
  assert.equal(Object.hasOwn(body.fileRead, 'projectRoot'), false);
  assert.equal(serialized.includes('11434'), false);
  assert.equal(serialized.includes('PROJECT_ROOT'), false);
}

test('GET /health keeps Ollama URL and project root sanitized', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assertStatusDoesNotExposeLocalSecrets(body);
  });
});

test('GET /api/status keeps Ollama URL and project root sanitized', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/status`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assertStatusDoesNotExposeLocalSecrets(body);
  });
});
