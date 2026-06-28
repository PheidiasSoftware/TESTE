import assert from 'node:assert/strict';
import test from 'node:test';

import { createPromptCache } from '../src/cache.js';

test('createPromptCache armazena e recupera resposta por hash sem expor prompt', () => {
  const cache = createPromptCache({ maxEntries: 2 });
  const prompt = 'crie uma função Node.js simples';

  const key = cache.set(prompt, { response: 'function ok() {}', done: true });
  const cached = cache.get(prompt);

  assert.equal(typeof key, 'string');
  assert.equal(key.length, 64);
  assert.notEqual(key, prompt);
  assert.deepEqual(cached, {
    key,
    value: { response: 'function ok() {}', done: true }
  });
  assert.equal(cache.getStatus().hits, 1);
  assert.equal(cache.getStatus().writes, 1);
});

test('createPromptCache registra miss quando desativado ou vazio', () => {
  const disabled = createPromptCache({ enabled: false, maxEntries: 2 });
  const empty = createPromptCache({ maxEntries: 2 });

  assert.equal(disabled.set('prompt', { response: 'x' }), null);
  assert.equal(disabled.get('prompt'), null);
  assert.equal(disabled.getStatus().misses, 1);

  assert.equal(empty.get('prompt inexistente'), null);
  assert.equal(empty.getStatus().misses, 1);
});

test('createPromptCache aplica limite LRU simples para manter memória previsível', () => {
  const cache = createPromptCache({ maxEntries: 2 });

  cache.set('a', { response: 'A' });
  cache.set('b', { response: 'B' });
  assert.equal(cache.get('a')?.value.response, 'A');
  cache.set('c', { response: 'C' });

  assert.equal(cache.get('b'), null);
  assert.equal(cache.get('a')?.value.response, 'A');
  assert.equal(cache.get('c')?.value.response, 'C');
  assert.equal(cache.getStatus().entries, 2);
  assert.equal(cache.getStatus().evictions, 1);
});

test('createPromptCache clear remove entradas sem zerar métricas', () => {
  const cache = createPromptCache({ maxEntries: 2 });
  cache.set('a', { response: 'A' });
  cache.set('b', { response: 'B' });

  const removed = cache.clear();

  assert.equal(removed, 2);
  assert.equal(cache.getStatus().entries, 0);
  assert.equal(cache.getStatus().writes, 2);
});
