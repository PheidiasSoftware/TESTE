import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildOllamaGeneratePayload,
  createOllamaClient,
  createSafeUpstreamError,
  MAX_OLLAMA_STREAM_LINE_CHARS,
  normalizeOllamaGenerateResult,
  parseOllamaStreamLine,
  readOllamaStream,
  sanitizeOllamaOptions,
  sanitizeUpstreamErrorDetail
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

test('sanitizeUpstreamErrorDetail removes control characters and caps detail size', () => {
  const detail = sanitizeUpstreamErrorDetail(' erro\n\tcom\r\ncontrole '.padEnd(400, 'x'));

  assert.equal(detail.length, 300);
  assert.ok(detail.startsWith('erro com controle'));
  assert.equal(detail.includes('\n'), false);
  assert.equal(detail.includes('\t'), false);
});

test('sanitizeUpstreamErrorDetail omits empty or non-text detail', () => {
  assert.equal(sanitizeUpstreamErrorDetail('   '), undefined);
  assert.equal(sanitizeUpstreamErrorDetail(null), undefined);
});

test('createSafeUpstreamError keeps sanitized upstream detail internal', () => {
  const error = createSafeUpstreamError('Falha ao chamar Ollama.', {
    detail: ' valor\nprivado '.padEnd(400, 'x')
  });

  assert.equal(error.statusCode, 502);
  assert.equal(error.exposeDetail, false);
  assert.equal(error.detail, undefined);
  assert.equal(error.upstreamErrorDetail.length, 300);
  assert.ok(error.upstreamErrorDetail.startsWith('valor privado'));
  assert.equal(error.upstreamErrorDetail.includes('\n'), false);
});

test('normalizeOllamaGenerateResult accepts expected non-streaming Ollama response', () => {
  assert.deepEqual(
    normalizeOllamaGenerateResult({ response: 'ok', done: true, total_duration: 123 }),
    { response: 'ok', done: true, total_duration: 123 }
  );

  assert.deepEqual(
    normalizeOllamaGenerateResult({ response: 'parcial', done: 0 }),
    { response: 'parcial', done: false }
  );
});

test('normalizeOllamaGenerateResult rejects malformed non-streaming Ollama response', () => {
  for (const value of [null, [], 'ok', { done: true }, { response: 42, done: true }]) {
    assert.throws(
      () => normalizeOllamaGenerateResult(value),
      error => error.statusCode === 502
        && error.message === 'Resposta inválida do Ollama.'
        && error.exposeDetail === false
    );
  }
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
  assert.deepEqual(parseOllamaStreamLine('null'), null);
  assert.deepEqual(parseOllamaStreamLine('[]'), null);
  assert.deepEqual(parseOllamaStreamLine('"texto"'), null);

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
      text: async () => 'modelo\n\tnão encontrado'.padEnd(400, 'x')
    })
  });

  await assert.rejects(
    () => client.generate('teste'),
    error => error.statusCode === 502
      && error.exposeDetail === false
      && error.detail === undefined
      && error.upstreamErrorDetail.includes('modelo não encontrado')
      && error.upstreamErrorDetail.length === 300
      && !error.upstreamErrorDetail.includes('\n')
  );
});

test('createOllamaClient maps invalid JSON response to safe backend error', async () => {
  const client = createOllamaClient({
    baseUrl: 'http://127.0.0.1:11434',
    model: 'qwen',
    fetchImpl: async () => ({
      ok: true,
      json: async () => { throw new SyntaxError('Unexpected token in JSON'); }
    })
  });

  await assert.rejects(
    () => client.generate('teste'),
    error => error.statusCode === 502
      && error.message === 'Resposta inválida do Ollama.'
      && error.exposeDetail === false
      && error.upstreamErrorDetail === undefined
  );
});

test('createOllamaClient maps malformed JSON shape to safe backend error', async () => {
  const client = createOllamaClient({
    baseUrl: 'http://127.0.0.1:11434',
    model: 'qwen',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ done: true })
    })
  });

  await assert.rejects(
    () => client.generate('teste'),
    error => error.statusCode === 502
      && error.message === 'Resposta inválida do Ollama.'
      && error.exposeDetail === false
      && error.upstreamErrorDetail === undefined
  );
});

test('createOllamaClient maps streaming response without body to safe backend error', async () => {
  const client = createOllamaClient({
    baseUrl: 'http://127.0.0.1:11434',
    model: 'qwen',
    fetchImpl: async () => ({
      ok: true,
      body: null
    })
  });

  await assert.rejects(
    () => client.generateStream('teste'),
    error => error.statusCode === 502
      && error.message === 'Runtime local não retornou corpo de streaming.'
      && error.exposeDetail === false
      && error.upstreamErrorDetail === undefined
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

test('readOllamaStream parses final JSONL even without trailing newline', async () => {
  const encoder = new TextEncoder();
  const tokens = [];
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('{"response":"fim","done":false}\n'));
      controller.enqueue(encoder.encode('{"done":true,"total_duration":101}'));
      controller.close();
    }
  });

  const result = await readOllamaStream(stream, { onToken: token => tokens.push(token) });

  assert.deepEqual(tokens, ['fim']);
  assert.deepEqual(result, { response: 'fim', done: true, total_duration: 101 });
});

test('readOllamaStream rejects a malformed oversized JSONL line before growing memory unbounded', async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('x'.repeat(MAX_OLLAMA_STREAM_LINE_CHARS + 1)));
      controller.close();
    }
  });

  await assert.rejects(
    () => readOllamaStream(stream),
    error => error.statusCode === 502
      && error.message === 'Streaming do Ollama excedeu limite de linha segura.'
      && error.exposeDetail === false
      && error.upstreamErrorDetail.includes(String(MAX_OLLAMA_STREAM_LINE_CHARS))
  );
});

test('readOllamaStream releases reader lock after early done result', async () => {
  const encoder = new TextEncoder();
  let released = false;
  const body = {
    getReader() {
      return {
        async read() {
          return {
            done: false,
            value: encoder.encode('{"response":"ok","done":true,"total_duration":10}\n')
          };
        },
        releaseLock() {
          released = true;
        }
      };
    }
  };

  const result = await readOllamaStream(body);

  assert.deepEqual(result, { response: 'ok', done: true, total_duration: 10 });
  assert.equal(released, true);
});
