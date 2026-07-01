import { createHash } from 'node:crypto';

export function isCacheablePromptValue(value) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && value.done === true
    && typeof value.response === 'string';
}

export function createPromptCache({ enabled = true, maxEntries = 20 } = {}) {
  const entries = new Map();
  const metrics = {
    hits: 0,
    misses: 0,
    writes: 0,
    evictions: 0,
    skippedWrites: 0
  };

  function hashPrompt(prompt) {
    return createHash('sha256').update(String(prompt)).digest('hex');
  }

  function get(prompt) {
    if (!enabled || maxEntries <= 0) {
      metrics.misses += 1;
      return null;
    }

    const key = hashPrompt(prompt);
    if (!entries.has(key)) {
      metrics.misses += 1;
      return null;
    }

    const value = entries.get(key);
    entries.delete(key);
    entries.set(key, value);
    metrics.hits += 1;

    return { key, value };
  }

  function set(prompt, value) {
    if (!enabled || maxEntries <= 0) return null;

    if (!isCacheablePromptValue(value)) {
      metrics.skippedWrites += 1;
      return null;
    }

    const key = hashPrompt(prompt);
    if (entries.has(key)) entries.delete(key);

    entries.set(key, value);
    metrics.writes += 1;

    while (entries.size > maxEntries) {
      const oldestKey = entries.keys().next().value;
      entries.delete(oldestKey);
      metrics.evictions += 1;
    }

    return key;
  }

  function clear() {
    const removed = entries.size;
    entries.clear();
    return removed;
  }

  function getStatus() {
    return {
      enabled,
      maxEntries,
      entries: entries.size,
      hits: metrics.hits,
      misses: metrics.misses,
      writes: metrics.writes,
      evictions: metrics.evictions,
      skippedWrites: metrics.skippedWrites
    };
  }

  return {
    get,
    set,
    clear,
    getStatus
  };
}
