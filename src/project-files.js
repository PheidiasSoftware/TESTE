import { readFile, stat } from 'node:fs/promises';
import { basename, extname, isAbsolute, relative, resolve } from 'node:path';

export function validateSafeProjectFilePath({ requestedPath, projectRoot, allowedFileExtensions = [] } = {}) {
  if (!requestedPath || typeof requestedPath !== 'string') {
    throw Object.assign(new Error('Campo obrigatório: path precisa ser texto.'), { statusCode: 400 });
  }

  if (requestedPath.includes('\0')) {
    throw Object.assign(new Error('Caminho inválido.'), { statusCode: 400 });
  }

  if (isAbsolute(requestedPath)) {
    throw Object.assign(new Error('Use caminho relativo ao projeto, não caminho absoluto.'), { statusCode: 400 });
  }

  const safeRoot = resolve(projectRoot || process.cwd());
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

  return { absolutePath: safePath, relativePath };
}

export function truncateUtf8ToBytes(value, maxBytes) {
  const text = String(value ?? '');
  const limit = Number(maxBytes);

  if (!Number.isSafeInteger(limit) || limit <= 0) return '';

  const buffer = Buffer.from(text, 'utf8');
  if (buffer.length <= limit) return text;

  let end = limit;
  while (end > 0 && (buffer[end] & 0b11000000) === 0b10000000) {
    end -= 1;
  }

  const firstByte = buffer[end];
  const sequenceLength = firstByte >= 0b11110000
    ? 4
    : firstByte >= 0b11100000
      ? 3
      : firstByte >= 0b11000000
        ? 2
        : 1;

  if (end + sequenceLength > limit) {
    return buffer.subarray(0, end).toString('utf8');
  }

  return buffer.subarray(0, limit).toString('utf8');
}

export async function readProjectFile({ path, projectRoot, maxBytes, allowedFileExtensions = [] } = {}) {
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

  return {
    path: safeFile.relativePath,
    sizeBytes: fileStat.size,
    maxFileReadBytes: maxBytes,
    content: await readFile(safeFile.absolutePath, 'utf8')
  };
}

export async function buildContextFromFiles({
  context = '',
  contextFiles = [],
  projectRoot,
  maxFiles,
  maxContextBytes,
  maxFileReadBytes,
  allowedFileExtensions = []
} = {}) {
  if (contextFiles === undefined || contextFiles === null || contextFiles.length === 0) {
    const safeContext = typeof context === 'string' ? truncateUtf8ToBytes(context, maxContextBytes) : '';
    return {
      context: safeContext,
      files: [],
      totalBytes: Buffer.byteLength(safeContext, 'utf8'),
      truncated: Buffer.byteLength(String(context || ''), 'utf8') > Buffer.byteLength(safeContext, 'utf8')
    };
  }

  if (!Array.isArray(contextFiles)) {
    throw Object.assign(new Error('contextFiles precisa ser uma lista de caminhos relativos.'), { statusCode: 400 });
  }

  if (contextFiles.length > maxFiles) {
    throw Object.assign(new Error(`contextFiles aceita no máximo ${maxFiles} arquivo(s).`), { statusCode: 400 });
  }

  const safeContext = typeof context === 'string' ? truncateUtf8ToBytes(context, maxContextBytes) : '';
  const parts = safeContext ? [safeContext] : [];
  const files = [];
  let totalBytes = Buffer.byteLength(parts.join('\n'), 'utf8');
  let truncated = typeof context === 'string' && Buffer.byteLength(context, 'utf8') > Buffer.byteLength(safeContext, 'utf8');

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

    const fileContent = truncateUtf8ToBytes(file.content, availableBytes);
    if (Buffer.byteLength(file.content, 'utf8') > Buffer.byteLength(fileContent, 'utf8')) {
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

  return { context: parts.join('\n'), files, totalBytes, truncated };
}
