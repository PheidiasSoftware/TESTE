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

export const SENSITIVE_LOG_KEY_PATTERN = /(authorization|api[_-]?key|token|secret|password|senha|cookie|set-cookie|prompt|context|response|content)/i;

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseMinimumInteger(value, fallback, minimum) {
  return Math.max(minimum, parseInteger(value, fallback));
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

export function getAllowedFileExtensions(env = process.env) {
  const raw = env.ALLOWED_FILE_EXTENSIONS;
  if (!raw) return DEFAULT_ALLOWED_FILE_EXTENSIONS;

  const parsed = raw
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
    .map(item => (item.startsWith('.') ? item : `.${item}`));

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_FILE_EXTENSIONS;
}

export function loadConfig(env = process.env) {
  return {
    HOST: env.HOST || '127.0.0.1',
    PORT: parseInteger(env.PORT || '3131', 3131),
    OLLAMA_URL: env.OLLAMA_URL || 'http://127.0.0.1:11434',
    MODEL: env.MODEL || 'qwen2.5-coder:1.5b-instruct',
    MAX_BODY_BYTES: parseInteger(env.MAX_BODY_BYTES || '65536', 65536),
    REQUEST_TIMEOUT_MS: parseInteger(env.REQUEST_TIMEOUT_MS || '120000', 120000),
    MAX_QUEUE_SIZE: parseInteger(env.MAX_QUEUE_SIZE || '4', 4),
    GENERATION_CONCURRENCY: parseMinimumInteger(env.GENERATION_CONCURRENCY || '1', 1, 1),
    ENABLE_PROMPT_CACHE: parseBooleanFlag(env.ENABLE_PROMPT_CACHE, true),
    MAX_CACHE_ENTRIES: parseMinimumInteger(env.MAX_CACHE_ENTRIES || '20', 20, 0),
    PROJECT_ROOT: resolve(env.PROJECT_ROOT || process.cwd()),
    MAX_FILE_READ_BYTES: parseMinimumInteger(env.MAX_FILE_READ_BYTES || '32768', 32768, 1024),
    MAX_CONTEXT_FILES: parseMinimumInteger(env.MAX_CONTEXT_FILES || '4', 4, 0),
    MAX_CONTEXT_BYTES: parseMinimumInteger(env.MAX_CONTEXT_BYTES || '12000', 12000, 1024),
    ALLOWED_FILE_EXTENSIONS: getAllowedFileExtensions(env),
    LOG_LEVEL: normalizeLogLevel(env.LOG_LEVEL),
    ENABLE_RATE_LIMIT: parseBooleanFlag(env.ENABLE_RATE_LIMIT, true),
    RATE_LIMIT_WINDOW_MS: parseMinimumInteger(env.RATE_LIMIT_WINDOW_MS || '60000', 60000, 1000),
    RATE_LIMIT_MAX_REQUESTS: parseMinimumInteger(env.RATE_LIMIT_MAX_REQUESTS || '30', 30, 1),
    RATE_LIMIT_MAX_CLIENTS: parseMinimumInteger(env.RATE_LIMIT_MAX_CLIENTS || '500', 500, 1),
    TRUST_PROXY: parseBooleanFlag(env.TRUST_PROXY, false)
  };
}

export const CONFIG = loadConfig();
