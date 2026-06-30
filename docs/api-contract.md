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
- Respostas JSON e SSE incluem headers leves de segurança: `x-content-type-options: nosniff` e `referrer-policy: no-referrer`.
- Todas as rotas `POST` aceitam apenas corpo JSON com `Content-Type: application/json` ou media type compatível `+json`.
- Rotas conhecidas chamadas com método HTTP incorreto retornam `HTTP 405` com header `Allow` e campo `allowedMethods`.
- Requisições `POST` encerradas pelo cliente antes do corpo completo são classificadas internamente como `499 CLIENT_CLOSED_REQUEST` para logs e tratamento previsível. Dependendo do encerramento da conexão, o cliente pode não receber corpo de resposta.
- Rotas pesadas podem retornar `HTTP 429` quando o rate limit local é atingido.
- Erros retornam pelo menos o campo `error`.
- Quando disponível, respostas incluem `requestId` para correlação com logs locais.
- Prompts, contexto, conteúdo de arquivos, resposta gerada, URL real do runtime local e caminho absoluto do projeto não devem ser gravados nos logs estruturados.
- Endpoints públicos de status não expõem caminho absoluto do projeto nem URL real do Ollama.

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
  "ollama": {
    "configured": true,
    "endpoint": "redacted"
  },
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
  "fileRead": {
    "maxFileReadBytes": 32768,
    "maxContextFiles": 4,
    "maxContextBytes": 12000,
    "allowedFileExtensions": [".css", ".dart", ".html", ".js", ".json", ".md", ".ps1", ".sql", ".ts", ".txt", ".yaml", ".yml"]
  },
  "logging": {
    "level": "info",
    "format": "json-lines",
    "redaction": "sensitive-fields"
  },
  "rateLimit": {
    "enabled": true,
    "windowMs": 60000,
    "maxRequests": 30,
    "maxClients": 500,
    "trackedClients": 0,
    "trustProxy": false,
    "appliedToRoutes": [
      "POST /api/generate",
      "POST /api/generate-stream",
      "POST /api/read-file"
    ]
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

Campos de diagnóstico podem crescer de forma compatível. Clientes não devem depender de `ollamaUrl` nem de `fileRead.projectRoot`, pois esses detalhes locais são omitidos intencionalmente.

## `GET /api/status`

Retorna métricas operacionais locais. Use para tela de status, suporte técnico ou verificação antes de gerar respostas.

### Request

```bash
curl http://127.0.0.1:3131/api/status
```

### Response `200`

O formato é semelhante ao `/health`, mas focado em métricas de fila, cache, leitura segura, logs e rate limit. A resposta também usa `ollama.configured` e `ollama.endpoint="redacted"` em vez de expor a URL real do runtime.

Clientes devem tratar novos campos como compatíveis para frente.

## `POST /api/generate`

Gera uma resposta textual de programação usando o modelo local via Ollama.

### Request JSON

Envie `Content-Type: application/json`.

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
| `task` | string | sim | Tarefa de programação. O servidor exige texto não vazio após `trim()` e limita tamanho antes de montar o prompt. |
| `language` | string | não | Foco técnico, como `Node.js`, `Flutter`, `Dart` ou `MySQL`. O servidor remove quebras de linha/caracteres de controle, compacta espaços, limita a 80 caracteres e usa `general` quando vazio. |
| `context` | string | não | Contexto textual curto informado pelo cliente. O servidor normaliza quebras CRLF para LF, remove caracteres de controle não textuais, limita por `MAX_CONTEXT_BYTES` sem quebrar UTF-8 e ignora valores não textuais. |
| `contextFiles` | string[] | não | Lista de caminhos relativos para arquivos textuais pequenos dentro do projeto. Uma string solta é inválida; envie sempre um array. |

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
| `400` | JSON inválido, `task` ausente/vazia, `contextFiles` não-array, item de `contextFiles` não-textual ou caminho malformado. |
| `403` | Tentativa de ler caminho fora do projeto ou pasta bloqueada. |
| `405` | Rota conhecida chamada com método HTTP incorreto; a resposta inclui `Allow` e `allowedMethods`. |
| `413` | Payload ou arquivo acima do limite configurado. |
| `415` | `Content-Type` não JSON ou extensão de arquivo não permitida. |
| `429` | Rate limit ou fila de geração cheia. |
| `499` | Cliente encerrou a conexão antes do corpo completo ser lido; normalmente aparece em logs locais e pode não chegar ao cliente. |
| `502` | Falha ao chamar o runtime local Ollama. |
| `504` | Timeout chamando o modelo local. |

## `POST /api/generate-stream`

Gera uma resposta textual via Server-Sent Events. Recomendado para clientes que querem exibir tokens progressivamente.

### Request JSON

Mesmo corpo de `/api/generate`, com `Content-Type: application/json`. A normalização de `task`, `language`, `context` e `contextFiles` é a mesma do endpoint sem streaming.

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
