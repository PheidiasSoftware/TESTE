import { resolve } from 'node:path';

export const DEFAULT_ALLOWED_FILE_EXTENSIONS = [
  '.css',
  '.dart',
  '.html',
  '.js',
  '.json',
  '.md',
  '.ps1',
  '.sql',
  '.ts',
  '.txt',
  '.yaml',
  '.yml'
];

export const LOG_LEVEL_PRIORITY = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
};

export const RUNTIME_NUMERIC_LIMITS = {
  MAX_BODY_BYTES: { fallback: 65536, minimum: 1024, maximum: 262144 },
  REQUEST_TIMEOUT_MS: { fallback: 120000, minimum: 1000, maximum: 300000 },
  MAX_QUEUE_SIZE: { fallback: 4, minimum: 1, maximum: 20 },
  GENERATION_CONCURRENCY: { fallback: 1, minimum: 1, maximum: 2 },
  MAX_CACHE_ENTRIES: { fallback: 20, minimum: 0, maximum: 100 },
  MAX_FILE_READ_BYTES: { fallback: 32768, minimum: 1024, maximum: 131072 },
  MAX_CONTEXT_FILES: { fallback: 4, minimum: 0, maximum: 12 },
  MAX_CONTEXT_BYTES: { fallback: 12000, minimum: 1024, maximum: 32768 },
  MAX_LARGE_PLAN_FILES: { fallback: 50, minimum: 0, maximum: 200 },
  MAX_LARGE_PLAN_STEPS: { fallback: 20, minimum: 2, maximum: 80 },
  MAX_FILES_PER_CONTEXT_BATCH: { fallback: 4, minimum: 1, maximum: 12 },
  RATE_LIMIT_WINDOW_MS: { fallback: 60000, minimum: 1000, maximum: 300000 },
  RATE_LIMIT_MAX_REQUESTS: { fallback: 30, minimum: 1, maximum: 300 },
  RATE_LIMIT_MAX_CLIENTS: { fallback: 500, minimum: 1, maximum: 2000 }
};

export const SENSITIVE_LOG_KEY_PATTERN = /(authorization|api[_-]?key|token|secret|password|senha|cookie|set-cookie|prompt|context|response|content|detail|upstream[_-]?error[_-]?detail|ollama[_-]?url|base[_-]?url|project[_-]?root)/i;

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_MODEL = 'qwen2.5-coder:1.5b-instruct';
const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434';
const ALLOWED_LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const MODEL_NAME_PATTERN = /^[a-z0-9][a-z0-9._/-]{0,119}(?::[a-z0-9][a-z0-9._-]{0,63})?$/i;

export function parseInteger(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;

  const normalized = String(value).trim();
  if (!/^[+-]?\d+$/.test(normalized)) return fallback;

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}

export function parseBoundedInteger(value, { fallback, minimum, maximum }) {
  const parsed = parseInteger(value, fallback);
  return Math.min(maximum, Math.max(minimum, parsed));
}

export function normalizeHost(value, fallback = DEFAULT_HOST) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return fallback;

  const host = normalized === '[::1]' ? '::1' : normalized;
  return ALLOWED_LOCAL_HOSTS.has(host) ? host : fallback;
}

export function parsePort(value, fallback = 3131) {
  const parsed = parseInteger(value, fallback);
  return parsed >= 1 && parsed <= 65535 ? parsed : fallback;
}

export function normalizeOllamaUrl(value, fallback = DEFAULT_OLLAMA_URL) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return fallback;

  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return fallback;
    url.username = '';
    url.password = '';
    url.hash = '';
    url.search = '';

    const pathname = url.pathname.replace(/\/+$/, '');
    if (pathname === '/api' || pathname === '/api/generate') {
      url.pathname = '';
    }

    return url.toString().replace(/\/+$/, '');
  } catch {
    return fallback;
  }
}

export function normalizeModelName(value, fallback = DEFAULT_MODEL) {
  const normalized = String(value || '').trim();
  if (!normalized) return fallback;
  if (normalized.length > 180) return fallback;

  return MODEL_NAME_PATTERN.test(normalized) ? normalized : fallback;
}

export function parseBooleanFlag(value, defaultValue = true) {
  if (value === undefined || value === null || value === '') return defaultValue;

  const normalized = String(value).trim().toLowerCase();

  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;

  return defaultValue;
}

export function normalizeLogLevel(value, fallback = 'info') {
  const normalized = String(value || '').trim().toLowerCase();
  return Object.hasOwn(LOG_LEVEL_PRIORITY, normalized) ? normalized : fallback;
}

