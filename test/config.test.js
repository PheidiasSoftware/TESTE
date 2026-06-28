import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_ALLOWED_FILE_EXTENSIONS,
  getAllowedFileExtensions,
  loadConfig
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

test('getAllowedFileExtensions parses custom comma separated extensions', () => {
  assert.deepEqual(getAllowedFileExtensions({ ALLOWED_FILE_EXTENSIONS: 'JS, dart, .sql,, md ' }), ['.js', '.dart', '.sql', '.md']);
});

test('getAllowedFileExtensions falls back to safe defaults when custom value is empty', () => {
  assert.deepEqual(getAllowedFileExtensions({ ALLOWED_FILE_EXTENSIONS: ' , , ' }), DEFAULT_ALLOWED_FILE_EXTENSIONS);
});
