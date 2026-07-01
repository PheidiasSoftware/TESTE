import assert from 'node:assert/strict';
import test from 'node:test';

import { createPromptCache, isCacheablePromptValue } from '../src/cache.js';

test('isCacheablePromptValue aceita somente gerações completas', () => {
  assert.equal(isCacheablePromptValue({ response: 'ok', done: true }), true);
  assert.equal(isCacheablePromptValue({ response: 'parcial', done: false }), false);
  assert.equal(isCacheablePromptValue({ response: 'sem done' }), false);
  assert.equal(isCacheablePromptValue({ response: 42, done: true }), false);
  assert.equal(isCacheablePromptValue(null), false);
  assert.equal(isCacheablePromptValue([]), false);
});

test('createPromptCache armazena e recupera resposta por hash sem expor prompt', () => {
  const cache = createPromptCache({ maxEntries: 2 });
  const prompt = 'crie uma resposta Node.js simples';

  const key = cache.set(prompt, { response: 'resposta ok', done: true });
  const cached = cache.get(prompt);

  assert.equal(typeof key, 'string');
  assert.equal(key.length, 64);
  assert.notEqual(key, prompt);
  assert.deepEqual(cached, {
    key,
    value: { response: 'resposta ok', done: true }
  });
  assert.equal(cache.getStatus().hits, 1);
  assert.equal(cache.getStatus().writes, 1);
});

test('createPromptCache registra miss quando desativado ou vazio', () => {
  const disabled = createPromptCache({ enabled: false, maxEntries: 2 });
  const empty = createPromptCache({ maxEntries: 2 });

  assert.equal(disabled.set('prompt', { response: 'x', done: true }), null);
  assert.equal(disabled.get('prompt'), null);
  assert.equal(disabled.getStatus().misses, 1);

  assert.equal(empty.get('prompt inexistente'), null);
  assert.equal(empty.getStatus().misses, 1);
});

test('createPromptCache não grava resposta parcial ou incompleta', () => {
  const cache = createPromptCache({ enabled: true, maxEntries: 2 });

  assert.equal(cache.set('prompt parcial', { response: 'parcial', done: false }), null);
  assert.equal(cache.set('prompt sem done', { response: 'sem done' }), null);
  assert.equal(cache.get('prompt parcial'), null);
  assert.equal(cache.get('prompt sem done'), null);

  const statusAfterSkippedWrites = cache.getStatus();
  assert.equal(statusAfterSkippedWrites.entries, 0);
  assert.equal(statusAfterSkippedWrites.writes, 0);
  assert.equal(statusAfterSkippedWrites.skippedWrites, 2);

  const cacheKey = cache.set('prompt completo', { response: 'completo', done: true });
  assert.equal(typeof cacheKey, 'string');
  assert.deepEqual(cache.get('prompt completo').value, { response: 'completo', done: true });
  assert.equal(cache.getStatus().writes, 1);
});

test('createPromptCache aplica limite LRU simples para manter memória previsível', () => {
  const cache = createPromptCache({ maxEntries: 2 });

  cache.set('a', { response: 'A', done: true });
  cache.set('b', { response: 'B', done: true });
  assert.equal(cache.get('a')?.value.response, 'A');
  cache.set('c', { response: 'C', done: true });

  assert.equal(cache.get('b'), null);
  assert.equal(cache.get('a')?.value.response, 'A');
  assert.equal(cache.get('c')?.value.response, 'C');
  assert.equal(cache.getStatus().entries, 2);
  assert.equal(cache.getStatus().evictions, 1);
});

test('createPromptCache clear remove entradas sem zerar métricas', () => {
  const cache = createPromptCache({ maxEntries: 2 });
  cache.set('a', { response: 'A', done: true });
  cache.set('b', { response: 'B', done: true });

  const removed = cache.clear();

  assert.equal(removed, 2);
  assert.equal(cache.getStatus().entries, 0);
  assert.equal(cache.getStatus().writes, 2);
});
