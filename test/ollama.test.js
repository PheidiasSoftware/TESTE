import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildOllamaGeneratePayload,
  createOllamaClient,
  parseOllamaStreamLine,
  readOllamaStream,
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

test('createOllamaClient calls non-streaming generate endpoint', async () => {
  const calls = [];
  const client = createOllamaClient({
    baseUrl: 'http://127.0.0.1:11434/',
    model: 'qwen2.5-coder:1.5b-instruct',
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        json: async () => ({ response: 'ok', done: true })
      };
    }
  });

  const result = await client.generate('Crie uma função JS.');

  assert.deepEqual(result, { response: 'ok', done: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://127.0.0.1:11434/api/generate');

  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.stream, false);
  assert.equal(body.model, 'qwen2.5-coder:1.5b-instruct');
  assert.equal(body.options.num_ctx, 2048);
});

test('createOllamaClient maps Ollama failures to safe backend error', async () => {
  const client = createOllamaClient({
    baseUrl: 'http://127.0.0.1:11434',
    model: 'qwen',
    fetchImpl: async () => ({
      ok: false,
      text: async () => 'modelo não encontrado'
    })
  });

  await assert.rejects(
    () => client.generate('teste'),
    error => error.statusCode === 502 && error.detail.includes('modelo')
  );
});

test('readOllamaStream aggregates tokens and notifies caller', async () => {
  const encoder = new TextEncoder();
  const tokens = [];
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('{"response":"ol","done":false}\n'));
      controller.enqueue(encoder.encode('{"response":"á","done":false}\n'));
      controller.enqueue(encoder.encode('{"done":true,"total_duration":99}\n'));
      controller.close();
    }
  });

  const result = await readOllamaStream(stream, { onToken: token => tokens.push(token) });

  assert.deepEqual(tokens, ['ol', 'á']);
  assert.deepEqual(result, { response: 'olá', done: true, total_duration: 99 });
});
