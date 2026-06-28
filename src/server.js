import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { basename, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createPromptCache } from './cache.js';
import {
  CONFIG,
  LOG_LEVEL_PRIORITY,
  SENSITIVE_LOG_KEY_PATTERN
} from './config.js';
import { createOllamaClient } from './ollama.js';
import { createFixedWindowRateLimiter, getClientIdFromRequest } from './rate-limit.js';

export { createPromptCache } from './cache.js';

const {
  HOST,
  PORT,
  OLLAMA_URL,
  MODEL,
  MAX_BODY_BYTES,
  REQUEST_TIMEOUT_MS,
  MAX_QUEUE_SIZE,
  GENERATION_CONCURRENCY,
  ENABLE_PROMPT_CACHE,
  MAX_CACHE_ENTRIES,
  PROJECT_ROOT,
  MAX_FILE_READ_BYTES,
  MAX_CONTEXT_FILES,
  MAX_CONTEXT_BYTES,
  ALLOWED_FILE_EXTENSIONS,
  LOG_LEVEL,
  ENABLE_RATE_LIMIT,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_MAX_CLIENTS,
  TRUST_PROXY
} = CONFIG;

export function redactForLog(value, depth = 0) {
  if (depth > 5) return '[max-depth]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.length > 300 ? `${value.slice(0, 300)}...` : value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map(item => redactForLog(item, depth + 1));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, SENSITIVE_LOG_KEY_PATTERN.test(key) ? '[redacted]' : redactForLog(item, depth + 1)]));
}

export function createStructuredLogger({ level = 'info', sink = console.log } = {}) {
  const configuredPriority = LOG_LEVEL_PRIORITY[level] ?? LOG_LEVEL_PRIORITY.info;
  function shouldLog(eventLevel) {
    const eventPriority = LOG_LEVEL_PRIORITY[eventLevel] ?? LOG_LEVEL_PRIORITY.info;
    return configuredPriority > 0 && eventPriority <= configuredPriority;
  }
  function log(eventLevel, event, details = {}) {
    if (!shouldLog(eventLevel)) return;
    sink(JSON.stringify({ timestamp: new Date().toISOString(), level: eventLevel, service: 'teste-local-code-llm-backend', event, ...redactForLog(details) }));
  }
  return {
    error: (event, details) => log('error', event, details),
    warn: (event, details) => log('warn', event, details),
    info: (event, details) => log('info', event, details),
    debug: (event, details) => log('debug', event, details)
  };
}

const logger = createStructuredLogger({ level: LOG_LEVEL });

export function createGenerationQueue({ maxQueueSize = 4, generationConcurrency = 1 } = {}) {
  const queue = [];
  const metrics = { activeGenerations: 0, completedGenerations: 0, failedGenerations: 0 };
  function getStatus() {
    return { activeGenerations: metrics.activeGenerations, queuedGenerations: queue.length, maxQueueSize, generationConcurrency, completedGenerations: metrics.completedGenerations, failedGenerations: metrics.failedGenerations };
  }
  function drain() {
    while (metrics.activeGenerations < generationConcurrency && queue.length > 0) {
      const item = queue.shift();
      metrics.activeGenerations += 1;
      Promise.resolve().then(item.job).then(result => {
        metrics.completedGenerations += 1;
        item.resolve(result);
      }).catch(error => {
        metrics.failedGenerations += 1;
        item.reject(error);
      }).finally(() => {
        metrics.activeGenerations -= 1;
        drain();
      });
    }
  }
  function run(job) {
    return new Promise((resolvePromise, reject) => {
      if (queue.length >= maxQueueSize) {
        reject(Object.assign(new Error('Fila de geração cheia. Tente novamente em alguns instantes.'), { statusCode: 429 }));
        return;
      }
      queue.push({ job, resolve: resolvePromise, reject });
      drain();
    });
  }
  return { run, getStatus };
}

const generationQueue = createGenerationQueue({ maxQueueSize: MAX_QUEUE_SIZE, generationConcurrency: GENERATION_CONCURRENCY });
const promptCache = createPromptCache({ enabled: ENABLE_PROMPT_CACHE, maxEntries: MAX_CACHE_ENTRIES });
const rateLimiter = createFixedWindowRateLimiter({ enabled: ENABLE_RATE_LIMIT, windowMs: RATE_LIMIT_WINDOW_MS, maxRequests: RATE_LIMIT_MAX_REQUESTS, maxClients: RATE_LIMIT_MAX_CLIENTS });
const ollamaClient = createOllamaClient({ baseUrl: OLLAMA_URL, model: MODEL });

