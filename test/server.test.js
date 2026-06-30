import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildCodingPrompt,
  createGenerationQueue,
  createPromptCache,
  readProjectFile,
  server,
  validateSafeProjectFilePath
} from '../src/server.js';

function toPosixPath(path) {
  return path.replaceAll('\\', '/');
}

async function withTestServer(callback) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    return await callback(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  }
}

const EXPECTED_ROUTES = [
  'GET /health',
  'GET /api/status',
  'POST /api/generate',
  'POST /api/generate-stream',
  'POST /api/read-file',
  'POST /api/large-code-plan'
];

function assertPublicRuntimeContract(body) {
  assert.equal(typeof body.logging.level, 'string');
  assert.equal(body.logging.format, 'json-lines');
  assert.equal(body.logging.redaction, 'sensitive-fields');
  assert.equal(typeof body.rateLimit.enabled, 'boolean');
  assert.equal(typeof body.rateLimit.windowMs, 'number');
  assert.equal(typeof body.rateLimit.maxRequests, 'number');
  assert.equal(typeof body.rateLimit.maxClients, 'number');
  assert.equal(typeof body.rateLimit.trackedClients, 'number');
  assert.equal(typeof body.rateLimit.trustProxy, 'boolean');
  assert.deepEqual(body.rateLimit.appliedToRoutes, [
    'POST /api/generate',
    'POST /api/generate-stream',
    'POST /api/read-file',
    'POST /api/large-code-plan'
  ]);
  assert.equal(typeof body.ollama.configured, 'boolean');
  assert.equal(body.ollama.endpoint, 'redacted');
  assert.equal(Object.hasOwn(body, 'ollamaUrl'), false);
  assert.equal(Object.hasOwn(body.fileRead, 'projectRoot'), false);
  assert.equal(body.largeGeneration.mode, 'chunked-large-code-generation');
  assert.equal(body.largeGeneration.endpoint, 'POST /api/large-code-plan');
  assert.equal(typeof body.largeGeneration.maxLargePlanFiles, 'number');
  assert.equal(typeof body.largeGeneration.maxLargePlanSteps, 'number');
  assert.equal(typeof body.largeGeneration.maxFilesPerContextBatch, 'number');
}

function assertLargeCodeSuggestion(body) {
  assert.match(body.error, /tarefa parece grande/i);
  assert.equal(body.largeCodeSuggestion.recommendedEndpoint, 'POST /api/large-code-plan');
  assert.equal(body.largeCodeSuggestion.suggestedRequest.endpoint, 'POST /api/large-code-plan');
  assert.equal(body.largeCodeSuggestion.suggestedRequest.body.language, 'Node.js');
  assert.ok(body.largeCodeSuggestion.reasons.includes('large-task-keyword'));
  assert.equal(typeof body.requestId, 'string');
}

test('buildCodingPrompt inclui foco, contexto e tarefa sem depender do Ollama', () => {
  const prompt = buildCodingPrompt({
    task: 'Criar endpoint de health check',
    language: 'Node.js',
    context: 'Projeto usa HTTP nativo.'
  });

  assert.match(prompt, /Node\.js/);
  assert.match(prompt, /Projeto usa HTTP nativo/);
  assert.match(prompt, /Criar endpoint de health check/);
  assert.match(prompt, /(?:Não|Evite) invent[ae]r arquivos/);
});

test('createGenerationQueue limita fila cheia com HTTP 429', async () => {
  const queue = createGenerationQueue({
    maxQueueSize: 1,
    generationConcurrency: 1
  });

  let releaseFirstJob;
  const firstJob = queue.run(() => new Promise(resolve => {
    releaseFirstJob = () => resolve('ok');
  }));

  const secondJob = queue.run(() => Promise.resolve('queued'));
  await assert.rejects(
    () => queue.run(() => Promise.resolve('overflow')),
    error => error.statusCode === 429
  );

  releaseFirstJob();
  assert.equal(await firstJob, 'ok');
  assert.equal(await secondJob, 'queued');
  assert.equal(queue.getStatus().completedGenerations, 2);
});

