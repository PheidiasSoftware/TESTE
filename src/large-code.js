const DEFAULT_MAX_FILES = 50;
const DEFAULT_MAX_STEPS = 20;
const DEFAULT_FILES_PER_STEP = 4;
const DEFAULT_SIMPLE_CONTEXT_FILES = 3;
const DEFAULT_SIMPLE_TASK_CHARS = 800;

const LARGE_TASK_PATTERNS = [
  /\bcrud\b/i,
  /sistema\s+completo/i,
  /app\s+completo/i,
  /aplica[cç][aã]o\s+completa/i,
  /projeto\s+completo/i,
  /backend\s+completo/i,
  /frontend\s+completo/i,
  /m[óo]dulo\s+completo/i,
  /v[áa]rios?\s+arquivos/i,
  /muitos?\s+arquivos/i,
  /contexto\s+gigante/i,
  /grande\s+quantidade/i,
  /gerar\s+muito\s+c[óo]digo/i,
  /rotas?.*service.*test/i,
  /service.*repository.*test/i
];

const STRONG_LARGE_TASK_PATTERNS = [
  /crud\s+completo/i,
  /sistema\s+completo/i,
  /projeto\s+completo/i,
  /app\s+completo/i,
  /backend\s+completo/i,
  /frontend\s+completo/i,
  /contexto\s+gigante/i,
  /grande\s+quantidade\s+de\s+c[óo]digo/i
];

function createHttpError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

export function clampSafeInteger(value, { fallback, minimum, maximum }) {
  const normalized = value === undefined || value === null || value === '' ? fallback : Number(value);
  const parsed = Number.isSafeInteger(normalized) ? normalized : fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

export function normalizeLargeCodeText(value, { fieldName = 'campo', maxChars = 8000, required = false } = {}) {
  const normalized = typeof value === 'string'
    ? value
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .trim()
    : '';

  if (required && !normalized) {
    throw createHttpError(`Campo obrigatório: ${fieldName} precisa ser texto não vazio.`, 400);
  }

  return normalized.slice(0, maxChars);
}

export function normalizeStringList(value, {
  fieldName,
  maxItems = DEFAULT_MAX_FILES,
  maxItemChars = 500
} = {}) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw createHttpError(`${fieldName} precisa ser uma lista de textos.`, 400);
  }

  if (value.length > maxItems) {
    throw createHttpError(`${fieldName} aceita no máximo ${maxItems} item(ns).`, 400);
  }

  return value.map((item, index) => {
    const normalized = normalizeLargeCodeText(item, {
      fieldName: `${fieldName}[${index}]`,
      maxChars: maxItemChars,
      required: true
    });
    return normalized;
  });
}

export function normalizeSuggestionStringList(value, {
  maxItems = DEFAULT_MAX_FILES,
  maxItemChars = 500
} = {}) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, maxItems)
    .map(item => normalizeLargeCodeText(item, { maxChars: maxItemChars }))
    .filter(Boolean);
}

export function chunkList(items, size) {
  const safeSize = clampSafeInteger(size, { fallback: DEFAULT_FILES_PER_STEP, minimum: 1, maximum: 50 });
  const chunks = [];

  for (let index = 0; index < items.length; index += safeSize) {
    chunks.push(items.slice(index, index + safeSize));
  }

  return chunks;
}

