import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isAllowedLocalOllamaHost, loadConfig, normalizeOllamaUrl } from '../src/config.js';

test('isAllowedLocalOllamaHost accepts only syntactically valid loopback IPv4 octets', () => {
  assert.equal(isAllowedLocalOllamaHost('127.0.0.1'), true);
  assert.equal(isAllowedLocalOllamaHost('127.255.255.255'), true);
  assert.equal(isAllowedLocalOllamaHost('127.1.2.3'), true);

  assert.equal(isAllowedLocalOllamaHost('127.256.0.1'), false);
  assert.equal(isAllowedLocalOllamaHost('127.999.999.999'), false);
  assert.equal(isAllowedLocalOllamaHost('127.0.0'), false);
  assert.equal(isAllowedLocalOllamaHost('127.0.0.1.1'), false);
  assert.equal(isAllowedLocalOllamaHost('0127.0.0.1'), false);
});

test('normalizeOllamaUrl falls back when loopback IPv4 is malformed', () => {
  assert.equal(normalizeOllamaUrl('http://127.0.0.1:11434'), 'http://127.0.0.1:11434');
  assert.equal(normalizeOllamaUrl('http://127.255.255.255:11434'), 'http://127.255.255.255:11434');
  assert.equal(normalizeOllamaUrl('http://127.256.0.1:11434'), 'http://127.0.0.1:11434');
  assert.equal(normalizeOllamaUrl('http://127.999.999.999:11434'), 'http://127.0.0.1:11434');
});

test('loadConfig rejects malformed local-looking OLLAMA_URL values', () => {
  const config = loadConfig({ OLLAMA_URL: 'http://127.999.999.999:11434' });

  assert.equal(config.OLLAMA_URL, 'http://127.0.0.1:11434');
});
