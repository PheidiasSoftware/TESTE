import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number.parseInt(process.env.PORT || '3131', 10);
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const MODEL = process.env.MODEL || 'qwen2.5-coder:1.5b-instruct';
const MAX_BODY_BYTES = Number.parseInt(process.env.MAX_BODY_BYTES || '65536', 10);
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.REQUEST_TIMEOUT_MS || '120000', 10);
const MAX_QUEUE_SIZE = Number.parseInt(process.env.MAX_QUEUE_SIZE || '4', 10);
const GENERATION_CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.GENERATION_CONCURRENCY || '1', 10)
);
const ENABLE_PROMPT_CACHE = process.env.ENABLE_PROMPT_CACHE !== 'false';
const MAX_CACHE_ENTRIES = Math.max(0, Number.parseInt(process.env.MAX_CACHE_ENTRIES || '20', 10));

export function createPromptCache({ enabled = true, maxEntries = 20 } = {}) {
  const entries = new Map();
  const metrics = {
    hits: 0,
    misses: 0,
    writes: 0,
    evictions: 0
  };

  function hashPrompt(prompt) {
    return createHash('sha256').update(prompt).digest('hex');
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
    return {
      key,
      value
    };
  }

  function set(prompt, value) {
    if (!enabled || maxEntries <= 0) {
      return null;
    }

    const key = hashPrompt(prompt);
    if (entries.has(key)) {
      entries.delete(key);
    }

    entries.set(key, value);
    metrics.writes += 1;

    while (entries.size > maxEntries) {
      const oldestKey = entries.keys().next().value;
      entries.delete(oldestKey);
      metrics.evictions += 1;
    }

    return key;
  }

  function getStatus() {
    return {
      enabled,
      maxEntries,
      entries: entries.size,
      hits: metrics.hits,
      misses: metrics.misses,
      writes: metrics.writes,
      evictions: metrics.evictions
    };
  }

  return {
    get,
    set,
    getStatus
  };
}

export function createGenerationQueue({ maxQueueSize = 4, generationConcurrency = 1 } = {}) {
  const queue = [];
  const metrics = {
    activeGenerations: 0,
    completedGenerations: 0,
    failedGenerations: 0
  };

  function getStatus() {
    return {
      activeGenerations: metrics.activeGenerations,
      queuedGenerations: queue.length,
      maxQueueSize,
      generationConcurrency,
      completedGenerations: metrics.completedGenerations,
      failedGenerations: metrics.failedGenerations
    };
  }

  function drain() {
    while (metrics.activeGenerations < generationConcurrency && queue.length > 0) {
      const item = queue.shift();
      metrics.activeGenerations += 1;

      Promise.resolve()
        .then(item.job)
        .then(result => {
          metrics.completedGenerations += 1;
          item.resolve(result);
        })
        .catch(error => {
          metrics.failedGenerations += 1;
          item.reject(error);
        })
        .finally(() => {
          metrics.activeGenerations -= 1;
          drain();
        });
    }
  }

  function run(job) {
    return new Promise((resolve, reject) => {
      if (queue.length >= maxQueueSize) {
        reject(Object.assign(new Error('Fila de geração cheia. Tente novamente em alguns instantes.'), { statusCode: 429 }));
        return;
      }

      queue.push({ job, resolve, reject });
      drain();
    });
  }

  return {
    run,
    getStatus
  };
}

const generationQueue = createGenerationQueue({
  maxQueueSize: MAX_QUEUE_SIZE,
  generationConcurrency: GENERATION_CONCURRENCY
});

const promptCache = createPromptCache({
  enabled: ENABLE_PROMPT_CACHE,
  maxEntries: MAX_CACHE_ENTRIES
});

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  response.end(body);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let raw = '';

    request.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Payload muito grande.'), { statusCode: 413 }));
        request.destroy();
        return;
      }
      raw += chunk;
    });

    request.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(Object.assign(new Error('JSON inválido.'), { statusCode: 400 }));
      }
    });

    request.on('error', reject);
  });
}

function getQueueStatus() {
  return generationQueue.getStatus();
}

function getCacheStatus() {
  return promptCache.getStatus();
}

