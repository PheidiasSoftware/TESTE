import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_ALLOWED_FILE_EXTENSIONS,
  getAllowedFileExtensions,
  loadConfig,
  normalizeLogLevel,
  parseBooleanFlag
} from '../src/config.js';

test('loadConfig keeps conservative defaults for weak local PCs', () => {
  const config = loadConfig({});

  assert.equal(config.HOST, '127.0.0.1');
  assert.equal(config.PORT, 3131);
  assert.equal(config.MODEL, 'qwen2.5-coder:1.5b-instruct');
  assert.equal(config.GENERATION_CONCURRENCY, 1);
  assert.equal(config.MAX_QUEUE_SIZE, 4);
  assert.equal(config.ENABLE_PROMPT_CACHE, true);
  assert.equal(config.MAX_CACHE_ENTRIES, 20);
  assert.equal(config.LOG_LEVEL, 'info');
  assert.equal(config.ENABLE_RATE_LIMIT, true);
  assert.equal(config.TRUST_PROXY, false);
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
