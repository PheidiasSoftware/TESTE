import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { validateSafeProjectFilePath } from '../src/project-files.js';

test('validateSafeProjectFilePath bloqueia nomes reservados do Windows', () => {
  const projectRoot = join(tmpdir(), 'projeto-teste');
  const reservedPaths = [
    'CON.txt',
    'src/NUL.md',
    'docs/com1.js',
    'notes/LPT9.txt'
  ];

  for (const requestedPath of reservedPaths) {
    assert.throws(
      () => validateSafeProjectFilePath({
        requestedPath,
        projectRoot,
        allowedFileExtensions: ['.js', '.md', '.txt']
      }),
      error => error.statusCode === 400 && /nome reservado do Windows/i.test(error.message),
      `expected ${requestedPath} to be rejected`
    );
  }
});
