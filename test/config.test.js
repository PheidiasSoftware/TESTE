import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_ALLOWED_FILE_EXTENSIONS,
  getAllowedFileExtensions,
  loadConfig,
  normalizeLogLevel,
  normalizeOllamaUrl,
  parseBooleanFlag,
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

test('normalizeOllamaUrl accepts http and https URLs only', () => {
  assert.equal(normalizeOllamaUrl(' http://localhost:11434/ '), 'http://localhost:11434');
  assert.equal(normalizeOllamaUrl('https://ollama.local:11434/api/'), 'https://ollama.local:11434/api');
  assert.equal(normalizeOllamaUrl('ftp://127.0.0.1:11434'), 'http://127.0.0.1:11434');
  assert.equal(normalizeOllamaUrl('not a url'), 'http://127.0.0.1:11434');
});

test('normalizeOllamaUrl strips query and hash fragments before exposing config', () => {
  assert.equal(
    normalizeOllamaUrl('http://127.0.0.1:11434/?token=secret#section'),
    'http://127.0.0.1:11434'
  );
});

test('loadConfig normalizes Ollama URL to a safe endpoint string', () => {
  assert.equal(loadConfig({ OLLAMA_URL: ' http://127.0.0.1:11434/// ' }).OLLAMA_URL, 'http://127.0.0.1:11434');
  assert.equal(loadConfig({ OLLAMA_URL: 'file:///tmp/ollama.sock' }).OLLAMA_URL, 'http://127.0.0.1:11434');
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

test('getAllowedFileExtensions parses custom comma separated extensions', () => {
  assert.deepEqual(getAllowedFileExtensions({ ALLOWED_FILE_EXTENSIONS: 'JS, dart, .sql,, md ' }), ['.js', '.dart', '.sql', '.md']);
});

test('getAllowedFileExtensions falls back to safe defaults when custom value is empty', () => {
  assert.deepEqual(getAllowedFileExtensions({ ALLOWED_FILE_EXTENSIONS: ' , , ' }), DEFAULT_ALLOWED_FILE_EXTENSIONS);
});
