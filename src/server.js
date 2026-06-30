import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { createPromptCache } from './cache.js';
import { CONFIG } from './config.js';
import { createGenerationQueue } from './generation-queue.js';
import {
  openEventStream,
  readJsonBody as readJsonBodyFromRequest,
  sendJson,
  sendServerEvent
} from './http.js';
import { buildLargeCodePlan } from './large-code.js';
import { createStructuredLogger } from './logger.js';
import { createOllamaClient } from './ollama.js';
import {
  buildContextFromFiles,
  readProjectFile,
  validateSafeProjectFilePath
} from './project-files.js';
import { createFixedWindowRateLimiter, getClientIdFromRequest } from './rate-limit.js';

export { createPromptCache } from './cache.js';
export { createGenerationQueue } from './generation-queue.js';
export { buildLargeCodePlan } from './large-code.js';
export { createStructuredLogger, redactForLog } from './logger.js';
export {
  buildContextFromFiles,
  readProjectFile,
  validateSafeProjectFilePath
} from './project-files.js';

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
  MAX_LARGE_PLAN_FILES,
  MAX_LARGE_PLAN_STEPS,
  MAX_FILES_PER_CONTEXT_BATCH,
  ALLOWED_FILE_EXTENSIONS,
  LOG_LEVEL,
  ENABLE_RATE_LIMIT,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_MAX_CLIENTS,
  TRUST_PROXY
} = CONFIG;

const logger = createStructuredLogger({ level: LOG_LEVEL });

const generationQueue = createGenerationQueue({ maxQueueSize: MAX_QUEUE_SIZE, generationConcurrency: GENERATION_CONCURRENCY });
const promptCache = createPromptCache({ enabled: ENABLE_PROMPT_CACHE, maxEntries: MAX_CACHE_ENTRIES });
const rateLimiter = createFixedWindowRateLimiter({ enabled: ENABLE_RATE_LIMIT, windowMs: RATE_LIMIT_WINDOW_MS, maxRequests: RATE_LIMIT_MAX_REQUESTS, maxClients: RATE_LIMIT_MAX_CLIENTS });
const ollamaClient = createOllamaClient({ baseUrl: OLLAMA_URL, model: MODEL });

function readJsonBody(request) {
  return readJsonBodyFromRequest(request, { maxBodyBytes: MAX_BODY_BYTES });
}

function getQueueStatus() {
  return generationQueue.getStatus();
}

function getCacheStatus() {
  return promptCache.getStatus();
}

function getFileReadStatus({ exposeProjectRoot = false } = {}) {
  const status = {
    maxFileReadBytes: MAX_FILE_READ_BYTES,
    maxContextFiles: MAX_CONTEXT_FILES,
    maxContextBytes: MAX_CONTEXT_BYTES,
    allowedFileExtensions: ALLOWED_FILE_EXTENSIONS
  };

  if (exposeProjectRoot) status.projectRoot = PROJECT_ROOT;
  return status;
}

function getLargeGenerationStatus() {
  return {
    mode: 'chunked-large-code-generation',
    endpoint: 'POST /api/large-code-plan',
    maxLargePlanFiles: MAX_LARGE_PLAN_FILES,
    maxLargePlanSteps: MAX_LARGE_PLAN_STEPS,
    maxFilesPerContextBatch: MAX_FILES_PER_CONTEXT_BATCH,
    note: 'Use planejamento em etapas para simular contexto gigante sem estourar memória local.'
  };
}

function getLogStatus() {
  return { level: LOG_LEVEL, format: 'json-lines', redaction: 'sensitive-fields' };
}

function getRateLimitStatus() {
  return { ...rateLimiter.getStatus(), trustProxy: TRUST_PROXY, appliedToRoutes: ['POST /api/generate', 'POST /api/generate-stream', 'POST /api/read-file', 'POST /api/large-code-plan'] };
}

function getOllamaStatus() {
  return { configured: Boolean(OLLAMA_URL), endpoint: 'redacted' };
}

function getPublicServiceStatus({ includeHealthStatus = false } = {}) {
  return {
    ...(includeHealthStatus ? { status: 'ok' } : {}),
    service: 'teste-local-code-llm-backend',
    model: MODEL,
    ollama: getOllamaStatus(),
    queue: getQueueStatus(),
    cache: getCacheStatus(),
    fileRead: getFileReadStatus(),
    largeGeneration: getLargeGenerationStatus(),
    logging: getLogStatus(),
    rateLimit: getRateLimitStatus(),
    routes: ROUTES
  };
}

function isJsonContentType(contentType) {
  const mediaType = String(contentType || '').split(';', 1)[0].trim().toLowerCase();
  return mediaType === 'application/json' || mediaType.endsWith('+json');
}

function enforceJsonContentType(request, response, { requestId, route }) {
  if (isJsonContentType(request.headers['content-type'])) return true;

  logger.warn('http.content_type.unsupported', { requestId, route, contentType: request.headers['content-type'] || null });
  sendJson(response, 415, {
    error: 'Content-Type precisa ser application/json.',
    requestId,
    expectedContentType: 'application/json'
  });
  return false;
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

function cappedOptionalInteger(value, fallback, maximum) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return fallback;
  return Math.min(maximum, parsed);
}