export function buildCodingPrompt({ task, language = 'general', context = '' }) {
  return [
    'Você é uma SLM local focada em programação para PC fraco, sem GPU.',
    'Responda de forma objetiva, segura, com código simples e pouca memória.',
    'Priorize Node.js, Flutter/Dart e MySQL quando fizer sentido.',
    'Não invente arquivos que não foram informados e não sugira comandos destrutivos.',
    `Linguagem/foco: ${language}`,
    context ? `Contexto do projeto:\n${context}` : 'Contexto do projeto: não fornecido.',
    `Tarefa:\n${task}`
  ].join('\n\n');
}

async function callOllamaGenerate(prompt, signal) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        num_ctx: 2048,
        num_predict: 512,
        temperature: 0.2
      }
    }),
    signal
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw Object.assign(new Error('Falha ao chamar Ollama.'), {
      statusCode: 502,
      detail: detail.slice(0, 500)
    });
  }

  return response.json();
}

async function handleGenerate(request, response) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const body = await readJsonBody(request);

  if (!body.task || typeof body.task !== 'string') {
    sendJson(response, 400, {
      error: 'Campo obrigatório: task precisa ser texto.',
      requestId
    });
    return;
  }

  const prompt = buildCodingPrompt({
    task: body.task.slice(0, 8000),
    language: typeof body.language === 'string' ? body.language.slice(0, 80) : 'general',
    context: typeof body.context === 'string' ? body.context.slice(0, 12000) : ''
  });

  const cached = promptCache.get(prompt);
  if (cached) {
    sendJson(response, 200, {
      requestId,
      model: MODEL,
      durationMs: Date.now() - startedAt,
      queueWaitMs: 0,
      cached: true,
      cacheKey: cached.key,
      response: cached.value.response || '',
      done: Boolean(cached.value.done),
      queue: getQueueStatus(),
      cache: getCacheStatus()
    });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const queuedAt = Date.now();
    const result = await generationQueue.run(() => callOllamaGenerate(prompt, controller.signal));
    const cacheKey = promptCache.set(prompt, {
      response: result.response || '',
      done: Boolean(result.done)
    });

    sendJson(response, 200, {
      requestId,
      model: MODEL,
      durationMs: Date.now() - startedAt,
      queueWaitMs: Date.now() - queuedAt - (result.total_duration ? Math.round(result.total_duration / 1_000_000) : 0),
      cached: false,
      cacheKey,
      response: result.response || '',
      done: Boolean(result.done),
      queue: getQueueStatus(),
      cache: getCacheStatus()
    });
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    sendJson(response, aborted ? 504 : error.statusCode || 500, {
      error: aborted ? 'Tempo limite ao chamar o modelo local.' : error.message,
      detail: error.detail,
      requestId,
      queue: getQueueStatus(),
      cache: getCacheStatus()
    });
  } finally {
    clearTimeout(timeout);
  }
}

export const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || HOST}`);

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, {
        status: 'ok',
        service: 'teste-local-code-llm-backend',
        model: MODEL,
        ollamaUrl: OLLAMA_URL,
        queue: getQueueStatus(),
        cache: getCacheStatus()
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/status') {
      sendJson(response, 200, {
        service: 'teste-local-code-llm-backend',
        model: MODEL,
        ollamaUrl: OLLAMA_URL,
        queue: getQueueStatus(),
        cache: getCacheStatus()
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/generate') {
      await handleGenerate(request, response);
      return;
    }

    sendJson(response, 404, {
      error: 'Rota não encontrada.',
      routes: ['GET /health', 'GET /api/status', 'POST /api/generate']
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || 'Erro interno.'
    });
  }
});

function startServer() {
  server.listen(PORT, HOST, () => {
    console.log(`Backend local ouvindo em http://${HOST}:${PORT}`);
    console.log(`Modelo configurado: ${MODEL}`);
    console.log(`Fila: concorrência=${GENERATION_CONCURRENCY}, limite=${MAX_QUEUE_SIZE}`);
    console.log(`Cache: ${ENABLE_PROMPT_CACHE ? 'ativo' : 'desativado'}, limite=${MAX_CACHE_ENTRIES}`);
  });
}

const isEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isEntryPoint) {
  startServer();
}