test('createGenerationQueue respeita concorrência um em PC fraco', async () => {
  const queue = createGenerationQueue({
    maxQueueSize: 4,
    generationConcurrency: 1
  });

  const order = [];
  const first = queue.run(async () => {
    order.push('first-start');
    await new Promise(resolve => setTimeout(resolve, 10));
    order.push('first-end');
  });

  const second = queue.run(async () => {
    order.push('second-start');
    order.push('second-end');
  });

  await Promise.all([first, second]);

  assert.deepEqual(order, ['first-start', 'first-end', 'second-start', 'second-end']);
});

test('createPromptCache reutiliza resposta por hash e limita entradas', () => {
  const cache = createPromptCache({ enabled: true, maxEntries: 1 });

  assert.equal(cache.get('prompt A'), null);
  const firstKey = cache.set('prompt A', { response: 'resposta A', done: true });
  const cachedA = cache.get('prompt A');

  assert.equal(typeof firstKey, 'string');
  assert.equal(cachedA.key, firstKey);
  assert.deepEqual(cachedA.value, { response: 'resposta A', done: true });

  cache.set('prompt B', { response: 'resposta B', done: true });
  assert.equal(cache.get('prompt A'), null);
  assert.equal(cache.getStatus().entries, 1);
  assert.equal(cache.getStatus().evictions, 1);
});

test('validateSafeProjectFilePath permite arquivo relativo com extensão aprovada', () => {
  const projectRoot = join(tmpdir(), 'projeto-teste');
  const result = validateSafeProjectFilePath({
    requestedPath: 'src/index.js',
    projectRoot,
    allowedFileExtensions: ['.js']
  });

  assert.equal(toPosixPath(result.relativePath), 'src/index.js');
});

test('validateSafeProjectFilePath bloqueia travessia, dependências e .env', () => {
  const projectRoot = join(tmpdir(), 'projeto-teste');

  assert.throws(
    () => validateSafeProjectFilePath({ requestedPath: '../segredo.md', projectRoot }),
    error => error.statusCode === 403
  );

  assert.throws(
    () => validateSafeProjectFilePath({ requestedPath: 'node_modules/lib/index.js', projectRoot }),
    error => error.statusCode === 403
  );

  assert.throws(
    () => validateSafeProjectFilePath({ requestedPath: '.env', projectRoot }),
    error => error.statusCode === 403
  );
});

test('readProjectFile lê arquivo pequeno e bloqueia arquivo acima do limite', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'teste-local-code-llm-'));

  try {
    await writeFile(join(projectRoot, 'sample.md'), '# Exemplo\nConteúdo seguro.\n', 'utf8');
    await writeFile(join(projectRoot, 'large.md'), 'x'.repeat(32), 'utf8');

    const result = await readProjectFile({
      path: 'sample.md',
      projectRoot,
      maxBytes: 1024,
      allowedFileExtensions: ['.md']
    });

    assert.equal(result.path, 'sample.md');
    assert.match(result.content, /Conteúdo seguro/);
    assert.equal(result.maxFileReadBytes, 1024);

    await assert.rejects(
      () => readProjectFile({
        path: 'large.md',
        projectRoot,
        maxBytes: 16,
        allowedFileExtensions: ['.md']
      }),
      error => error.statusCode === 413
    );
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});

test('GET /health responde estado local sanitizado sem chamar Ollama', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'teste-local-code-llm-backend');
    assert.equal(typeof body.model, 'string');
    assert.equal(typeof body.queue.activeGenerations, 'number');
    assert.equal(typeof body.cache.entries, 'number');
    assert.equal(typeof body.fileRead.maxFileReadBytes, 'number');
    assertPublicRuntimeContract(body);
    assert.deepEqual(body.routes, EXPECTED_ROUTES);
  });
});