export function normalizeLanguageFocus(value, fallback = 'general') {
  const normalized = typeof value === 'string'
    ? value.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim()
    : '';

  return normalized ? normalized.slice(0, 80) : fallback;
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

function callOllamaGenerate(prompt, signal) {
  return ollamaClient.generate(prompt, { signal });
}

function callOllamaGenerateStream(prompt, { signal, onToken } = {}) {
  return ollamaClient.generateStream(prompt, { signal, onToken });
}

async function buildGenerateRequestPayload(request, requestId) {
  const body = await readJsonBody(request);
  const task = typeof body.task === 'string' ? body.task.trim() : '';
  if (!task) throw Object.assign(new Error('Campo obrigatório: task precisa ser texto não vazio.'), { statusCode: 400, requestId });
  const contextBundle = await buildContextFromFiles({
    context: typeof body.context === 'string' ? body.context.slice(0, MAX_CONTEXT_BYTES) : '',
    contextFiles: body.contextFiles,
    projectRoot: PROJECT_ROOT,
    maxFiles: MAX_CONTEXT_FILES,
    maxContextBytes: MAX_CONTEXT_BYTES,
    maxFileReadBytes: MAX_FILE_READ_BYTES,
    allowedFileExtensions: ALLOWED_FILE_EXTENSIONS
  });
  const language = normalizeLanguageFocus(body.language);
  const prompt = buildCodingPrompt({ task: task.slice(0, 8000), language, context: contextBundle.context });
  return { prompt, contextBundle };
}

async function handleGenerate(request, response) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  logger.info('generate.request.received', { requestId, route: 'POST /api/generate', method: request.method, contentLength: request.headers['content-length'] });
  if (!enforceJsonContentType(request, response, { requestId, route: 'POST /api/generate' })) return;
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
    sendJson(response, aborted ? 504 : error.statusCode || 500, { error: aborted ? 'Tempo limite ao chamar o modelo local.' : error.message, requestId, queue: getQueueStatus(), cache: getCacheStatus(), rateLimit: getRateLimitStatus() });
  } finally {
    clearTimeout(timeout);
  }
}

async function handleGenerateStream(request, response) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  logger.info('generate_stream.request.received', { requestId, route: 'POST /api/generate-stream', method: request.method, contentLength: request.headers['content-length'] });
  if (!enforceJsonContentType(request, response, { requestId, route: 'POST /api/generate-stream' })) return;
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
    sendServerEvent(response, 'error', { requestId, error: aborted ? 'Tempo limite ao chamar o modelo local.' : error.message, queue: getQueueStatus(), cache: getCacheStatus(), rateLimit: getRateLimitStatus() });
  } finally {
    clearTimeout(timeout);
    response.end();
  }
}

async function handleReadFile(request, response) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  logger.info('read_file.request.received', { requestId, route: 'POST /api/read-file', method: request.method, contentLength: request.headers['content-length'] });
  if (!enforceJsonContentType(request, response, { requestId, route: 'POST /api/read-file' })) return;
  if (!enforceRateLimit(request, response, { requestId, route: 'POST /api/read-file' })) return;
  try {
    const body = await readJsonBody(request);
    const result = await readProjectFile({
      path: typeof body.path === 'string' ? body.path.slice(0, 500) : body.path,
      projectRoot: PROJECT_ROOT,
      maxBytes: MAX_FILE_READ_BYTES,
      allowedFileExtensions: ALLOWED_FILE_EXTENSIONS
    });
    logger.info('read_file.request.completed', { requestId, durationMs: Date.now() - startedAt, path: result.path, sizeBytes: result.sizeBytes });
    sendJson(response, 200, { requestId, ...result, rateLimit: getRateLimitStatus() });
  } catch (error) {
    logger.warn('read_file.request.failed', { requestId, durationMs: Date.now() - startedAt, statusCode: error.statusCode || 500, error: error.message });
    sendJson(response, error.statusCode || 500, { error: error.message || 'Erro ao ler arquivo.', requestId, fileRead: getFileReadStatus(), rateLimit: getRateLimitStatus() });
  }
}

