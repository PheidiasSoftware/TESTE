import assert from 'node:assert/strict';
import test from 'node:test';

import { getStartupConsoleLines } from '../src/server.js';

test('startup console output does not expose local project root', () => {
  const lines = getStartupConsoleLines();
  const output = lines.join('\n');

  assert.ok(lines.some(line => line.includes('raiz=redacted')));
  assert.doesNotMatch(output, /PROJECT_ROOT/i);
  assert.doesNotMatch(output, /[A-Z]:\\/i);
  assert.doesNotMatch(output, /\/mnt\//i);
  assert.doesNotMatch(output, /\/home\//i);
  assert.doesNotMatch(output, /\/Users\//i);
});
