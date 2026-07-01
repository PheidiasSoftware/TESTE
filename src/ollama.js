const DEFAULT_OLLAMA_OPTIONS = Object.freeze({
  num_ctx: 2048,
  num_predict: 512,
  temperature: 0.2
});

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

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

export function sanitizeUpstreamErrorDetail(value, { maxLength = 300 } = {}) {
  const text = typeof value === 'string'
    ? value
        .replace(/[\u0000-\u001F\u007F]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';

  return text ? text.slice(0, maxLength) : undefined;
}

export function createSafeUpstreamError(message, { statusCode = 502, detail } = {}) {
  const upstreamErrorDetail = sanitizeUpstreamErrorDetail(detail);
  return Object.assign(new Error(message), {
    statusCode,
    upstreamErrorDetail,
    exposeDetail: false
  });
}

export function normalizeOllamaGenerateResult(value) {
  if (!isPlainObject(value) || typeof value.response !== 'string') {
    throw createSafeUpstreamError('Resposta inválida do Ollama.');
  }

  const result = {
    response: value.response,
    done: Boolean(value.done)
  };

  if (Number.isFinite(value.total_duration)) {
    result.total_duration = value.total_duration;
  }

  return result;
}

export function parseOllamaStreamLine(line) {
  const trimmed = typeof line === 'string' ? line.trim() : '';
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (!isPlainObject(parsed)) return null;

    return {
      response: typeof parsed.response === 'string' ? parsed.response : '',
      done: Boolean(parsed.done),
      total_duration: Number.isFinite(parsed.total_duration) ? parsed.total_duration : undefined,
      error: typeof parsed.error === 'string' ? parsed.error : undefined,
      raw: parsed
    };
  } catch {
    return null;
  }
}

export function createOllamaClient({
  baseUrl,
  model,
  fetchImpl = globalThis.fetch,
  defaultOptions = {}
} = {}) {
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw Object.assign(new Error('baseUrl do Ollama obrigatório.'), { statusCode: 500 });
  }

  if (!model || typeof model !== 'string') {
    throw Object.assign(new Error('Modelo Ollama obrigatório.'), { statusCode: 500 });
  }

  if (typeof fetchImpl !== 'function') {
    throw Object.assign(new Error('fetchImpl obrigatório para cliente Ollama.'), { statusCode: 500 });
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/generate`;

  async function generate(prompt, { signal, options = {} } = {}) {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(buildOllamaGeneratePayload({
        model,
        prompt,
        stream: false,
        options: { ...defaultOptions, ...options }
      })),
      signal
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw createSafeUpstreamError('Falha ao chamar Ollama.', { detail });
    }

    try {
      return normalizeOllamaGenerateResult(await response.json());
    } catch {
      throw createSafeUpstreamError('Resposta inválida do Ollama.');
    }
  }

  async function generateStream(prompt, { signal, options = {}, onToken } = {}) {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(buildOllamaGeneratePayload({
        model,
        prompt,
        stream: true,
        options: { ...defaultOptions, ...options }
      })),
      signal
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw createSafeUpstreamError('Falha ao chamar Ollama em streaming.', { detail });
    }

    if (!response.body) {
      throw Object.assign(new Error('Runtime local não retornou corpo de streaming.'), { statusCode: 502 });
    }

    return readOllamaStream(response.body, { onToken });
  }

  return { generate, generateStream };
}

export async function readOllamaStream(body, { onToken } = {}) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';

  function handleParsedLine(parsed) {
    if (!parsed) return null;

    if (parsed.error) {
      throw createSafeUpstreamError('Falha ao chamar Ollama em streaming.', { detail: parsed.error });
    }

    if (parsed.response) {
      fullResponse += parsed.response;
      onToken?.(parsed.response, parsed.raw);
    }

    if (parsed.done) {
      return {
        response: fullResponse,
        done: true,
        total_duration: parsed.total_duration
      };
    }

    return null;
  }

  while (true) {
    const chunk = await reader.read();
    buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !chunk.done });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const result = handleParsedLine(parseOllamaStreamLine(line));
      if (result) return result;
    }

    if (chunk.done) break;
  }

  const finalResult = handleParsedLine(parseOllamaStreamLine(buffer));
  if (finalResult) return finalResult;

  return { response: fullResponse, done: false };
}

function clampInteger(value, min, max) {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
