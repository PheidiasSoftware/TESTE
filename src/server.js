import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

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

const generationQueue = [];
let activeGenerations = 0;
let completedGenerations = 0;
let failedGenerations = 0;

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
  return {
    activeGenerations,
    queuedGenerations: generationQueue.length,
    maxQueueSize: MAX_QUEUE_SIZE,
    generationConcurrency: GENERATION_CONCURRENCY,
    completedGenerations,
    failedGenerations
  };
}

function runQueuedGeneration(job) {
  return new Promise((resolve, reject) => {
    if (generationQueue.length >= MAX_QUEUE_SIZE) {
      reject(Object.assign(new Error('Fila de geração cheia. Tente novamente em alguns instantes.'), { statusCode: 429 }));
      return;
    }

    generationQueue.push({ job, resolve, reject });
    drainGenerationQueue();
  });
}

function drainGenerationQueue() {
  while (activeGenerations < GENERATION_CONCURRENCY && generationQueue.length > 0) {
    const item = generationQueue.shift();
    activeGenerations += 1;

    Promise.resolve()
      .then(item.job)
      .then(result => {
        completedGenerations += 1;
        item.resolve(result);
      })
      .catch(error => {
        failedGenerations += 1;
        item.reject(error);
      })
      .finally(() => {
        activeGenerations -= 1;
        drainGenerationQueue();
      });
  }
}

function buildCodingPrompt({ task, language = 'general', context = '' }) {
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const prompt = buildCodingPrompt({
      task: body.task.slice(0, 8000),
      language: typeof body.language === 'string' ? body.language.slice(0, 80) : 'general',
      context: typeof body.context === 'string' ? body.context.slice(0, 12000) : ''
    });

    const queuedAt = Date.now();
    const result = await runQueuedGeneration(() => callOllamaGenerate(prompt, controller.signal));

    sendJson(response, 200, {
      requestId,
      model: MODEL,
      durationMs: Date.now() - startedAt,
      queueWaitMs: Date.now() - queuedAt - (result.total_duration ? Math.round(result.total_duration / 1_000_000) : 0),
      response: result.response || '',
      done: Boolean(result.done),
      queue: getQueueStatus()
    });
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    sendJson(response, aborted ? 504 : error.statusCode || 500, {
      error: aborted ? 'Tempo limite ao chamar o modelo local.' : error.message,
      detail: error.detail,
      requestId,
      queue: getQueueStatus()
    });
  } finally {
    clearTimeout(timeout);
  }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || HOST}`);

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, {
        status: 'ok',
        service: 'teste-local-code-llm-backend',
        model: MODEL,
        ollamaUrl: OLLAMA_URL,
        queue: getQueueStatus()
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/status') {
      sendJson(response, 200, {
        service: 'teste-local-code-llm-backend',
        model: MODEL,
        ollamaUrl: OLLAMA_URL,
        queue: getQueueStatus()
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

server.listen(PORT, HOST, () => {
  console.log(`Backend local ouvindo em http://${HOST}:${PORT}`);
  console.log(`Modelo configurado: ${MODEL}`);
  console.log(`Fila: concorrência=${GENERATION_CONCURRENCY}, limite=${MAX_QUEUE_SIZE}`);
});
