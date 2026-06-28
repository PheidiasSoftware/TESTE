import assert from 'node:assert/strict';
import test from 'node:test';

import { createGenerationQueue } from '../src/generation-queue.js';

test('createGenerationQueue limita fila cheia com HTTP 429 e contabiliza rejeições', async () => {
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
  assert.equal(queue.getStatus().rejectedGenerations, 1);
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

test('createGenerationQueue contabiliza falhas sem travar o próximo item', async () => {
  const queue = createGenerationQueue({
    maxQueueSize: 2,
    generationConcurrency: 1
  });

  const failingJob = queue.run(() => {
    throw new Error('falha simulada');
  });
  const nextJob = queue.run(() => Promise.resolve('continua'));

  await assert.rejects(failingJob, /falha simulada/);
  assert.equal(await nextJob, 'continua');
  assert.equal(queue.getStatus().failedGenerations, 1);
  assert.equal(queue.getStatus().completedGenerations, 1);
});

test('createGenerationQueue normaliza configuração conservadora', async () => {
  const queue = createGenerationQueue({
    maxQueueSize: -10,
    generationConcurrency: 0
  });

  assert.equal(queue.getStatus().maxQueueSize, 0);
  assert.equal(queue.getStatus().generationConcurrency, 1);

  await assert.rejects(
    () => queue.run(() => Promise.resolve('sem espaço')),
    error => error.statusCode === 429
  );
});

test('createGenerationQueue rejeita job inválido sem executar nada', async () => {
  const queue = createGenerationQueue({
    maxQueueSize: 1,
    generationConcurrency: 1
  });

  await assert.rejects(
    () => queue.run(null),
    error => error.statusCode === 400
  );

  assert.equal(queue.getStatus().activeGenerations, 0);
  assert.equal(queue.getStatus().queuedGenerations, 0);
});
