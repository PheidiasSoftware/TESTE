import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { buildContextFromFiles } from '../src/server.js';

test('buildContextFromFiles monta contexto com arquivos seguros', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'teste-context-files-'));

  try {
    await writeFile(join(projectRoot, 'a.md'), '# A\nconteudo A\n', 'utf8');
    await writeFile(join(projectRoot, 'b.js'), 'console.log("B");\n', 'utf8');

    const result = await buildContextFromFiles({
      context: 'Contexto manual.',
      contextFiles: ['a.md', 'b.js'],
      projectRoot,
      maxFiles: 2,
      maxContextBytes: 1024,
      maxFileReadBytes: 1024,
      allowedFileExtensions: ['.md', '.js']
    });

    assert.match(result.context, /Contexto manual/);
    assert.match(result.context, /--- arquivo: a\.md/);
    assert.match(result.context, /conteudo A/);
    assert.match(result.context, /--- arquivo: b\.js/);
    assert.equal(result.files.length, 2);
    assert.equal(result.truncated, false);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test('buildContextFromFiles bloqueia excesso de arquivos antes de ler', async () => {
  await assert.rejects(
    () => buildContextFromFiles({
      contextFiles: ['a.md', 'b.md'],
      maxFiles: 1
    }),
    error => error.statusCode === 400 && /no máximo 1/.test(error.message)
  );
});

test('buildContextFromFiles rejeita lista com item inválido', async () => {
  await assert.rejects(
    () => buildContextFromFiles({ contextFiles: ['a.md', 123] }),
    error => error.statusCode === 400 && /precisam ser texto/.test(error.message)
  );
});
