import assert from 'node:assert/strict';
import test from 'node:test';

import { getStartupConsoleLines } from '../src/server.js';

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('startup console output does not expose local project root or Ollama URL', () => {
  const lines = getStartupConsoleLines();
  const output = lines.join('\n');

  assert.ok(lines.some(line => line.includes('raiz=redacted')));
  assert.doesNotMatch(output, /PROJECT_ROOT/i);
  assert.doesNotMatch(output, /OLLAMA_URL/i);
  assert.doesNotMatch(output, /11434/);
  assert.doesNotMatch(output, /[A-Z]:\\/i);
  assert.doesNotMatch(output, /\/mnt\//i);
  assert.doesNotMatch(output, /\/home\//i);
  assert.doesNotMatch(output, /\/Users\//i);
  assert.doesNotMatch(output, new RegExp(escapeRegExp(process.cwd())));
});
