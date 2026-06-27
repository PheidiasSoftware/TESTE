import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCodingPrompt, createGenerationQueue } from '../src/server.js';

test('buildCodingPrompt inclui foco, contexto e tarefa sem depender do Ollama', () => {
  const prompt = buildCodingPrompt({
    task: 'Criar endpoint de health check',
    language: 'Node.js',
    context: 'Projeto usa HTTP nativo.'
  });

  assert.match(prompt, /Node\.js/);
  assert.match(prompt, /Projeto usa HTTP nativo/);
  assert.match(prompt, /Criar endpoint de health check/);
  assert.match(prompt, /Não invente arquivos/);
});

test('createGenerationQueue limita fila cheia com HTTP 429', async () => {
  const queue = createGenerationQueue({
    maxQueueSize: 1,
    generationConcurrency: 1
  });

  let releaseFirstJob;
  const firstJob = queue.run(() => new Promise(resolve => {
    releaseFirstJob = () => resolve('ok');
  }));

  const secondJob = queue.run(() => Promise.resolve('queued'));
  await assert.rejects(
    () => queue.run(() => Promise.resolve('overflow')),
    error => error.statusCode === 429
  );

  releaseFirstJob();
  assert.equal(await firstJob, 'ok');
  assert.equal(await secondJob, 'queued');
  assert.equal(queue.getStatus().completedGenerations, 2);
});

test('createGenerationQueue respeita concorrência um em PC fraco', async () => {
  const queue = createGenerationQueue({
    maxQueueSize: 4,
    generationConcurrency: 1
  });

  const order = [];
  const first = queue.run(async () => {
    order.push('first-start');
    await new Promise(resolve => setTimeout(resolve, 10));
    order.push('first-end');
  });

  const second = queue.run(async () => {
    order.push('second-start');
    order.push('second-end');
  });

  await Promise.all([first, second]);

  assert.deepEqual(order, ['first-start', 'first-end', 'second-start', 'second-end']);
});
