import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildOllamaGeneratePayload,
  parseOllamaStreamLine,
  sanitizeOllamaOptions
} from '../src/ollama.js';

test('buildOllamaGeneratePayload builds conservative payload', () => {
  const payload = buildOllamaGeneratePayload({
    model: 'qwen2.5-coder:1.5b-instruct',
    prompt: 'Explain a JS function.',
    stream: true
  });

  assert.deepEqual(payload, {
    model: 'qwen2.5-coder:1.5b-instruct',
    prompt: 'Explain a JS function.',
    stream: true,
    options: {
      num_ctx: 2048,
      num_predict: 512,
      temperature: 0.2
    }
  });
});

test('sanitizeOllamaOptions clamps values', () => {
  assert.deepEqual(
    sanitizeOllamaOptions({ num_ctx: 999999, num_predict: 999999, temperature: 5 }),
    { num_ctx: 4096, num_predict: 2048, temperature: 1 }
  );

  assert.deepEqual(
    sanitizeOllamaOptions({ num_ctx: 1, num_predict: 1, temperature: -1 }),
    { num_ctx: 512, num_predict: 64, temperature: 0 }
  );
});

test('buildOllamaGeneratePayload rejects missing model or prompt', () => {
  assert.throws(
    () => buildOllamaGeneratePayload({ prompt: 'test' }),
    error => error.statusCode === 500 && error.message.includes('Modelo')
  );

  assert.throws(
    () => buildOllamaGeneratePayload({ model: 'qwen' }),
    error => error.statusCode === 500 && error.message.includes('Prompt')
  );
});

test('parseOllamaStreamLine parses JSONL and ignores noise', () => {
  assert.deepEqual(parseOllamaStreamLine(''), null);
  assert.deepEqual(parseOllamaStreamLine('not json'), null);

  const parsed = parseOllamaStreamLine('{"response":"abc","done":false}');
  assert.equal(parsed.response, 'abc');
  assert.equal(parsed.done, false);
  assert.equal(parsed.total_duration, undefined);

  const done = parseOllamaStreamLine('{"done":true,"total_duration":123}');
  assert.equal(done.response, '');
  assert.equal(done.done, true);
  assert.equal(done.total_duration, 123);
});
