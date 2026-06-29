import {
  LOG_LEVEL_PRIORITY,
  SENSITIVE_LOG_KEY_PATTERN
} from './config.js';

const MAX_LOG_STRING_LENGTH = 300;
const MAX_LOG_ARRAY_ITEMS = 20;
const MAX_LOG_DEPTH = 5;

export function redactForLog(value, depth = 0) {
  if (depth > MAX_LOG_DEPTH) return '[max-depth]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return value.length > MAX_LOG_STRING_LENGTH
      ? `${value.slice(0, MAX_LOG_STRING_LENGTH)}...`
      : value;
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_LOG_ARRAY_ITEMS)
      .map(item => redactForLog(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_LOG_KEY_PATTERN.test(key)
        ? '[redacted]'
        : redactForLog(item, depth + 1)
    ])
  );
}

export function createStructuredLogger({
  level = 'info',
  sink = console.log,
  service = 'teste-local-code-llm-backend',
  now = () => new Date()
} = {}) {
  const configuredPriority = LOG_LEVEL_PRIORITY[level] ?? LOG_LEVEL_PRIORITY.info;

  function shouldLog(eventLevel) {
    const eventPriority = LOG_LEVEL_PRIORITY[eventLevel] ?? LOG_LEVEL_PRIORITY.info;
    return configuredPriority > 0 && eventPriority <= configuredPriority;
  }

  function log(eventLevel, event, details = {}) {
    if (!shouldLog(eventLevel)) return;
    sink(JSON.stringify({
      timestamp: now().toISOString(),
      level: eventLevel,
      service,
      event,
      ...redactForLog(details)
    }));
  }

  return {
    error: (event, details) => log('error', event, details),
    warn: (event, details) => log('warn', event, details),
    info: (event, details) => log('info', event, details),
    debug: (event, details) => log('debug', event, details)
  };
}
