import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_ALLOWED_FILE_EXTENSIONS,
  RUNTIME_NUMERIC_LIMITS,
  getAllowedFileExtensions,
  isAllowedLocalOllamaHost,
  loadConfig,
  normalizeAllowedFileExtension,
  normalizeHost,
  normalizeLogLevel,
  normalizeModelName,
  normalizeOllamaUrl,
  parseBooleanFlag,
  parseBoundedInteger,
  parseInteger,
  parsePort
} from '../src/config.js';

test('loadConfig keeps conservative defaults for weak local PCs', () => {
  const config = loadConfig({});

  assert.equal(config.HOST, '127.0.0.1');
  assert.equal(config.PORT, 3131);
  assert.equal(config.OLLAMA_URL, 'http://127.0.0.1:11434');
  assert.equal(config.MODEL, 'qwen2.5-coder:1.5b-instruct');
  assert.equal(config.GENERATION_CONCURRENCY, 1);
  assert.equal(config.MAX_QUEUE_SIZE, 4);
  assert.equal(config.ENABLE_PROMPT_CACHE, true);
  assert.equal(config.MAX_CACHE_ENTRIES, 20);
  assert.equal(config.LOG_LEVEL, 'info');
  assert.equal(config.ENABLE_RATE_LIMIT, true);
  assert.equal(config.TRUST_PROXY, false);
});

test('normalizeModelName accepts common lightweight Ollama model names', () => {
  assert.equal(normalizeModelName(' qwen2.5-coder:1.5b-instruct '), 'qwen2.5-coder:1.5b-instruct');
  assert.equal(normalizeModelName('deepseek-coder:1.3b'), 'deepseek-coder:1.3b');
  assert.equal(normalizeModelName('namespace/model.name:tag_1'), 'namespace/model.name:tag_1');
});

test('normalizeModelName rejects unsafe or ambiguous model names', () => {
  assert.equal(normalizeModelName(''), 'qwen2.5-coder:1.5b-instruct');
  assert.equal(normalizeModelName('model with spaces'), 'qwen2.5-coder:1.5b-instruct');
  assert.equal(normalizeModelName('../model:latest'), 'qwen2.5-coder:1.5b-instruct');
  assert.equal(normalizeModelName('model?token=secret'), 'qwen2.5-coder:1.5b-instruct');
  assert.equal(normalizeModelName('a'.repeat(181)), 'qwen2.5-coder:1.5b-instruct');
});

test('loadConfig normalizes MODEL before exposing config status', () => {
  assert.equal(loadConfig({ MODEL: ' deepseek-coder:1.3b ' }).MODEL, 'deepseek-coder:1.3b');
  assert.equal(loadConfig({ MODEL: 'bad model name' }).MODEL, 'qwen2.5-coder:1.5b-instruct');
});

test('normalizeHost keeps the backend bound to local interfaces by default', () => {
  assert.equal(normalizeHost('127.0.0.1'), '127.0.0.1');
  assert.equal(normalizeHost(' localhost '), 'localhost');
  assert.equal(normalizeHost('::1'), '::1');
  assert.equal(normalizeHost('[::1]'), '::1');
  assert.equal(normalizeHost('0.0.0.0'), '127.0.0.1');
  assert.equal(normalizeHost('192.168.0.10'), '127.0.0.1');
  assert.equal(normalizeHost(''), '127.0.0.1');
});

test('loadConfig falls back to loopback when HOST asks for public binding', () => {
  assert.equal(loadConfig({ HOST: 'localhost' }).HOST, 'localhost');
  assert.equal(loadConfig({ HOST: '[::1]' }).HOST, '::1');
  assert.equal(loadConfig({ HOST: '0.0.0.0' }).HOST, '127.0.0.1');
  assert.equal(loadConfig({ HOST: '::' }).HOST, '127.0.0.1');
});

