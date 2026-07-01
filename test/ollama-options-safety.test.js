import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildOllamaGeneratePayload,
  sanitizeOllamaOptions
} from '../src/ollama.js';

test('sanitizeOllamaOptions ignores unsupported heavy runtime options', () => {
  const sanitized = sanitizeOllamaOptions({
    num_ctx: 2048,
    num_predict: 512,
    temperature: 0.2,
    num_gpu: 99,
    main_gpu: 1,
    low_vram: false,
    use_mmap: false,
    keep_alive: '24h'
  });

  assert.deepEqual(sanitized, {
    num_ctx: 2048,
    num_predict: 512,
    temperature: 0.2
  });
  assert.equal(Object.hasOwn(sanitized, 'num_gpu'), false);
  assert.equal(Object.hasOwn(sanitized, 'keep_alive'), false);
});

test('buildOllamaGeneratePayload keeps conservative defaults when options are omitted', () => {
  const payload = buildOllamaGeneratePayload({
    model: 'qwen2.5-coder:1.5b-instruct',
    prompt: 'Revise uma função Node.js pequena.'
  });

  assert.deepEqual(payload.options, {
    num_ctx: 2048,
    num_predict: 512,
    temperature: 0.2
  });
  assert.equal(payload.stream, false);
});

test('buildOllamaGeneratePayload clamps allowed options for weak CPU-only PCs', () => {
  const payload = buildOllamaGeneratePayload({
    model: 'qwen2.5-coder:1.5b-instruct',
    prompt: 'Explique este código Dart.',
    stream: true,
    options: {
      num_ctx: 999999,
      num_predict: 999999,
      temperature: 5,
      num_gpu: 4
    }
  });

  assert.deepEqual(payload.options, {
    num_ctx: 4096,
    num_predict: 2048,
    temperature: 1
  });
  assert.equal(payload.stream, true);
  assert.equal(Object.hasOwn(payload.options, 'num_gpu'), false);
});