export function assessLargeCodeRequest({
  task,
  contextFiles,
  targetFiles,
  contextTruncated = false,
  maxSimpleContextFiles = DEFAULT_SIMPLE_CONTEXT_FILES,
  maxSimpleTaskChars = DEFAULT_SIMPLE_TASK_CHARS
} = {}) {
  const safeTask = normalizeLargeCodeText(task, { fieldName: 'task', maxChars: 12000 });
  const contextFileCount = Array.isArray(contextFiles) ? contextFiles.length : 0;
  const targetFileCount = Array.isArray(targetFiles) ? targetFiles.length : 0;
  const reasons = [];

  if (safeTask.length > maxSimpleTaskChars) reasons.push('task-long');
  if (contextFileCount > maxSimpleContextFiles) reasons.push('many-context-files');
  if (targetFileCount > 0) reasons.push('target-files-present');
  if (contextTruncated) reasons.push('context-truncated');

  const hasLargeKeyword = LARGE_TASK_PATTERNS.some(pattern => pattern.test(safeTask));
  const hasStrongLargeKeyword = STRONG_LARGE_TASK_PATTERNS.some(pattern => pattern.test(safeTask));

  if (hasStrongLargeKeyword || (hasLargeKeyword && (safeTask.length > 120 || contextFileCount > 0 || targetFileCount > 0))) {
    reasons.push('large-task-keyword');
  }

  const uniqueReasons = Array.from(new Set(reasons));

  return {
    isLarge: uniqueReasons.length > 0,
    reasons: uniqueReasons,
    recommendedEndpoint: 'POST /api/large-code-plan',
    message: 'Esta tarefa parece grande para uma geração única. Use /api/large-code-plan para dividir em etapas e depois gere cada etapa com /api/generate-stream.',
    detection: {
      taskChars: safeTask.length,
      contextFiles: contextFileCount,
      targetFiles: targetFileCount,
      contextTruncated: Boolean(contextTruncated),
      maxSimpleContextFiles,
      maxSimpleTaskChars
    }
  };
}

function makeStep({ id, type, title, goal, language, task, contextFiles = [], targetFile = null, previousStepMemory = '' }) {
  const memoryHint = previousStepMemory
    ? `\n\nMemória/resumo das etapas anteriores:\n${previousStepMemory}`
    : '';
  const contextHint = contextFiles.length
    ? `\n\nUse estes arquivos como contexto nesta etapa: ${contextFiles.join(', ')}`
    : '\n\nNão há arquivos de contexto específicos nesta etapa.';
  const targetHint = targetFile
    ? `\n\nArquivo alvo desta etapa: ${targetFile}`
    : '';

  return {
    id,
    type,
    title,
    goal,
    language,
    contextFiles,
    targetFile,
    task: [
      `Projeto grande em modo incremental. Etapa ${id}: ${title}.`,
      `Objetivo geral: ${task}`,
      `Objetivo desta etapa: ${goal}`,
      `Foco técnico: ${language}`,
      'Gere apenas a parte desta etapa. Não tente entregar o projeto inteiro em uma única resposta.',
      'Quando gerar código, separe por arquivo com cabeçalho claro e explique dependências entre arquivos.',
      'Prefira código simples, incremental, testável e adequado a PC fraco com 8 GB de RAM sem GPU.',
      'Não execute comandos destrutivos e não invente contexto que não foi informado.',
      contextHint,
      targetHint,
      memoryHint
    ].filter(Boolean).join('\n')
  };
}

