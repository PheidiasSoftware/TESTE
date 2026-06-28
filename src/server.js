import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { basename, extname, isAbsolute, relative, resolve } from 'node:path';
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
const PROJECT_ROOT = resolve(process.env.PROJECT_ROOT || process.cwd());
const MAX_FILE_READ_BYTES = Math.max(1024, Number.parseInt(process.env.MAX_FILE_READ_BYTES || '32768', 10));
const MAX_CONTEXT_FILES = Math.max(0, Number.parseInt(process.env.MAX_CONTEXT_FILES || '4', 10));
const MAX_CONTEXT_BYTES = Math.max(1024, Number.parseInt(process.env.MAX_CONTEXT_BYTES || '12000', 10));
const DEFAULT_ALLOWED_FILE_EXTENSIONS = [
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

function getAllowedFileExtensions() {
  const raw = process.env.ALLOWED_FILE_EXTENSIONS;
  if (!raw) {
    return DEFAULT_ALLOWED_FILE_EXTENSIONS;
  }

  const parsed = raw
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
    .map(item => (item.startsWith('.') ? item : `.${item}`));

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_FILE_EXTENSIONS;
}

const ALLOWED_FILE_EXTENSIONS = getAllowedFileExtensions();

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

function sendServerEvent(response, event, payload) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function openEventStream(response) {
  response.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-store, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no'
  });
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

function getFileReadStatus() {
  return {
    projectRoot: PROJECT_ROOT,
    maxFileReadBytes: MAX_FILE_READ_BYTES,
    maxContextFiles: MAX_CONTEXT_FILES,
    maxContextBytes: MAX_CONTEXT_BYTES,
    allowedFileExtensions: ALLOWED_FILE_EXTENSIONS
  };
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

export function validateSafeProjectFilePath({
  requestedPath,
  projectRoot = PROJECT_ROOT,
  allowedFileExtensions = ALLOWED_FILE_EXTENSIONS
} = {}) {
  if (!requestedPath || typeof requestedPath !== 'string') {
    throw Object.assign(new Error('Campo obrigatório: path precisa ser texto.'), { statusCode: 400 });
  }

  if (requestedPath.includes('\0')) {
    throw Object.assign(new Error('Caminho inválido.'), { statusCode: 400 });
  }

  if (isAbsolute(requestedPath)) {
    throw Object.assign(new Error('Use caminho relativo ao projeto, não caminho absoluto.'), { statusCode: 400 });
  }

  const safeRoot = resolve(projectRoot);
  const safePath = resolve(safeRoot, requestedPath);
  const relativePath = relative(safeRoot, safePath);

  if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw Object.assign(new Error('Caminho fora da pasta do projeto não é permitido.'), { statusCode: 403 });
  }

  const normalizedSegments = relativePath.split(/[\\/]+/);
  const blockedSegments = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.cache']);
  if (normalizedSegments.some(segment => blockedSegments.has(segment))) {
    throw Object.assign(new Error('Leitura bloqueada para pastas internas, dependências ou artefatos gerados.'), { statusCode: 403 });
  }

  const fileName = basename(relativePath).toLowerCase();
  if (fileName === '.env' || fileName.startsWith('.env.')) {
    throw Object.assign(new Error('Arquivos de ambiente reais não podem ser lidos pela API.'), { statusCode: 403 });
  }

  const extension = extname(relativePath).toLowerCase();
  if (!allowedFileExtensions.includes(extension)) {
    throw Object.assign(new Error(`Extensão não permitida: ${extension || 'sem extensão'}.`), { statusCode: 415 });
  }

  return {
    absolutePath: safePath,
    relativePath
  };
}

export async function readProjectFile({
  path,
  projectRoot = PROJECT_ROOT,
  maxBytes = MAX_FILE_READ_BYTES,
  allowedFileExtensions = ALLOWED_FILE_EXTENSIONS
} = {}) {
  const safeFile = validateSafeProjectFilePath({
    requestedPath: path,
    projectRoot,
    allowedFileExtensions
  });

  const fileStat = await stat(safeFile.absolutePath).catch(error => {
    if (error?.code === 'ENOENT') {
      throw Object.assign(new Error('Arquivo não encontrado.'), { statusCode: 404 });
    }
    throw error;
  });

  if (!fileStat.isFile()) {
    throw Object.assign(new Error('O caminho informado não é um arquivo.'), { statusCode: 400 });
  }

  if (fileStat.size > maxBytes) {
    throw Object.assign(new Error(`Arquivo excede o limite de leitura de ${maxBytes} bytes.`), { statusCode: 413 });
  }

  const content = await readFile(safeFile.absolutePath, 'utf8');

  return {
    path: safeFile.relativePath,
    sizeBytes: fileStat.size,
    maxFileReadBytes: maxBytes,
    content
  };
}

