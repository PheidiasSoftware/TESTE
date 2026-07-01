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

test('POST /api/generate sugere large-code-plan quando contexto manual excede limite', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        language: 'Node.js',
        task: 'Revise este contexto e aponte melhorias pequenas.',
        context: 'x'.repeat(13_000)
      })
    });
    const body = await response.json();

    assert.equal(response.status, 422);
    assert.match(body.error, /tarefa parece grande/i);
    assert.equal(body.largeCodeSuggestion.recommendedEndpoint, 'POST /api/large-code-plan');
    assert.ok(body.largeCodeSuggestion.reasons.includes('context-truncated'));
    assert.equal(body.largeCodeSuggestion.detection.contextTruncated, true);
    assert.equal(typeof body.requestId, 'string');
  });
});