test('parseInteger accepts only complete safe integer environment values', () => {
  assert.equal(parseInteger('42', 7), 42);
  assert.equal(parseInteger(' 42 ', 7), 42);
  assert.equal(parseInteger('-3', 7), -3);
  assert.equal(parseInteger('+3', 7), 3);
  assert.equal(parseInteger('42abc', 7), 7);
  assert.equal(parseInteger('4.2', 7), 7);
  assert.equal(parseInteger('1e3', 7), 7);
  assert.equal(parseInteger('9007199254740993', 7), 7);
  assert.equal(parseInteger(undefined, 7), 7);
});

test('parseBoundedInteger enforces fallback, minimum and maximum values', () => {
  const limit = { fallback: 10, minimum: 2, maximum: 20 };

  assert.equal(parseBoundedInteger('15', limit), 15);
  assert.equal(parseBoundedInteger('1', limit), 2);
  assert.equal(parseBoundedInteger('999', limit), 20);
  assert.equal(parseBoundedInteger('bad', limit), 10);
});

test('loadConfig falls back when numeric safety limits are partial or unsafe integers', () => {
  const config = loadConfig({
    MAX_BODY_BYTES: '65536x',
    REQUEST_TIMEOUT_MS: '120000.5',
    MAX_QUEUE_SIZE: '1e3'
  });

  assert.equal(config.MAX_BODY_BYTES, 65536);
  assert.equal(config.REQUEST_TIMEOUT_MS, 120000);
  assert.equal(config.MAX_QUEUE_SIZE, 4);
});

test('loadConfig clamps runtime numeric limits for weak local PCs', () => {
  const config = loadConfig({
    MAX_BODY_BYTES: '999999999',
    REQUEST_TIMEOUT_MS: '999999999',
    MAX_QUEUE_SIZE: '999999999',
    GENERATION_CONCURRENCY: '999999999',
    MAX_CACHE_ENTRIES: '999999999',
    MAX_FILE_READ_BYTES: '999999999',
    MAX_CONTEXT_FILES: '999999999',
    MAX_CONTEXT_BYTES: '999999999',
    RATE_LIMIT_WINDOW_MS: '999999999',
    RATE_LIMIT_MAX_REQUESTS: '999999999',
    RATE_LIMIT_MAX_CLIENTS: '999999999'
  });

  assert.equal(config.MAX_BODY_BYTES, RUNTIME_NUMERIC_LIMITS.MAX_BODY_BYTES.maximum);
  assert.equal(config.REQUEST_TIMEOUT_MS, RUNTIME_NUMERIC_LIMITS.REQUEST_TIMEOUT_MS.maximum);
  assert.equal(config.MAX_QUEUE_SIZE, RUNTIME_NUMERIC_LIMITS.MAX_QUEUE_SIZE.maximum);
  assert.equal(config.GENERATION_CONCURRENCY, RUNTIME_NUMERIC_LIMITS.GENERATION_CONCURRENCY.maximum);
  assert.equal(config.MAX_CACHE_ENTRIES, RUNTIME_NUMERIC_LIMITS.MAX_CACHE_ENTRIES.maximum);
  assert.equal(config.MAX_FILE_READ_BYTES, RUNTIME_NUMERIC_LIMITS.MAX_FILE_READ_BYTES.maximum);
  assert.equal(config.MAX_CONTEXT_FILES, RUNTIME_NUMERIC_LIMITS.MAX_CONTEXT_FILES.maximum);
  assert.equal(config.MAX_CONTEXT_BYTES, RUNTIME_NUMERIC_LIMITS.MAX_CONTEXT_BYTES.maximum);
  assert.equal(config.RATE_LIMIT_WINDOW_MS, RUNTIME_NUMERIC_LIMITS.RATE_LIMIT_WINDOW_MS.maximum);
  assert.equal(config.RATE_LIMIT_MAX_REQUESTS, RUNTIME_NUMERIC_LIMITS.RATE_LIMIT_MAX_REQUESTS.maximum);
  assert.equal(config.RATE_LIMIT_MAX_CLIENTS, RUNTIME_NUMERIC_LIMITS.RATE_LIMIT_MAX_CLIENTS.maximum);
});