export async function buildContextFromFiles({
  context = '',
  contextFiles = [],
  projectRoot = PROJECT_ROOT,
  maxFiles = MAX_CONTEXT_FILES,
  maxContextBytes = MAX_CONTEXT_BYTES,
  maxFileReadBytes = MAX_FILE_READ_BYTES,
  allowedFileExtensions = ALLOWED_FILE_EXTENSIONS
} = {}) {
  if (contextFiles === undefined || contextFiles === null || contextFiles.length === 0) {
    return {
      context,
      files: [],
      totalBytes: Buffer.byteLength(context, 'utf8'),
      truncated: false
    };
  }

  if (!Array.isArray(contextFiles)) {
    throw Object.assign(new Error('contextFiles precisa ser uma lista de caminhos relativos.'), { statusCode: 400 });
  }

  if (contextFiles.length > maxFiles) {
    throw Object.assign(new Error(`contextFiles aceita no máximo ${maxFiles} arquivo(s).`), { statusCode: 400 });
  }

  const safeContext = typeof context === 'string' ? context : '';
  const parts = safeContext ? [safeContext.slice(0, maxContextBytes)] : [];
  const files = [];
  let totalBytes = Buffer.byteLength(parts.join('\n'), 'utf8');
  let truncated = false;

  for (const item of contextFiles) {
    if (typeof item !== 'string') {
      throw Object.assign(new Error('Todos os itens de contextFiles precisam ser texto.'), { statusCode: 400 });
    }

    const file = await readProjectFile({
      path: item.slice(0, 500),
      projectRoot,
      maxBytes: Math.min(maxFileReadBytes, maxContextBytes),
      allowedFileExtensions
    });

    const header = `\n\n--- arquivo: ${file.path} (${file.sizeBytes} bytes) ---\n`;
    const availableBytes = maxContextBytes - totalBytes - Buffer.byteLength(header, 'utf8');

    if (availableBytes <= 0) {
      truncated = true;
      break;
    }

    let fileContent = file.content;
    if (Buffer.byteLength(fileContent, 'utf8') > availableBytes) {
      fileContent = Buffer.from(fileContent, 'utf8').subarray(0, availableBytes).toString('utf8');
      truncated = true;
    }

    parts.push(`${header}${fileContent}`);
    totalBytes = Buffer.byteLength(parts.join('\n'), 'utf8');
    files.push({
      path: file.path,
      sizeBytes: file.sizeBytes,
      includedBytes: Buffer.byteLength(fileContent, 'utf8')
    });

    if (totalBytes >= maxContextBytes) {
      truncated = true;
      break;
    }
  }

  return {
    context: parts.join('\n'),
    files,
    totalBytes,
    truncated
  };
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

async function callOllamaGenerateStream(prompt, { signal, onToken } = {}) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: true,
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
    throw Object.assign(new Error('Falha ao chamar Ollama em streaming.'), {
      statusCode: 502,
      detail: detail.slice(0, 500)
    });
  }

  if (!response.body) {
    throw Object.assign(new Error('Runtime local não retornou corpo de streaming.'), { statusCode: 502 });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullResponse = '';
  let done = false;

  while (!done) {
    const chunk = await reader.read();
    done = chunk.done;
    buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !done });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      let parsed;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        continue;
      }

      if (parsed.response) {
        fullResponse += parsed.response;
        onToken?.(parsed.response, parsed);
      }

      if (parsed.done) {
        return {
          response: fullResponse,
          done: true,
          total_duration: parsed.total_duration
        };
      }
    }
  }

  return {
    response: fullResponse,
    done: false
  };
}

async function buildGenerateRequestPayload(request, requestId) {
  const body = await readJsonBody(request);

  if (!body.task || typeof body.task !== 'string') {
    throw Object.assign(new Error('Campo obrigatório: task precisa ser texto.'), {
      statusCode: 400,
      requestId
    });
  }

  const contextBundle = await buildContextFromFiles({
    context: typeof body.context === 'string' ? body.context.slice(0, MAX_CONTEXT_BYTES) : '',
    contextFiles: body.contextFiles
  });

  const prompt = buildCodingPrompt({
    task: body.task.slice(0, 8000),
    language: typeof body.language === 'string' ? body.language.slice(0, 80) : 'general',
    context: contextBundle.context
  });

  return {
    prompt,
    contextBundle
  };
}