test('GET /api/status responde métricas sanitizadas da fila sem chamar Ollama', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/status`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.service, 'teste-local-code-llm-backend');
    assert.equal(typeof body.queue.queuedGenerations, 'number');
    assert.equal(typeof body.queue.completedGenerations, 'number');
    assert.equal(typeof body.cache.hits, 'number');
    assert.ok(Array.isArray(body.fileRead.allowedFileExtensions));
    assertPublicRuntimeContract(body);
    assert.deepEqual(body.routes, EXPECTED_ROUTES);
  });
});

test('POST /api/generate rejeita Content-Type não JSON antes de ler corpo', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'task=Gerar código'
    });
    const body = await response.json();

    assert.equal(response.status, 415);
    assert.match(body.error, /Content-Type precisa ser application\/json/);
    assert.equal(body.expectedContentType, 'application/json');
    assert.equal(typeof body.requestId, 'string');
  });
});

test('POST /api/generate aceita Content-Type JSON com charset', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ language: 'Node.js' })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /task precisa ser texto/);
    assert.equal(typeof body.requestId, 'string');
  });
});

test('POST /api/generate valida task antes de chamar Ollama', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ language: 'Node.js' })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /task precisa ser texto/);
    assert.equal(typeof body.requestId, 'string');
  });
});

test('POST /api/generate sugere large-code-plan para tarefa grande', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        language: 'Node.js',
        task: 'Criar CRUD completo de clientes com rotas, service, repository e testes',
        contextFiles: ['src/server.js', 'src/config.js', 'src/http.js', 'src/logger.js'],
        targetFiles: ['src/modules/customers/routes.js']
      })
    });
    const body = await response.json();

    assert.equal(response.status, 422);
    assertLargeCodeSuggestion(body);
  });
});

test('POST /api/generate-stream sugere large-code-plan antes de abrir SSE para tarefa grande', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/generate-stream`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        language: 'Node.js',
        task: 'Criar CRUD completo de clientes com rotas, service, repository e testes',
        contextFiles: ['src/server.js', 'src/config.js', 'src/http.js', 'src/logger.js'],
        targetFiles: ['src/modules/customers/routes.js']
      })
    });
    const body = await response.json();

    assert.equal(response.status, 422);
    assert.equal(response.headers.get('content-type').startsWith('application/json'), true);
    assertLargeCodeSuggestion(body);
  });
});

test('POST /api/generate-stream valida task antes de abrir SSE', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/generate-stream`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ language: 'Dart' })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /task precisa ser texto/);
    assert.equal(typeof body.requestId, 'string');
  });
});

test('POST /api/read-file valida path antes de ler arquivo', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/read-file`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: '../package.json' })
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.match(body.error, /fora da pasta do projeto/);
    assert.equal(typeof body.requestId, 'string');
  });
});

test('POST /api/large-code-plan cria plano de geração grande sem chamar Ollama', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/large-code-plan`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        language: 'Node.js',
        task: 'Criar CRUD grande de clientes em várias partes',
        contextFiles: ['src/server.js', 'src/config.js', 'src/http.js'],
        targetFiles: ['src/modules/customers/routes.js', 'src/modules/customers/service.js'],
        maxFilesPerStep: 2,
        maxSteps: 8
      })
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.mode, 'chunked-large-code-generation');
    assert.equal(body.language, 'Node.js');
    assert.equal(body.totals.contextFiles, 3);
    assert.equal(body.totals.targetFiles, 2);
    assert.ok(body.steps.length >= 3);
    assert.equal(body.steps[0].type, 'architecture-plan');
    assert.equal(body.steps.at(-1).type, 'integration-review');
    assert.equal(typeof body.requestId, 'string');
  });
});

test('POST /api/large-code-plan valida task obrigatória', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/large-code-plan`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ language: 'Node.js' })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /task precisa ser texto/);
    assert.equal(typeof body.requestId, 'string');
  });
});

test('rota conhecida com método errado responde 405 e header Allow', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/generate`);
    const body = await response.json();

    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'POST');
    assert.match(body.error, /Método não permitido/);
    assert.deepEqual(body.allowedMethods, ['POST']);
    assert.deepEqual(body.routes, EXPECTED_ROUTES);
  });
});

test('rota desconhecida responde 404 com rotas disponíveis', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/desconhecida`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.match(body.error, /Rota não encontrada/);
    assert.deepEqual(body.routes, EXPECTED_ROUTES);
  });
});
