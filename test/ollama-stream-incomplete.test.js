import assert from 'node:assert/strict';
import test from 'node:test';

import { readOllamaStream } from '../src/ollama.js';

test('readOllamaStream rejects stream that ends without done marker', async () => {
  const encoder = new TextEncoder();
  const tokens = [];
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('{"response":"parcial","done":false}\n'));
      controller.close();
    }
  });

  await assert.rejects(
    () => readOllamaStream(stream, { onToken: token => tokens.push(token) }),
    error => error.statusCode === 502
      && error.message === 'Streaming do Ollama terminou sem confirmação de conclusão.'
      && error.exposeDetail === false
      && error.upstreamErrorDetail === undefined
  );

  assert.deepEqual(tokens, ['parcial']);
});