test('loadConfig normalizes invalid port values to the safe local default', () => {
  assert.equal(loadConfig({ PORT: '3132' }).PORT, 3132);
  assert.equal(loadConfig({ PORT: '0' }).PORT, 3131);
  assert.equal(loadConfig({ PORT: '-1' }).PORT, 3131);
  assert.equal(loadConfig({ PORT: '70000' }).PORT, 3131);
  assert.equal(loadConfig({ PORT: 'abc' }).PORT, 3131);
});

test('parsePort accepts only valid TCP port range values', () => {
  assert.equal(parsePort('1'), 1);
  assert.equal(parsePort('65535'), 65535);
  assert.equal(parsePort('65536'), 3131);
  assert.equal(parsePort(undefined, 8080), 8080);
});

test('isAllowedLocalOllamaHost allows only loopback hostnames', () => {
  assert.equal(isAllowedLocalOllamaHost('localhost'), true);
  assert.equal(isAllowedLocalOllamaHost('127.0.0.1'), true);
  assert.equal(isAllowedLocalOllamaHost('127.10.20.30'), true);
  assert.equal(isAllowedLocalOllamaHost('::1'), true);
  assert.equal(isAllowedLocalOllamaHost('ollama.local'), false);
  assert.equal(isAllowedLocalOllamaHost('192.168.0.10'), false);
  assert.equal(isAllowedLocalOllamaHost('example.com'), false);
});

test('normalizeOllamaUrl accepts only local http and https URLs', () => {
  assert.equal(normalizeOllamaUrl(' http://localhost:11434/ '), 'http://localhost:11434');
  assert.equal(normalizeOllamaUrl('https://127.0.0.1:11434/'), 'https://127.0.0.1:11434');
  assert.equal(normalizeOllamaUrl('ftp://127.0.0.1:11434'), 'http://127.0.0.1:11434');
  assert.equal(normalizeOllamaUrl('https://ollama.local:11434/'), 'http://127.0.0.1:11434');
  assert.equal(normalizeOllamaUrl('http://192.168.0.10:11434/'), 'http://127.0.0.1:11434');
  assert.equal(normalizeOllamaUrl('not a url'), 'http://127.0.0.1:11434');
});

test('normalizeOllamaUrl strips common Ollama API paths to keep client endpoint valid', () => {
  assert.equal(normalizeOllamaUrl('http://127.0.0.1:11434/api'), 'http://127.0.0.1:11434');
  assert.equal(normalizeOllamaUrl('http://127.0.0.1:11434/api/generate'), 'http://127.0.0.1:11434');
  assert.equal(normalizeOllamaUrl('http://127.0.0.1:11434/api/generate/'), 'http://127.0.0.1:11434');
});

test('normalizeOllamaUrl strips query, hash and credentials before exposing config', () => {
  assert.equal(
    normalizeOllamaUrl('http://user:secret@127.0.0.1:11434/?token=secret#section'),
    'http://127.0.0.1:11434'
  );
});

test('loadConfig normalizes Ollama URL to a safe local endpoint string', () => {
  assert.equal(loadConfig({ OLLAMA_URL: ' http://127.0.0.1:11434/// ' }).OLLAMA_URL, 'http://127.0.0.1:11434');
  assert.equal(loadConfig({ OLLAMA_URL: 'file:///tmp/ollama.sock' }).OLLAMA_URL, 'http://127.0.0.1:11434');
  assert.equal(loadConfig({ OLLAMA_URL: 'http://10.0.0.20:11434' }).OLLAMA_URL, 'http://127.0.0.1:11434');
});

test('loadConfig normalizes minimum values for safety limits', () => {
  const config = loadConfig({
    GENERATION_CONCURRENCY: '0',
    MAX_CACHE_ENTRIES: '-1',
    MAX_FILE_READ_BYTES: '1',
    MAX_CONTEXT_FILES: '-5',
    MAX_CONTEXT_BYTES: '10',
    RATE_LIMIT_WINDOW_MS: '10',
    RATE_LIMIT_MAX_REQUESTS: '0',
    RATE_LIMIT_MAX_CLIENTS: '0'
  });

  assert.equal(config.GENERATION_CONCURRENCY, 1);
  assert.equal(config.MAX_CACHE_ENTRIES, 0);
  assert.equal(config.MAX_FILE_READ_BYTES, 1024);
  assert.equal(config.MAX_CONTEXT_FILES, 0);
  assert.equal(config.MAX_CONTEXT_BYTES, 1024);
  assert.equal(config.RATE_LIMIT_WINDOW_MS, 1000);
  assert.equal(config.RATE_LIMIT_MAX_REQUESTS, 1);
  assert.equal(config.RATE_LIMIT_MAX_CLIENTS, 1);
});