async function handleGenerate(request, response) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  let payload;

  try {
    payload = await buildGenerateRequestPayload(request, requestId);
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || 'Erro ao montar requisição.',
      requestId,
      fileRead: error.statusCode === 400 ? undefined : getFileReadStatus()
    });
    return;
  }

  const { prompt, contextBundle } = payload;
  const cached = promptCache.get(prompt);
  if (cached) {
    sendJson(response, 200, {
      requestId,
      model: MODEL,
      durationMs: Date.now() - startedAt,
      queueWaitMs: 0,
      cached: true,
      cacheKey: cached.key,
      contextFiles: contextBundle.files,
      contextTruncated: contextBundle.truncated,
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
      contextFiles: contextBundle.files,
      contextTruncated: contextBundle.truncated,
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

async function handleGenerateStream(request, response) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  let payload;

  try {
    payload = await buildGenerateRequestPayload(request, requestId);
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || 'Erro ao montar requisição de streaming.',
      requestId,
      fileRead: error.statusCode === 400 ? undefined : getFileReadStatus()
    });
    return;
  }

  const { prompt, contextBundle } = payload;
  const cached = promptCache.get(prompt);

  openEventStream(response);
  sendServerEvent(response, 'metadata', {
    requestId,
    model: MODEL,
    cached: Boolean(cached),
    contextFiles: contextBundle.files,
    contextTruncated: contextBundle.truncated,
    queue: getQueueStatus(),
    cache: getCacheStatus()
  });

  if (cached) {
    const cachedResponse = cached.value.response || '';
    if (cachedResponse) {
      sendServerEvent(response, 'token', { requestId, token: cachedResponse });
    }
    sendServerEvent(response, 'done', {
      requestId,
      durationMs: Date.now() - startedAt,
      cached: true,
      done: Boolean(cached.value.done),
      queue: getQueueStatus(),
      cache: getCacheStatus()
    });
    response.end();
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const result = await generationQueue.run(() => callOllamaGenerateStream(prompt, {
      signal: controller.signal,
      onToken: token => sendServerEvent(response, 'token', { requestId, token })
    }));

    const cacheKey = promptCache.set(prompt, {
      response: result.response || '',
      done: Boolean(result.done)
    });

    sendServerEvent(response, 'done', {
      requestId,
      durationMs: Date.now() - startedAt,
      cached: false,
      cacheKey,
      done: Boolean(result.done),
      queue: getQueueStatus(),
      cache: getCacheStatus()
    });
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    sendServerEvent(response, 'error', {
      requestId,
      error: aborted ? 'Tempo limite ao chamar o modelo local.' : error.message,
      detail: error.detail,
      queue: getQueueStatus(),
      cache: getCacheStatus()
    });
  } finally {
    clearTimeout(timeout);
    response.end();
  }
}

async function handleReadFile(request, response) {
  const requestId = randomUUID();
  const body = await readJsonBody(request);

  try {
    const result = await readProjectFile({
      path: typeof body.path === 'string' ? body.path.slice(0, 500) : body.path
    });

    sendJson(response, 200, {
      requestId,
      ...result
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || 'Erro ao ler arquivo.',
      requestId,
      fileRead: getFileReadStatus()
    });
  }
}

const ROUTES = [
  'GET /health',
  'GET /api/status',
  'POST /api/generate',
  'POST /api/generate-stream',
  'POST /api/read-file'
];

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
        cache: getCacheStatus(),
        fileRead: getFileReadStatus(),
        routes: ROUTES
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/status') {
      sendJson(response, 200, {
        service: 'teste-local-code-llm-backend',
        model: MODEL,
        ollamaUrl: OLLAMA_URL,
        queue: getQueueStatus(),
        cache: getCacheStatus(),
        fileRead: getFileReadStatus(),
        routes: ROUTES
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/generate') {
      await handleGenerate(request, response);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/generate-stream') {
      await handleGenerateStream(request, response);
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/read-file') {
      await handleReadFile(request, response);
      return;
    }

    sendJson(response, 404, {
      error: 'Rota não encontrada.',
      routes: ROUTES
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
    console.log(`Leitura de arquivos: raiz=${PROJECT_ROOT}, limite=${MAX_FILE_READ_BYTES} bytes`);
    console.log(`Contexto por arquivos: máximo=${MAX_CONTEXT_FILES} arquivos, limite=${MAX_CONTEXT_BYTES} bytes`);
    console.log('Streaming: POST /api/generate-stream com Server-Sent Events');
  });
}

const isEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isEntryPoint) {
  startServer();
}
