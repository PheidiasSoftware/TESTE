import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseOllamaStreamLine,
  readOllamaStream
} from '../src/ollama.js';

test('parseOllamaStreamLine preserves Ollama stream error frame without exposing raw detail by default', () => {
  const parsed = parseOllamaStreamLine('{"error":"modelo nao encontrado\ncom detalhe"}');

  assert.equal(parsed.response, '');
  assert.equal(parsed.done, false);
  assert.equal(parsed.error, 'modelo nao encontrado\ncom detalhe');
});

test('readOllamaStream maps Ollama stream error frame to safe upstream error', async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('{"response":"parcial","done":false}\n'));
      controller.enqueue(encoder.encode('{"error":"modelo\nindisponivel"}\n'));
      controller.close();
    }
  });

  await assert.rejects(
    () => readOllamaStream(stream),
    error => error.statusCode === 502
      && error.message === 'Falha ao chamar Ollama em streaming.'
      && error.exposeDetail === false
      && error.detail === undefined
      && error.upstreamErrorDetail === 'modelo indisponivel'
  );
});
