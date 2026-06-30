import assert from 'node:assert/strict';
import { test } from 'node:test';

import { RUNTIME_NUMERIC_LIMITS, loadConfig } from '../src/config.js';

test('loadConfig keeps conservative large-code planning defaults for weak local PCs', () => {
  const config = loadConfig({});

  assert.equal(config.MAX_LARGE_PLAN_FILES, 50);
  assert.equal(config.MAX_LARGE_PLAN_STEPS, 20);
  assert.equal(config.MAX_FILES_PER_CONTEXT_BATCH, 4);
});

test('loadConfig clamps large-code planning limits to safe maximums', () => {
  const config = loadConfig({
    MAX_LARGE_PLAN_FILES: '999999999',
    MAX_LARGE_PLAN_STEPS: '999999999',
    MAX_FILES_PER_CONTEXT_BATCH: '999999999'
  });

  assert.equal(config.MAX_LARGE_PLAN_FILES, RUNTIME_NUMERIC_LIMITS.MAX_LARGE_PLAN_FILES.maximum);
  assert.equal(config.MAX_LARGE_PLAN_STEPS, RUNTIME_NUMERIC_LIMITS.MAX_LARGE_PLAN_STEPS.maximum);
  assert.equal(config.MAX_FILES_PER_CONTEXT_BATCH, RUNTIME_NUMERIC_LIMITS.MAX_FILES_PER_CONTEXT_BATCH.maximum);
});

test('loadConfig clamps large-code planning limits to safe minimums', () => {
  const config = loadConfig({
    MAX_LARGE_PLAN_FILES: '-1',
    MAX_LARGE_PLAN_STEPS: '1',
    MAX_FILES_PER_CONTEXT_BATCH: '0'
  });

  assert.equal(config.MAX_LARGE_PLAN_FILES, RUNTIME_NUMERIC_LIMITS.MAX_LARGE_PLAN_FILES.minimum);
  assert.equal(config.MAX_LARGE_PLAN_STEPS, RUNTIME_NUMERIC_LIMITS.MAX_LARGE_PLAN_STEPS.minimum);
  assert.equal(config.MAX_FILES_PER_CONTEXT_BATCH, RUNTIME_NUMERIC_LIMITS.MAX_FILES_PER_CONTEXT_BATCH.minimum);
});

test('loadConfig falls back for invalid large-code planning environment values', () => {
  const config = loadConfig({
    MAX_LARGE_PLAN_FILES: '50x',
    MAX_LARGE_PLAN_STEPS: '20.5',
    MAX_FILES_PER_CONTEXT_BATCH: '1e3'
  });

  assert.equal(config.MAX_LARGE_PLAN_FILES, RUNTIME_NUMERIC_LIMITS.MAX_LARGE_PLAN_FILES.fallback);
  assert.equal(config.MAX_LARGE_PLAN_STEPS, RUNTIME_NUMERIC_LIMITS.MAX_LARGE_PLAN_STEPS.fallback);
  assert.equal(config.MAX_FILES_PER_CONTEXT_BATCH, RUNTIME_NUMERIC_LIMITS.MAX_FILES_PER_CONTEXT_BATCH.fallback);
});