test('loadConfig normalizes supported log levels before exposing config status', () => {
  assert.equal(loadConfig({ LOG_LEVEL: ' DEBUG ' }).LOG_LEVEL, 'debug');
  assert.equal(loadConfig({ LOG_LEVEL: 'SILENT' }).LOG_LEVEL, 'silent');
  assert.equal(loadConfig({ LOG_LEVEL: 'verbose' }).LOG_LEVEL, 'info');
});

test('normalizeLogLevel accepts only supported levels', () => {
  assert.equal(normalizeLogLevel('error'), 'error');
  assert.equal(normalizeLogLevel('warn'), 'warn');
  assert.equal(normalizeLogLevel('info'), 'info');
  assert.equal(normalizeLogLevel('debug'), 'debug');
  assert.equal(normalizeLogLevel('silent'), 'silent');
  assert.equal(normalizeLogLevel('unsupported'), 'info');
});

test('parseBooleanFlag accepts common true and false environment values', () => {
  for (const value of ['true', 'TRUE', ' 1 ', 'yes', 'Y', 'on']) {
    assert.equal(parseBooleanFlag(value, false), true);
  }

  for (const value of ['false', 'FALSE', ' 0 ', 'no', 'N', 'off']) {
    assert.equal(parseBooleanFlag(value, true), false);
  }
});

test('parseBooleanFlag falls back for empty or unsupported environment values', () => {
  assert.equal(parseBooleanFlag(undefined, true), true);
  assert.equal(parseBooleanFlag('', false), false);
  assert.equal(parseBooleanFlag('maybe', true), true);
  assert.equal(parseBooleanFlag('maybe', false), false);
});

test('loadConfig applies boolean parsing to public safety flags', () => {
  const disabled = loadConfig({
    ENABLE_PROMPT_CACHE: '0',
    ENABLE_RATE_LIMIT: 'off',
    TRUST_PROXY: 'no'
  });

  assert.equal(disabled.ENABLE_PROMPT_CACHE, false);
  assert.equal(disabled.ENABLE_RATE_LIMIT, false);
  assert.equal(disabled.TRUST_PROXY, false);

  const enabled = loadConfig({
    ENABLE_PROMPT_CACHE: '1',
    ENABLE_RATE_LIMIT: 'on',
    TRUST_PROXY: 'yes'
  });

  assert.equal(enabled.ENABLE_PROMPT_CACHE, true);
  assert.equal(enabled.ENABLE_RATE_LIMIT, true);
  assert.equal(enabled.TRUST_PROXY, true);
});

test('normalizeAllowedFileExtension accepts simple safe extensions', () => {
  assert.equal(normalizeAllowedFileExtension('JS'), '.js');
  assert.equal(normalizeAllowedFileExtension('.dart'), '.dart');
  assert.equal(normalizeAllowedFileExtension('my_ext-1'), '.my_ext-1');
});

test('normalizeAllowedFileExtension rejects unsafe extension entries', () => {
  assert.equal(normalizeAllowedFileExtension(''), null);
  assert.equal(normalizeAllowedFileExtension('../x'), null);
  assert.equal(normalizeAllowedFileExtension('js/ts'), null);
  assert.equal(normalizeAllowedFileExtension('js\\ts'), null);
  assert.equal(normalizeAllowedFileExtension('.'), null);
  assert.equal(normalizeAllowedFileExtension('*'), null);
});

test('getAllowedFileExtensions parses custom comma separated extensions', () => {
  assert.deepEqual(getAllowedFileExtensions({ ALLOWED_FILE_EXTENSIONS: 'JS, dart, .sql,, md ' }), ['.js', '.dart', '.sql', '.md']);
});