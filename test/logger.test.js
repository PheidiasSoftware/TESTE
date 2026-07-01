import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createStructuredLogger,
  redactForLog
} from '../src/logger.js';

test('redactForLog oculta campos sensíveis em objetos aninhados', () => {
  const result = redactForLog({
    user: 'local',
    token: 'abc123',
    nested: {
      password: 'segredo',
      value: 'ok'
    },
    items: [
      { apiKey: 'chave' },
      { name: 'safe' }
    ]
  });

  assert.equal(result.user, 'local');
  assert.equal(result.token, '[redacted]');
  assert.equal(result.nested.password, '[redacted]');
  assert.equal(result.nested.value, 'ok');
  assert.equal(result.items[0].apiKey, '[redacted]');
  assert.equal(result.items[1].name, 'safe');
});

test('redactForLog oculta caminhos locais e URLs operacionais sensíveis', () => {
  const result = redactForLog({
    projectRoot: 'C:/Users/marcelo/projetos/TESTE',
    ollamaUrl: 'http://127.0.0.1:11434',
    baseUrl: 'http://localhost:11434',
    model: 'qwen2.5-coder:1.5b-instruct',
    queue: {
      activeGenerations: 1
    }
  });

  assert.equal(result.projectRoot, '[redacted]');
  assert.equal(result.ollamaUrl, '[redacted]');
  assert.equal(result.baseUrl, '[redacted]');
  assert.equal(result.model, 'qwen2.5-coder:1.5b-instruct');
  assert.equal(result.queue.activeGenerations, 1);
});

test('redactForLog oculta detalhes brutos de erros externos', () => {
  const result = redactForLog({
    upstreamErrorDetail: 'prompt do usuário e trecho de código local',
    detail: 'stack ou payload bruto do runtime local',
    statusCode: 502,
    safeSummary: 'Falha ao chamar runtime local.'
  });

  assert.equal(result.upstreamErrorDetail, '[redacted]');
  assert.equal(result.detail, '[redacted]');
  assert.equal(result.statusCode, 502);
  assert.equal(result.safeSummary, 'Falha ao chamar runtime local.');
});

test('redactForLog limita strings longas e arrays grandes para preservar memória', () => {
  const longText = 'x'.repeat(400);
  const result = redactForLog({
    message: longText,
    items: Array.from({ length: 30 }, (_, index) => index)
  });

  assert.equal(result.message.length, 303);
  assert.match(result.message, /\.\.\.$/);
  assert.equal(result.items.length, 20);
});

test('redactForLog normaliza valores não JSON sem quebrar logs estruturados', () => {
  function namedHandler() {}
  const error = Object.assign(new Error('falha segura'), {
    code: 'LOCAL_FAILURE',
    statusCode: 500
  });

  const result = redactForLog({
    count: 10n,
    marker: Symbol('local'),
    handler: namedHandler,
    error
  });

  assert.equal(result.count, '10');
  assert.equal(result.marker, 'Symbol(local)');
  assert.equal(result.handler, '[function namedHandler]');
  assert.deepEqual(result.error, {
    name: 'Error',
    message: 'falha segura',
    code: 'LOCAL_FAILURE',
    statusCode: 500
  });
});

test('createStructuredLogger emite JSON Lines com nível e redaction', () => {
  const logs = [];
  const logger = createStructuredLogger({
    level: 'info',
    sink: line => logs.push(line),
    now: () => new Date('2026-06-28T22:36:26.000Z')
  });

  logger.debug('debug.ignored', { value: true });
  logger.info('request.received', { requestId: 'abc', prompt: 'segredo' });

  assert.equal(logs.length, 1);
  const parsed = JSON.parse(logs[0]);

  assert.equal(parsed.timestamp, '2026-06-28T22:36:26.000Z');
  assert.equal(parsed.level, 'info');
  assert.equal(parsed.service, 'teste-local-code-llm-backend');
  assert.equal(parsed.event, 'request.received');
  assert.equal(parsed.requestId, 'abc');
  assert.equal(parsed.prompt, '[redacted]');
});

test('createStructuredLogger serializa detalhes não JSON com segurança', () => {
  const logs = [];
  const logger = createStructuredLogger({
    level: 'info',
    sink: line => logs.push(line),
    now: () => new Date('2026-07-01T04:20:57.000Z')
  });

  logger.info('runtime.metric', {
    requestId: 'abc',
    activeBytes: 123n,
    marker: Symbol('safe')
  });

  assert.equal(logs.length, 1);
  const parsed = JSON.parse(logs[0]);

  assert.equal(parsed.activeBytes, '123');
  assert.equal(parsed.marker, 'Symbol(safe)');
});

test('createStructuredLogger respeita nível silent', () => {
  const logs = [];
  const logger = createStructuredLogger({
    level: 'silent',
    sink: line => logs.push(line)
  });

  logger.error('error.hidden', { value: true });

  assert.deepEqual(logs, []);
});