async function handleLargeCodePlan(request, response) {
  const requestId = randomUUID();
  const startedAt = Date.now();
  logger.info('large_code_plan.request.received', { requestId, route: 'POST /api/large-code-plan', method: request.method, contentLength: request.headers['content-length'] });
  if (!enforceJsonContentType(request, response, { requestId, route: 'POST /api/large-code-plan' })) return;
  if (!enforceRateLimit(request, response, { requestId, route: 'POST /api/large-code-plan' })) return;

  try {
    const body = await readJsonBody(request);
    const plan = buildLargeCodePlan({
      task: body.task,
      language: body.language,
      contextFiles: body.contextFiles,
      targetFiles: body.targetFiles,
      previousStepMemory: body.previousStepMemory,
      maxFiles: cappedOptionalInteger(body.maxFiles, MAX_LARGE_PLAN_FILES, MAX_LARGE_PLAN_FILES),
      maxSteps: cappedOptionalInteger(body.maxSteps, MAX_LARGE_PLAN_STEPS, MAX_LARGE_PLAN_STEPS),
      maxFilesPerStep: cappedOptionalInteger(body.maxFilesPerStep, MAX_FILES_PER_CONTEXT_BATCH, MAX_FILES_PER_CONTEXT_BATCH)
    });

    logger.info('large_code_plan.request.completed', { requestId, durationMs: Date.now() - startedAt, steps: plan.steps.length, contextFiles: plan.totals.contextFiles, targetFiles: plan.totals.targetFiles });
    sendJson(response, 200, { requestId, ...plan, largeGeneration: getLargeGenerationStatus(), rateLimit: getRateLimitStatus() });
  } catch (error) {
    logger.warn('large_code_plan.request.failed', { requestId, durationMs: Date.now() - startedAt, statusCode: error.statusCode || 500, error: error.message });
    sendJson(response, error.statusCode || 500, { error: error.message || 'Erro ao montar plano de geração grande.', requestId, largeGeneration: getLargeGenerationStatus(), rateLimit: getRateLimitStatus() });
  }
}

const ROUTES = ['GET /health', 'GET /api/status', 'POST /api/generate', 'POST /api/generate-stream', 'POST /api/read-file', 'POST /api/large-code-plan'];
const ROUTE_METHODS = new Map([
  ['/health', ['GET']],
  ['/api/status', ['GET']],
  ['/api/generate', ['POST']],
  ['/api/generate-stream', ['POST']],
  ['/api/read-file', ['POST']],
  ['/api/large-code-plan', ['POST']]
]);

function sendMethodNotAllowed(response, allowedMethods) {
  sendJson(response, 405, {
    error: 'Método não permitido para esta rota.',
    allowedMethods,
    routes: ROUTES
  }, { allow: allowedMethods.join(', ') });
}

export const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || HOST}`);
    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, getPublicServiceStatus({ includeHealthStatus: true }));
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/status') {
      sendJson(response, 200, getPublicServiceStatus());
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
    if (request.method === 'POST' && url.pathname === '/api/large-code-plan') {
      await handleLargeCodePlan(request, response);
      return;
    }
    const allowedMethods = ROUTE_METHODS.get(url.pathname);
    if (allowedMethods) {
      sendMethodNotAllowed(response, allowedMethods);
      return;
    }
    sendJson(response, 404, { error: 'Rota não encontrada.', routes: ROUTES });
  } catch (error) {
    logger.error('http.request.failed', { statusCode: error.statusCode || 500, error: error.message });
    sendJson(response, error.statusCode || 500, { error: error.message || 'Erro interno.' });
  }
});

export function getStartupConsoleLines() {
  return [
    `Backend local ouvindo em http://${HOST}:${PORT}`,
    `Modelo configurado: ${MODEL}`,
    `Fila: concorrência=${GENERATION_CONCURRENCY}, limite=${MAX_QUEUE_SIZE}`,
    `Cache: ${ENABLE_PROMPT_CACHE ? 'ativo' : 'desativado'}, limite=${MAX_CACHE_ENTRIES}`,
    `Leitura de arquivos: raiz=redacted, limite=${MAX_FILE_READ_BYTES} bytes`,
    `Contexto por arquivos: máximo=${MAX_CONTEXT_FILES} arquivos, limite=${MAX_CONTEXT_BYTES} bytes`,
    `Geração grande: plano em até ${MAX_LARGE_PLAN_STEPS} etapas, ${MAX_LARGE_PLAN_FILES} arquivos e lotes de ${MAX_FILES_PER_CONTEXT_BATCH}`,
    `Logs estruturados: nível=${LOG_LEVEL}, formato=json-lines`,
    `Rate limit: ${ENABLE_RATE_LIMIT ? 'ativo' : 'desativado'}, limite=${RATE_LIMIT_MAX_REQUESTS}/${RATE_LIMIT_WINDOW_MS}ms`,
    'Streaming: POST /api/generate-stream com Server-Sent Events'
  ];
}

function startServer() {
  server.listen(PORT, HOST, () => {
    logger.info('server.started', { host: HOST, port: PORT, model: MODEL, ollamaUrl: OLLAMA_URL, generationConcurrency: GENERATION_CONCURRENCY, maxQueueSize: MAX_QUEUE_SIZE, promptCacheEnabled: ENABLE_PROMPT_CACHE, maxCacheEntries: MAX_CACHE_ENTRIES, projectRoot: PROJECT_ROOT, maxFileReadBytes: MAX_FILE_READ_BYTES, maxContextFiles: MAX_CONTEXT_FILES, maxContextBytes: MAX_CONTEXT_BYTES, largeGeneration: getLargeGenerationStatus(), logLevel: LOG_LEVEL, rateLimit: getRateLimitStatus() });
    getStartupConsoleLines().forEach(line => console.log(line));
  });
}

const isEntryPoint = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntryPoint) startServer();