export function normalizeAllowedFileExtension(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;

  const extension = normalized.startsWith('.') ? normalized : `.${normalized}`;
  if (!/^\.[a-z0-9][a-z0-9_-]*$/.test(extension)) return null;

  return extension;
}

export function getAllowedFileExtensions(env = process.env) {
  const raw = env.ALLOWED_FILE_EXTENSIONS;
  if (!raw) return DEFAULT_ALLOWED_FILE_EXTENSIONS;

  const parsed = Array.from(
    new Set(
      raw
        .split(',')
        .map(normalizeAllowedFileExtension)
        .filter(Boolean)
    )
  );

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_FILE_EXTENSIONS;
}

export function loadConfig(env = process.env) {
  return {
    HOST: normalizeHost(env.HOST),
    PORT: parsePort(env.PORT || '3131', 3131),
    OLLAMA_URL: normalizeOllamaUrl(env.OLLAMA_URL),
    MODEL: normalizeModelName(env.MODEL),
    MAX_BODY_BYTES: parseBoundedInteger(env.MAX_BODY_BYTES, RUNTIME_NUMERIC_LIMITS.MAX_BODY_BYTES),
    REQUEST_TIMEOUT_MS: parseBoundedInteger(env.REQUEST_TIMEOUT_MS, RUNTIME_NUMERIC_LIMITS.REQUEST_TIMEOUT_MS),
    MAX_QUEUE_SIZE: parseBoundedInteger(env.MAX_QUEUE_SIZE, RUNTIME_NUMERIC_LIMITS.MAX_QUEUE_SIZE),
    GENERATION_CONCURRENCY: parseBoundedInteger(env.GENERATION_CONCURRENCY, RUNTIME_NUMERIC_LIMITS.GENERATION_CONCURRENCY),
    ENABLE_PROMPT_CACHE: parseBooleanFlag(env.ENABLE_PROMPT_CACHE, true),
    MAX_CACHE_ENTRIES: parseBoundedInteger(env.MAX_CACHE_ENTRIES, RUNTIME_NUMERIC_LIMITS.MAX_CACHE_ENTRIES),
    PROJECT_ROOT: resolve(env.PROJECT_ROOT || process.cwd()),
    MAX_FILE_READ_BYTES: parseBoundedInteger(env.MAX_FILE_READ_BYTES, RUNTIME_NUMERIC_LIMITS.MAX_FILE_READ_BYTES),
    MAX_CONTEXT_FILES: parseBoundedInteger(env.MAX_CONTEXT_FILES, RUNTIME_NUMERIC_LIMITS.MAX_CONTEXT_FILES),
    MAX_CONTEXT_BYTES: parseBoundedInteger(env.MAX_CONTEXT_BYTES, RUNTIME_NUMERIC_LIMITS.MAX_CONTEXT_BYTES),
    MAX_LARGE_PLAN_FILES: parseBoundedInteger(env.MAX_LARGE_PLAN_FILES, RUNTIME_NUMERIC_LIMITS.MAX_LARGE_PLAN_FILES),
    MAX_LARGE_PLAN_STEPS: parseBoundedInteger(env.MAX_LARGE_PLAN_STEPS, RUNTIME_NUMERIC_LIMITS.MAX_LARGE_PLAN_STEPS),
    MAX_FILES_PER_CONTEXT_BATCH: parseBoundedInteger(env.MAX_FILES_PER_CONTEXT_BATCH, RUNTIME_NUMERIC_LIMITS.MAX_FILES_PER_CONTEXT_BATCH),
    ALLOWED_FILE_EXTENSIONS: getAllowedFileExtensions(env),
    LOG_LEVEL: normalizeLogLevel(env.LOG_LEVEL),
    ENABLE_RATE_LIMIT: parseBooleanFlag(env.ENABLE_RATE_LIMIT, true),
    RATE_LIMIT_WINDOW_MS: parseBoundedInteger(env.RATE_LIMIT_WINDOW_MS, RUNTIME_NUMERIC_LIMITS.RATE_LIMIT_WINDOW_MS),
    RATE_LIMIT_MAX_REQUESTS: parseBoundedInteger(env.RATE_LIMIT_MAX_REQUESTS, RUNTIME_NUMERIC_LIMITS.RATE_LIMIT_MAX_REQUESTS),
    RATE_LIMIT_MAX_CLIENTS: parseBoundedInteger(env.RATE_LIMIT_MAX_CLIENTS, RUNTIME_NUMERIC_LIMITS.RATE_LIMIT_MAX_CLIENTS),
    TRUST_PROXY: parseBooleanFlag(env.TRUST_PROXY, false)
  };
}

export const CONFIG = loadConfig();