import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildContextFromFiles,
  readProjectFile,
  validateSafeProjectFilePath
} from '../src/project-files.js';

function toPosixPath(path) {
  return path.replaceAll('\\', '/');
}

test('validateSafeProjectFilePath permite arquivo relativo com extensão aprovada', () => {
  const projectRoot = join(tmpdir(), 'projeto-teste');
  const result = validateSafeProjectFilePath({
    requestedPath: 'src/index.js',
    projectRoot,
    allowedFileExtensions: ['.js']
  });

  assert.equal(toPosixPath(result.relativePath), 'src/index.js');
});

test('validateSafeProjectFilePath bloqueia travessia, dependências e .env', () => {
  const projectRoot = join(tmpdir(), 'projeto-teste');

  assert.throws(
    () => validateSafeProjectFilePath({ requestedPath: '../segredo.md', projectRoot, allowedFileExtensions: ['.md'] }),
    error => error.statusCode === 403
  );

  assert.throws(
    () => validateSafeProjectFilePath({ requestedPath: 'node_modules/lib/index.js', projectRoot, allowedFileExtensions: ['.js'] }),
    error => error.statusCode === 403
  );

  assert.throws(
    () => validateSafeProjectFilePath({ requestedPath: '.env', projectRoot, allowedFileExtensions: ['.env'] }),
    error => error.statusCode === 403
  );
});

test('readProjectFile lê arquivo pequeno e bloqueia arquivo acima do limite', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'teste-project-files-'));

  try {
    await writeFile(join(projectRoot, 'sample.md'), '# Exemplo\nConteúdo seguro.\n', 'utf8');
    await writeFile(join(projectRoot, 'large.md'), 'x'.repeat(32), 'utf8');

    const result = await readProjectFile({
      path: 'sample.md',
      projectRoot,
      maxBytes: 1024,
      allowedFileExtensions: ['.md']
    });

    assert.equal(result.path, 'sample.md');
    assert.match(result.content, /Conteúdo seguro/);
    assert.equal(result.maxFileReadBytes, 1024);

    await assert.rejects(
      () => readProjectFile({
        path: 'large.md',
        projectRoot,
        maxBytes: 16,
        allowedFileExtensions: ['.md']
      }),
      error => error.statusCode === 413
    );
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test('buildContextFromFiles monta contexto controlado com arquivos textuais pequenos', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'teste-context-files-'));

  try {
    await mkdir(join(projectRoot, 'src'));
    await writeFile(join(projectRoot, 'src', 'index.js'), 'export const value = 42;\n', 'utf8');

    const result = await buildContextFromFiles({
      context: 'Contexto manual.',
      contextFiles: ['src/index.js'],
      projectRoot,
      maxFiles: 2,
      maxContextBytes: 512,
      maxFileReadBytes: 256,
      allowedFileExtensions: ['.js']
    });

    assert.match(result.context, /Contexto manual/);
    assert.match(result.context, /arquivo: src[\\/]index\.js/);
    assert.match(result.context, /export const value = 42/);
    assert.equal(result.files.length, 1);
    assert.equal(toPosixPath(result.files[0].path), 'src/index.js');
    assert.equal(result.truncated, false);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test('buildContextFromFiles limita quantidade de arquivos e tipos inválidos', async () => {
  await assert.rejects(
    () => buildContextFromFiles({ contextFiles: ['a.md', 'b.md'], maxFiles: 1 }),
    error => error.statusCode === 400
  );

  await assert.rejects(
    () => buildContextFromFiles({ contextFiles: ['a.md', 123], maxFiles: 2 }),
    error => error.statusCode === 400
  );
});
