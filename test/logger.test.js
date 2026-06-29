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

test('createStructuredLogger respeita nível silent', () => {
  const logs = [];
  const logger = createStructuredLogger({
    level: 'silent',
    sink: line => logs.push(line)
  });

  logger.error('error.hidden', { value: true });

  assert.deepEqual(logs, []);
});
