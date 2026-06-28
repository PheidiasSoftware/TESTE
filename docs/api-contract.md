# Contrato da API local

Contrato HTTP estável para clientes locais que integrem com o backend `TESTE Local Code LLM Backend`.

Este documento descreve apenas a API textual local. O backend não executa código gerado pelo modelo, não expõe a API publicamente por padrão e assume uso em PC fraco com Windows, 8 GB de RAM e sem GPU.

## Base URL

```text
http://127.0.0.1:3131
```

A porta e host podem mudar via `HOST` e `PORT`.

## Padrões gerais

- Todas as respostas JSON usam `content-type: application/json; charset=utf-8`.
- Respostas JSON usam `cache-control: no-store`.
- Rotas de streaming usam Server-Sent Events com `content-type: text/event-stream; charset=utf-8`.
- Rotas pesadas podem retornar `HTTP 429` quando o rate limit local é atingido.
- Erros retornam pelo menos o campo `error`.
- Quando disponível, respostas incluem `requestId` para correlação com logs locais.
- Prompts, contexto, conteúdo de arquivos e resposta gerada não devem ser gravados nos logs estruturados.

## `GET /health`

Diagnóstico simples do backend local.

### Request

```bash
curl http://127.0.0.1:3131/health
```

### Response `200`

```json
{
  "status": "ok",
  "service": "teste-local-code-llm-backend",
  "model": "qwen2.5-coder:1.5b-instruct",
  "ollamaUrl": "http://127.0.0.1:11434",
  "queue": {
    "activeGenerations": 0,
    "queuedGenerations": 0,
    "maxQueueSize": 4,
    "generationConcurrency": 1,
    "completedGenerations": 0,
    "failedGenerations": 0
  },
  "cache": {
    "enabled": true,
    "maxEntries": 20,
    "entries": 0,
    "hits": 0,
    "misses": 0,
    "writes": 0,
    "evictions": 0
  },
  "routes": [
    "GET /health",
    "GET /api/status",
    "POST /api/generate",
    "POST /api/generate-stream",
    "POST /api/read-file"
  ]
}
```

Campos extras de `fileRead`, `logging` e `rateLimit` podem aparecer e devem ser tratados como diagnóstico.

## `GET /api/status`

Retorna métricas operacionais locais. Use para tela de status, suporte técnico ou verificação antes de gerar respostas.

### Request

```bash
curl http://127.0.0.1:3131/api/status
```

### Response `200`

O formato é semelhante ao `/health`, mas focado em métricas de fila, cache, leitura segura, logs e rate limit.

Clientes devem tratar novos campos como compatíveis para frente.

## `POST /api/generate`

Gera uma resposta textual de programação usando o modelo local via Ollama.

### Request JSON

```json
{
  "task": "Crie uma função JS para validar email sem dependências externas.",
  "language": "Node.js",
  "context": "Opcional: trecho pequeno do projeto.",
  "contextFiles": ["src/server.js"]
}
```

### Campos

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| `task` | string | sim | Tarefa de programação. O servidor limita tamanho antes de montar o prompt. |
| `language` | string | não | Foco técnico, como `Node.js`, `Flutter`, `Dart` ou `MySQL`. |
| `context` | string | não | Contexto textual curto informado pelo cliente. |
| `contextFiles` | string[] | não | Caminhos relativos para arquivos textuais pequenos dentro do projeto. |

### Response `200`

```json
{
  "requestId": "uuid",
  "model": "qwen2.5-coder:1.5b-instruct",
  "durationMs": 1532,
  "queueWaitMs": 0,
  "cached": false,
  "cacheKey": "sha256",
  "contextFiles": [
    {
      "path": "src/server.js",
      "sizeBytes": 12000,
      "includedBytes": 12000
    }
  ],
  "contextTruncated": false,
  "response": "texto gerado pelo modelo",
  "done": true,
  "queue": {},
  "cache": {},
  "rateLimit": {}
}
```

### Erros comuns

| Status | Quando ocorre |
| --- | --- |
| `400` | JSON inválido, `task` ausente, `contextFiles` inválido ou caminho malformado. |
| `403` | Tentativa de ler caminho fora do projeto ou pasta bloqueada. |
| `413` | Payload ou arquivo acima do limite configurado. |
| `415` | Extensão de arquivo não permitida. |
| `429` | Rate limit ou fila de geração cheia. |
| `502` | Falha ao chamar o runtime local Ollama. |
| `504` | Timeout chamando o modelo local. |

## `POST /api/generate-stream`

Gera uma resposta textual via Server-Sent Events. Recomendado para clientes que querem exibir tokens progressivamente.

### Request JSON

Mesmo corpo de `/api/generate`.

### Eventos SSE

#### `metadata`

Primeiro evento, enviado antes dos tokens.

```text
event: metadata
data: {"requestId":"uuid","model":"qwen2.5-coder:1.5b-instruct","cached":false}
```

#### `token`

Pode ser emitido várias vezes.

```text
event: token
data: {"requestId":"uuid","token":"texto parcial"}
```

#### `done`

Finalização bem-sucedida.

```text
event: done
data: {"requestId":"uuid","durationMs":1532,"cached":false,"done":true}
```

#### `error`

Erro ocorrido após abertura do stream.

```text
event: error
data: {"requestId":"uuid","error":"Falha ao chamar Ollama em streaming."}
```

Clientes devem encerrar a leitura ao receber `done` ou `error`.

## `POST /api/read-file`

Lê um arquivo textual pequeno dentro da raiz do projeto para uso como contexto. Não executa o arquivo.

### Request JSON

```json
{
  "path": "src/server.js"
}
```

### Response `200`

```json
{
  "requestId": "uuid",
  "path": "src/server.js",
  "sizeBytes": 12000,
  "maxFileReadBytes": 32768,
  "content": "conteúdo textual do arquivo",
  "rateLimit": {}
}
```

### Proteções

- Aceita apenas caminho relativo.
- Bloqueia travessia de diretórios como `../`.
- Bloqueia `.git`, `node_modules`, `dist`, `build`, `.next` e `.cache`.
- Bloqueia `.env` e `.env.*`.
- Aceita apenas extensões textuais permitidas.
- Bloqueia arquivos acima de `MAX_FILE_READ_BYTES`.

## Exemplo mínimo em Node.js

```js
const response = await fetch('http://127.0.0.1:3131/api/generate', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    task: 'Explique como melhorar este endpoint.',
    language: 'Node.js',
    contextFiles: ['src/server.js']
  })
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.error || 'Falha na API local');
}

console.log(data.response);
```

## Compatibilidade para clientes

Clientes locais devem:

- preferir `POST /api/generate-stream` para respostas longas;
- manter timeouts próprios maiores que o tempo esperado em CPU fraca;
- tratar `429` com espera usando `Retry-After` quando existir;
- não assumir que `response.done` sempre será `true` se o runtime local interromper a geração;
- nunca enviar segredos no `context` ou em arquivos de contexto;
- manter a API acessível apenas localmente, salvo decisão explícita e segura do usuário.
