import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLargeCodePlan,
  chunkList,
  clampSafeInteger,
  normalizeLargeCodeText,
  normalizeStringList
} from '../src/large-code.js';

test('normalizeLargeCodeText limpa controles e exige task quando requerido', () => {
  assert.equal(normalizeLargeCodeText('linha 1\r\nlinha\u0000 2', { maxChars: 100 }), 'linha 1\nlinha  2');
  assert.equal(normalizeLargeCodeText('abcdef', { maxChars: 3 }), 'abc');

  assert.throws(
    () => normalizeLargeCodeText('', { fieldName: 'task', required: true }),
    error => error.statusCode === 400 && /task/.test(error.message)
  );
});

test('normalizeStringList valida arrays e limites', () => {
  assert.deepEqual(normalizeStringList([' a ', 'b'], { fieldName: 'files', maxItems: 2 }), ['a', 'b']);

  assert.throws(
    () => normalizeStringList('a.js', { fieldName: 'files' }),
    error => error.statusCode === 400
  );

  assert.throws(
    () => normalizeStringList(['a', 'b', 'c'], { fieldName: 'files', maxItems: 2 }),
    error => error.statusCode === 400 && /no máximo 2/.test(error.message)
  );
});

test('chunkList divide contexto grande em lotes pequenos', () => {
  assert.deepEqual(chunkList(['a', 'b', 'c', 'd', 'e'], 2), [['a', 'b'], ['c', 'd'], ['e']]);
});

test('clampSafeInteger aplica limites seguros', () => {
  const bounds = { fallback: 4, minimum: 1, maximum: 8 };
  assert.equal(clampSafeInteger(6, bounds), 6);
  assert.equal(clampSafeInteger(0, bounds), 1);
  assert.equal(clampSafeInteger(99, bounds), 8);
  assert.equal(clampSafeInteger('bad', bounds), 4);
});

test('buildLargeCodePlan cria plano por arquivo alvo sem chamar Ollama', () => {
  const plan = buildLargeCodePlan({
    task: 'Criar CRUD completo de clientes',
    language: 'Node.js',
    contextFiles: ['src/server.js', 'src/config.js', 'src/http.js'],
    targetFiles: ['src/modules/customers/routes.js', 'src/modules/customers/service.js'],
    maxFilesPerStep: 2,
    maxSteps: 10
  });

  assert.equal(plan.mode, 'chunked-large-code-generation');
  assert.equal(plan.language, 'Node.js');
  assert.equal(plan.totals.contextFiles, 3);
  assert.equal(plan.totals.targetFiles, 2);
  assert.equal(plan.totals.contextBatches, 2);
  assert.equal(plan.steps[0].type, 'architecture-plan');
  assert.equal(plan.steps[1].type, 'file-generation');
  assert.equal(plan.steps.at(-1).type, 'integration-review');
  assert.match(plan.steps[1].task, /src\/modules\/customers\/routes\.js/);
});

test('buildLargeCodePlan respeita limite de etapas para PC fraco', () => {
  const plan = buildLargeCodePlan({
    task: 'Gerar muitos arquivos pequenos',
    targetFiles: ['a.js', 'b.js', 'c.js', 'd.js', 'e.js'],
    maxSteps: 3
  });

  assert.equal(plan.steps.length, 3);
  assert.equal(plan.totals.truncatedByStepLimit, true);
});
