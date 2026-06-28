const DEFAULT_OLLAMA_OPTIONS = Object.freeze({
  num_ctx: 2048,
  num_predict: 512,
  temperature: 0.2
});

export function buildOllamaGeneratePayload({
  model,
  prompt,
  stream = false,
  options = {}
} = {}) {
  if (!model || typeof model !== 'string') {
    throw Object.assign(new Error('Modelo Ollama obrigatório.'), { statusCode: 500 });
  }

  if (!prompt || typeof prompt !== 'string') {
    throw Object.assign(new Error('Prompt obrigatório para geração Ollama.'), { statusCode: 500 });
  }

  return {
    model,
    prompt,
    stream: Boolean(stream),
    options: {
      ...DEFAULT_OLLAMA_OPTIONS,
      ...sanitizeOllamaOptions(options)
    }
  };
}

export function sanitizeOllamaOptions(options = {}) {
  const sanitized = {};

  if (Number.isFinite(options.num_ctx)) {
    sanitized.num_ctx = clampInteger(options.num_ctx, 512, 4096);
  }

  if (Number.isFinite(options.num_predict)) {
    sanitized.num_predict = clampInteger(options.num_predict, 64, 2048);
  }

  if (Number.isFinite(options.temperature)) {
    sanitized.temperature = clampNumber(options.temperature, 0, 1);
  }

  return sanitized;
}

export function parseOllamaStreamLine(line) {
  const trimmed = typeof line === 'string' ? line.trim() : '';
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    return {
      response: typeof parsed.response === 'string' ? parsed.response : '',
      done: Boolean(parsed.done),
      total_duration: Number.isFinite(parsed.total_duration) ? parsed.total_duration : undefined,
      raw: parsed
    };
  } catch {
    return null;
  }
}

function clampInteger(value, min, max) {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