function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  response.end(JSON.stringify(payload, null, 2));
}

function sendServerEvent(response, event, payload) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function openEventStream(response) {
  response.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' });
}

function readJsonBody(request) {
  return new Promise((resolvePromise, reject) => {
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
        resolvePromise({});
        return;
      }
      try {
        resolvePromise(JSON.parse(raw));
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
  return { projectRoot: PROJECT_ROOT, maxFileReadBytes: MAX_FILE_READ_BYTES, maxContextFiles: MAX_CONTEXT_FILES, maxContextBytes: MAX_CONTEXT_BYTES, allowedFileExtensions: ALLOWED_FILE_EXTENSIONS };
}

function getLogStatus() {
  return { level: LOG_LEVEL, format: 'json-lines', redaction: 'sensitive-fields' };
}

function getRateLimitStatus() {
  return { ...rateLimiter.getStatus(), trustProxy: TRUST_PROXY, appliedToRoutes: ['POST /api/generate', 'POST /api/generate-stream', 'POST /api/read-file'] };
}

function enforceRateLimit(request, response, { requestId, route }) {
  const clientId = getClientIdFromRequest(request, { trustProxy: TRUST_PROXY });
  const result = rateLimiter.check(clientId);
  if (result.allowed) return true;
  logger.warn('rate_limit.blocked', { requestId, route, retryAfterMs: result.retryAfterMs, limit: result.limit, remaining: result.remaining });
  sendJson(response, 429, {
    error: 'Muitas requisições em pouco tempo. Aguarde antes de tentar novamente.',
    requestId,
    retryAfterMs: result.retryAfterMs,
    resetAt: result.resetAt,
    rateLimit: getRateLimitStatus()
  }, { 'retry-after': String(Math.ceil(result.retryAfterMs / 1000)) });
  return false;
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

export function validateSafeProjectFilePath({ requestedPath, projectRoot = PROJECT_ROOT, allowedFileExtensions = ALLOWED_FILE_EXTENSIONS } = {}) {
  if (!requestedPath || typeof requestedPath !== 'string') throw Object.assign(new Error('Campo obrigatório: path precisa ser texto.'), { statusCode: 400 });
  if (requestedPath.includes('\0')) throw Object.assign(new Error('Caminho inválido.'), { statusCode: 400 });
  if (isAbsolute(requestedPath)) throw Object.assign(new Error('Use caminho relativo ao projeto, não caminho absoluto.'), { statusCode: 400 });
  const safeRoot = resolve(projectRoot);
  const safePath = resolve(safeRoot, requestedPath);
  const relativePath = relative(safeRoot, safePath);
  if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) throw Object.assign(new Error('Caminho fora da pasta do projeto não é permitido.'), { statusCode: 403 });
  const normalizedSegments = relativePath.split(/[\\/]+/);
  const blockedSegments = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.cache']);
  if (normalizedSegments.some(segment => blockedSegments.has(segment))) throw Object.assign(new Error('Leitura bloqueada para pastas internas, dependências ou artefatos gerados.'), { statusCode: 403 });
  const fileName = basename(relativePath).toLowerCase();
  if (fileName === '.env' || fileName.startsWith('.env.')) throw Object.assign(new Error('Arquivos de ambiente reais não podem ser lidos pela API.'), { statusCode: 403 });
  const extension = extname(relativePath).toLowerCase();
  if (!allowedFileExtensions.includes(extension)) throw Object.assign(new Error(`Extensão não permitida: ${extension || 'sem extensão'}.`), { statusCode: 415 });
  return { absolutePath: safePath, relativePath };
}

export async function readProjectFile({ path, projectRoot = PROJECT_ROOT, maxBytes = MAX_FILE_READ_BYTES, allowedFileExtensions = ALLOWED_FILE_EXTENSIONS } = {}) {
  const safeFile = validateSafeProjectFilePath({ requestedPath: path, projectRoot, allowedFileExtensions });
  const fileStat = await stat(safeFile.absolutePath).catch(error => {
    if (error?.code === 'ENOENT') throw Object.assign(new Error('Arquivo não encontrado.'), { statusCode: 404 });
    throw error;
  });
  if (!fileStat.isFile()) throw Object.assign(new Error('O caminho informado não é um arquivo.'), { statusCode: 400 });
  if (fileStat.size > maxBytes) throw Object.assign(new Error(`Arquivo excede o limite de leitura de ${maxBytes} bytes.`), { statusCode: 413 });
  return { path: safeFile.relativePath, sizeBytes: fileStat.size, maxFileReadBytes: maxBytes, content: await readFile(safeFile.absolutePath, 'utf8') };
}

export async function buildContextFromFiles({ context = '', contextFiles = [], projectRoot = PROJECT_ROOT, maxFiles = MAX_CONTEXT_FILES, maxContextBytes = MAX_CONTEXT_BYTES, maxFileReadBytes = MAX_FILE_READ_BYTES, allowedFileExtensions = ALLOWED_FILE_EXTENSIONS } = {}) {
  if (contextFiles === undefined || contextFiles === null || contextFiles.length === 0) {
    return { context, files: [], totalBytes: Buffer.byteLength(context, 'utf8'), truncated: false };
  }
  if (!Array.isArray(contextFiles)) throw Object.assign(new Error('contextFiles precisa ser uma lista de caminhos relativos.'), { statusCode: 400 });
  if (contextFiles.length > maxFiles) throw Object.assign(new Error(`contextFiles aceita no máximo ${maxFiles} arquivo(s).`), { statusCode: 400 });
  const safeContext = typeof context === 'string' ? context : '';
  const parts = safeContext ? [safeContext.slice(0, maxContextBytes)] : [];
  const files = [];
  let totalBytes = Buffer.byteLength(parts.join('\n'), 'utf8');
  let truncated = false;
  for (const item of contextFiles) {
    if (typeof item !== 'string') throw Object.assign(new Error('Todos os itens de contextFiles precisam ser texto.'), { statusCode: 400 });
    const file = await readProjectFile({ path: item.slice(0, 500), projectRoot, maxBytes: Math.min(maxFileReadBytes, maxContextBytes), allowedFileExtensions });
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
    files.push({ path: file.path, sizeBytes: file.sizeBytes, includedBytes: Buffer.byteLength(fileContent, 'utf8') });
    if (totalBytes >= maxContextBytes) {
      truncated = true;
      break;
    }
  }
  return { context: parts.join('\n'), files, totalBytes, truncated };
}

function callOllamaGenerate(prompt, signal) {
  return ollamaClient.generate(prompt, { signal });
}

function callOllamaGenerateStream(prompt, { signal, onToken } = {}) {
  return ollamaClient.generateStream(prompt, { signal, onToken });
}

async function buildGenerateRequestPayload(request, requestId) {
  const body = await readJsonBody(request);
  if (!body.task || typeof body.task !== 'string') throw Object.assign(new Error('Campo obrigatório: task precisa ser texto.'), { statusCode: 400, requestId });
  const contextBundle = await buildContextFromFiles({ context: typeof body.context === 'string' ? body.context.slice(0, MAX_CONTEXT_BYTES) : '', contextFiles: body.contextFiles });
  const prompt = buildCodingPrompt({ task: body.task.slice(0, 8000), language: typeof body.language === 'string' ? body.language.slice(0, 80) : 'general', context: contextBundle.context });
  return { prompt, contextBundle };
}

async function handleGenerate(request, response) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  logger.info('generate.request.received', { requestId, route: 'POST /api/generate', method: request.method, contentLength: request.headers['content-length'] });
  if (!enforceRateLimit(request, response, { requestId, route: 'POST /api/generate' })) return;
  let payload;
  try {
    payload = await buildGenerateRequestPayload(request, requestId);
  } catch (error) {
    logger.warn('generate.request.invalid', { requestId, statusCode: error.statusCode || 500, error: error.message });
    sendJson(response, error.statusCode || 500, { error: error.message || 'Erro ao montar requisição.', requestId, fileRead: error.statusCode === 400 ? undefined : getFileReadStatus() });
    return;
  }
  const { prompt, contextBundle } = payload;
  const cached = promptCache.get(prompt);
  if (cached) {
    logger.info('generate.cache.hit', { requestId, durationMs: Date.now() - startedAt, contextFilesCount: contextBundle.files.length, contextTruncated: contextBundle.truncated, queue: getQueueStatus(), cache: getCacheStatus() });
    sendJson(response, 200, { requestId, model: MODEL, durationMs: Date.now() - startedAt, queueWaitMs: 0, cached: true, cacheKey: cached.key, contextFiles: contextBundle.files, contextTruncated: contextBundle.truncated, response: cached.value.response || '', done: Boolean(cached.value.done), queue: getQueueStatus(), cache: getCacheStatus(), rateLimit: getRateLimitStatus() });
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const queuedAt = Date.now();
    const result = await generationQueue.run(() => callOllamaGenerate(prompt, controller.signal));
    const cacheKey = promptCache.set(prompt, { response: result.response || '', done: Boolean(result.done) });
    const durationMs = Date.now() - startedAt;
    logger.info('generate.request.completed', { requestId, durationMs, cached: false, contextFilesCount: contextBundle.files.length, contextTruncated: contextBundle.truncated, queue: getQueueStatus(), cache: getCacheStatus() });
    sendJson(response, 200, { requestId, model: MODEL, durationMs, queueWaitMs: Date.now() - queuedAt - (result.total_duration ? Math.round(result.total_duration / 1_000_000) : 0), cached: false, cacheKey, contextFiles: contextBundle.files, contextTruncated: contextBundle.truncated, response: result.response || '', done: Boolean(result.done), queue: getQueueStatus(), cache: getCacheStatus(), rateLimit: getRateLimitStatus() });
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    logger.error('generate.request.failed', { requestId, durationMs: Date.now() - startedAt, statusCode: aborted ? 504 : error.statusCode || 500, error: aborted ? 'Tempo limite ao chamar o modelo local.' : error.message, queue: getQueueStatus(), cache: getCacheStatus() });
    sendJson(response, aborted ? 504 : error.statusCode || 500, { error: aborted ? 'Tempo limite ao chamar o modelo local.' : error.message, detail: error.detail, requestId, queue: getQueueStatus(), cache: getCacheStatus(), rateLimit: getRateLimitStatus() });
  } finally {
    clearTimeout(timeout);
  }
}

async function handleGenerateStream(request, response) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  logger.info('generate_stream.request.received', { requestId, route: 'POST /api/generate-stream', method: request.method, contentLength: request.headers['content-length'] });
  if (!enforceRateLimit(request, response, { requestId, route: 'POST /api/generate-stream' })) return;
  let payload;
  try {
    payload = await buildGenerateRequestPayload(request, requestId);
  } catch (error) {
    logger.warn('generate_stream.request.invalid', { requestId, statusCode: error.statusCode || 500, error: error.message });
    sendJson(response, error.statusCode || 500, { error: error.message || 'Erro ao montar requisição de streaming.', requestId, fileRead: error.statusCode === 400 ? undefined : getFileReadStatus() });
    return;
  }
  const { prompt, contextBundle } = payload;
  const cached = promptCache.get(prompt);
  openEventStream(response);
  sendServerEvent(response, 'metadata', { requestId, model: MODEL, cached: Boolean(cached), contextFiles: contextBundle.files, contextTruncated: contextBundle.truncated, queue: getQueueStatus(), cache: getCacheStatus(), rateLimit: getRateLimitStatus() });
  if (cached) {
    const cachedResponse = cached.value.response || '';
    if (cachedResponse) sendServerEvent(response, 'token', { requestId, token: cachedResponse });
    logger.info('generate_stream.cache.hit', { requestId, durationMs: Date.now() - startedAt, contextFilesCount: contextBundle.files.length, contextTruncated: contextBundle.truncated, queue: getQueueStatus(), cache: getCacheStatus() });
    sendServerEvent(response, 'done', { requestId, durationMs: Date.now() - startedAt, cached: true, done: Boolean(cached.value.done), queue: getQueueStatus(), cache: getCacheStatus(), rateLimit: getRateLimitStatus() });
    response.end();
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const result = await generationQueue.run(() => callOllamaGenerateStream(prompt, { signal: controller.signal, onToken: token => sendServerEvent(response, 'token', { requestId, token }) }));
    const cacheKey = promptCache.set(prompt, { response: result.response || '', done: Boolean(result.done) });
    logger.info('generate_stream.request.completed', { requestId, durationMs: Date.now() - startedAt, cached: false, contextFilesCount: contextBundle.files.length, contextTruncated: contextBundle.truncated, queue: getQueueStatus(), cache: getCacheStatus() });
    sendServerEvent(response, 'done', { requestId, durationMs: Date.now() - startedAt, cached: false, cacheKey, done: Boolean(result.done), queue: getQueueStatus(), cache: getCacheStatus(), rateLimit: getRateLimitStatus() });
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    logger.error('generate_stream.request.failed', { requestId, durationMs: Date.now() - startedAt, statusCode: aborted ? 504 : error.statusCode || 500, error: aborted ? 'Tempo limite ao chamar o modelo local.' : error.message, queue: getQueueStatus(), cache: getCacheStatus() });
    sendServerEvent(response, 'error', { requestId, error: aborted ? 'Tempo limite ao chamar o modelo local.' : error.message, detail: error.detail, queue: getQueueStatus(), cache: getCacheStatus(), rateLimit: getRateLimitStatus() });
  } finally {
    clearTimeout(timeout);
    response.end();
  }
}

