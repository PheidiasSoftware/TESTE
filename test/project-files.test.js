import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildContextFromFiles,
  normalizeManualContext,
  readProjectFile,
  truncateUtf8ToBytes,
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

test('truncateUtf8ToBytes não divide caracteres multibyte', () => {
  assert.equal(truncateUtf8ToBytes('abc', 2), 'ab');
  assert.equal(truncateUtf8ToBytes('abç', 3), 'ab');
  assert.equal(truncateUtf8ToBytes('😀teste', 3), '');
  assert.equal(truncateUtf8ToBytes('😀teste', 4), '😀');
  assert.equal(truncateUtf8ToBytes('ok', 10), 'ok');
});

test('normalizeManualContext remove controles não textuais e preserva quebras úteis', () => {
  const normalized = normalizeManualContext('linha 1\r\nlinha\u0000 2\u0007\nlinha 3', 1024);

  assert.equal(normalized, 'linha 1\nlinha  2 \nlinha 3');
});

test('normalizeManualContext limita contexto manual sem quebrar UTF-8', () => {
  assert.equal(normalizeManualContext('😀teste', 5), '😀t');
  assert.equal(normalizeManualContext({ texto: 'ignorar' }, 100), '');
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

test('buildContextFromFiles limita contexto manual sem quebrar UTF-8', async () => {
  const result = await buildContextFromFiles({
    context: '😀teste',
    contextFiles: [],
    maxContextBytes: 5
  });

  assert.equal(result.context, '😀t');
  assert.equal(result.totalBytes, 5);
  assert.equal(result.truncated, true);
});

test('buildContextFromFiles valida contextFiles não-array antes do limite de quantidade', async () => {
  await assert.rejects(
    () => buildContextFromFiles({ contextFiles: 'src/index.js', maxFiles: 1 }),
    error => error.statusCode === 400 && /lista de caminhos relativos/.test(error.message)
  );
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
