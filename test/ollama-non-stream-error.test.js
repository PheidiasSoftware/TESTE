import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createOllamaClient,
  normalizeOllamaGenerateResult
} from '../src/ollama.js';

test('normalizeOllamaGenerateResult maps Ollama error field to safe upstream error', () => {
  assert.throws(
    () => normalizeOllamaGenerateResult({ error: 'modelo\nprivado indisponível'.padEnd(400, 'x'), done: true }),
    error => error.statusCode === 502
      && error.message === 'Falha ao chamar Ollama.'
      && error.exposeDetail === false
      && error.detail === undefined
      && error.upstreamErrorDetail.length === 300
      && error.upstreamErrorDetail.startsWith('modelo privado indisponível')
      && !error.upstreamErrorDetail.includes('\n')
  );
});

test('createOllamaClient preserves safe Ollama error payload from 200 response', async () => {
  const client = createOllamaClient({
    baseUrl: 'http://127.0.0.1:11434',
    model: 'qwen',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ error: 'model not found: qwen' })
    })
  });

  await assert.rejects(
    () => client.generate('teste'),
    error => error.statusCode === 502
      && error.message === 'Falha ao chamar Ollama.'
      && error.exposeDetail === false
      && error.upstreamErrorDetail === 'model not found: qwen'
  );
});