async function handleReadFile(request, response) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  logger.info('read_file.request.received', { requestId, route: 'POST /api/read-file', method: request.method, contentLength: request.headers['content-length'] });
  if (!enforceRateLimit(request, response, { requestId, route: 'POST /api/read-file' })) return;
  try {
    const body = await readJsonBody(request);
    const result = await readProjectFile({ path: typeof body.path === 'string' ? body.path.slice(0, 500) : body.path });
    logger.info('read_file.request.completed', { requestId, durationMs: Date.now() - startedAt, path: result.path, sizeBytes: result.sizeBytes });
    sendJson(response, 200, { requestId, ...result, rateLimit: getRateLimitStatus() });
  } catch (error) {
    logger.warn('read_file.request.failed', { requestId, durationMs: Date.now() - startedAt, statusCode: error.statusCode || 500, error: error.message });
    sendJson(response, error.statusCode || 500, { error: error.message || 'Erro ao ler arquivo.', requestId, fileRead: getFileReadStatus(), rateLimit: getRateLimitStatus() });
  }
}

const ROUTES = ['GET /health', 'GET /api/status', 'POST /api/generate', 'POST /api/generate-stream', 'POST /api/read-file'];

export const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || HOST}`);
    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { status: 'ok', service: 'teste-local-code-llm-backend', model: MODEL, ollamaUrl: OLLAMA_URL, queue: getQueueStatus(), cache: getCacheStatus(), fileRead: getFileReadStatus(), logging: getLogStatus(), rateLimit: getRateLimitStatus(), routes: ROUTES });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/status') {
      sendJson(response, 200, { service: 'teste-local-code-llm-backend', model: MODEL, ollamaUrl: OLLAMA_URL, queue: getQueueStatus(), cache: getCacheStatus(), fileRead: getFileReadStatus(), logging: getLogStatus(), rateLimit: getRateLimitStatus(), routes: ROUTES });
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
    sendJson(response, 404, { error: 'Rota não encontrada.', routes: ROUTES });
  } catch (error) {
    logger.error('http.request.failed', { statusCode: error.statusCode || 500, error: error.message });
    sendJson(response, error.statusCode || 500, { error: error.message || 'Erro interno.' });
  }
});

function startServer() {
  server.listen(PORT, HOST, () => {
    logger.info('server.started', { host: HOST, port: PORT, model: MODEL, ollamaUrl: OLLAMA_URL, generationConcurrency: GENERATION_CONCURRENCY, maxQueueSize: MAX_QUEUE_SIZE, promptCacheEnabled: ENABLE_PROMPT_CACHE, maxCacheEntries: MAX_CACHE_ENTRIES, projectRoot: PROJECT_ROOT, maxFileReadBytes: MAX_FILE_READ_BYTES, maxContextFiles: MAX_CONTEXT_FILES, maxContextBytes: MAX_CONTEXT_BYTES, logLevel: LOG_LEVEL, rateLimit: getRateLimitStatus() });
    console.log(`Backend local ouvindo em http://${HOST}:${PORT}`);
    console.log(`Modelo configurado: ${MODEL}`);
    console.log(`Fila: concorrência=${GENERATION_CONCURRENCY}, limite=${MAX_QUEUE_SIZE}`);
    console.log(`Cache: ${ENABLE_PROMPT_CACHE ? 'ativo' : 'desativado'}, limite=${MAX_CACHE_ENTRIES}`);
    console.log(`Leitura de arquivos: raiz=${PROJECT_ROOT}, limite=${MAX_FILE_READ_BYTES} bytes`);
    console.log(`Contexto por arquivos: máximo=${MAX_CONTEXT_FILES} arquivos, limite=${MAX_CONTEXT_BYTES} bytes`);
    console.log(`Logs estruturados: nível=${LOG_LEVEL}, formato=json-lines`);
    console.log(`Rate limit: ${ENABLE_RATE_LIMIT ? 'ativo' : 'desativado'}, limite=${RATE_LIMIT_MAX_REQUESTS}/${RATE_LIMIT_WINDOW_MS}ms`);
    console.log('Streaming: POST /api/generate-stream com Server-Sent Events');
  });
}

const isEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) startServer();