export function buildLargeCodePlan({
  task,
  language = 'general',
  contextFiles,
  targetFiles,
  previousStepMemory,
  maxFiles = DEFAULT_MAX_FILES,
  maxSteps = DEFAULT_MAX_STEPS,
  maxFilesPerStep = DEFAULT_FILES_PER_STEP
} = {}) {
  const safeMaxFiles = clampSafeInteger(maxFiles, { fallback: DEFAULT_MAX_FILES, minimum: 0, maximum: 200 });
  const safeMaxSteps = clampSafeInteger(maxSteps, { fallback: DEFAULT_MAX_STEPS, minimum: 2, maximum: 80 });
  const safeFilesPerStep = clampSafeInteger(maxFilesPerStep, { fallback: DEFAULT_FILES_PER_STEP, minimum: 1, maximum: 12 });
  const safeTask = normalizeLargeCodeText(task, { fieldName: 'task', maxChars: 12000, required: true });
  const safeLanguage = normalizeLargeCodeText(language, { fieldName: 'language', maxChars: 80 }) || 'general';
  const safePreviousMemory = normalizeLargeCodeText(previousStepMemory, { fieldName: 'previousStepMemory', maxChars: 12000 });
  const safeContextFiles = normalizeStringList(contextFiles, { fieldName: 'contextFiles', maxItems: safeMaxFiles });
  const safeTargetFiles = normalizeStringList(targetFiles, { fieldName: 'targetFiles', maxItems: safeMaxFiles });
  const contextBatches = chunkList(safeContextFiles, safeFilesPerStep);
  const steps = [];

  function addStep(step) {
    if (steps.length < safeMaxSteps) steps.push(step);
  }

  addStep(makeStep({
    id: 1,
    type: 'architecture-plan',
    title: 'Planejar arquitetura e dividir entrega',
    goal: 'Criar mapa dos arquivos, responsabilidades, ordem de implementação e riscos antes de gerar muito código.',
    language: safeLanguage,
    task: safeTask,
    contextFiles: contextBatches[0] || [],
    previousStepMemory: safePreviousMemory
  }));

  if (safeTargetFiles.length > 0) {
    for (const targetFile of safeTargetFiles) {
      addStep(makeStep({
        id: steps.length + 1,
        type: 'file-generation',
        title: `Gerar ou alterar ${targetFile}`,
        goal: `Gerar somente o código necessário para ${targetFile}, mantendo compatibilidade com as etapas anteriores.`,
        language: safeLanguage,
        task: safeTask,
        contextFiles: contextBatches[(steps.length - 1) % Math.max(1, contextBatches.length)] || [],
        targetFile,
        previousStepMemory: safePreviousMemory
      }));
    }
  } else if (contextBatches.length > 0) {
    for (const batch of contextBatches) {
      addStep(makeStep({
        id: steps.length + 1,
        type: 'context-batch-generation',
        title: `Gerar código usando lote de contexto ${steps.length}`,
        goal: 'Usar somente este lote de contexto para propor uma parte pequena e coerente da implementação.',
        language: safeLanguage,
        task: safeTask,
        contextFiles: batch,
        previousStepMemory: safePreviousMemory
      }));
    }
  } else {
    for (const title of ['Gerar núcleo da implementação', 'Gerar testes básicos', 'Gerar documentação de uso']) {
      addStep(makeStep({
        id: steps.length + 1,
        type: 'generic-generation',
        title,
        goal: `${title} em uma parte isolada e revisável.`,
        language: safeLanguage,
        task: safeTask,
        previousStepMemory: safePreviousMemory
      }));
    }
  }

  addStep(makeStep({
    id: steps.length + 1,
    type: 'integration-review',
    title: 'Revisar integração final',
    goal: 'Conferir nomes de arquivos, imports, contratos, testes, riscos e próximos passos sem gerar tudo novamente.',
    language: safeLanguage,
    task: safeTask,
    contextFiles: contextBatches.at(-1) || [],
    previousStepMemory: safePreviousMemory
  }));

  return {
    mode: 'chunked-large-code-generation',
    strategy: 'divide o projeto em etapas pequenas para simular contexto gigante sem estourar memória do PC fraco',
    language: safeLanguage,
    task: safeTask,
    limits: {
      maxFiles: safeMaxFiles,
      maxSteps: safeMaxSteps,
      maxFilesPerStep: safeFilesPerStep
    },
    totals: {
      contextFiles: safeContextFiles.length,
      targetFiles: safeTargetFiles.length,
      contextBatches: contextBatches.length,
      steps: steps.length,
      truncatedByStepLimit: steps.length >= safeMaxSteps && (safeTargetFiles.length + contextBatches.length + 2) > safeMaxSteps
    },
    steps,
    clientFlow: [
      'Chame /api/large-code-plan com a tarefa grande, contextFiles e targetFiles.',
      'Para cada item de steps, chame /api/generate-stream usando step.task, step.contextFiles e language.',
      'Salve o resumo da resposta anterior em previousStepMemory para manter continuidade.',
      'Gere um arquivo ou grupo pequeno por vez; não tente gerar o projeto inteiro em uma resposta.'
    ]
  };
}
