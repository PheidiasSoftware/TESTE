import assert from 'node:assert/strict';
import test from 'node:test';

import { createStructuredLogger, redactForLog } from '../src/server.js';

test('redactForLog remove campos sensíveis antes de serializar logs', () => {
  const redacted = redactForLog({
    requestId: 'abc',
    authorization: 'Bearer segredo',
    apiKey: 'chave',
    prompt: 'conteúdo do usuário',
    nested: {
      password: '123',
      safe: 'ok'
    },
    files: [
      { path: 'src/server.js', content: 'não deve aparecer' }
    ]
  });

  assert.equal(redacted.requestId, 'abc');
  assert.equal(redacted.authorization, '[redacted]');
  assert.equal(redacted.apiKey, '[redacted]');
  assert.equal(redacted.prompt, '[redacted]');
  assert.equal(redacted.nested.password, '[redacted]');
  assert.equal(redacted.nested.safe, 'ok');
  assert.equal(redacted.files[0].path, 'src/server.js');
  assert.equal(redacted.files[0].content, '[redacted]');
});

test('createStructuredLogger emite JSON lines sem vazar prompt ou resposta', () => {
  const lines = [];
  const logger = createStructuredLogger({
    level: 'info',
    sink: line => lines.push(line)
  });

  logger.info('generate.request.completed', {
    requestId: 'abc',
    prompt: 'segredo do usuário',
    response: 'resposta gerada',
    durationMs: 10
  });

  assert.equal(lines.length, 1);

  const entry = JSON.parse(lines[0]);
  assert.equal(entry.level, 'info');
  assert.equal(entry.service, 'teste-local-code-llm-backend');
  assert.equal(entry.event, 'generate.request.completed');
  assert.equal(entry.requestId, 'abc');
  assert.equal(entry.prompt, '[redacted]');
  assert.equal(entry.response, '[redacted]');
  assert.equal(entry.durationMs, 10);
});

test('createStructuredLogger respeita LOG_LEVEL silencioso', () => {
  const lines = [];
  const logger = createStructuredLogger({
    level: 'silent',
    sink: line => lines.push(line)
  });

  logger.error('erro.teste', { error: 'x' });
  logger.info('info.teste', { safe: true });

  assert.equal(lines.length, 0);
});
