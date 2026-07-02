# Streaming de geração local

Este documento registra o endpoint de streaming do backend local para programação.

## Endpoint

```text
POST /api/generate-stream
```

A rota usa Server-Sent Events (SSE) para enviar partes da resposta conforme o Ollama retorna tokens. Ela mantém o endpoint `POST /api/generate` intacto para clientes que preferem resposta JSON completa.

## Objetivo

- Melhorar a experiência em respostas longas sem exigir frontend pesado.
- Manter consumo baixo para Windows com 8 GB de RAM e sem GPU.
- Reutilizar fila, cache, prompt técnico e leitura segura de arquivos já existentes.
- Evitar execução automática de código gerado pelo modelo.

## Entrada

Aceita o mesmo corpo JSON básico de `POST /api/generate`:

```json
{
  "task": "Explique este erro Node.js e sugira correção",
  "language": "Node.js",
  "context": "Trecho opcional de contexto",
  "contextFiles": ["src/server.js"]
}
```

Validações importantes:

- `task` é obrigatório e precisa ser texto.
- `contextFiles` usa as mesmas proteções de leitura segura já existentes.
- Caminhos absolutos, travessia, `.env`, `.git`, `node_modules` e artefatos gerados continuam bloqueados.

## Eventos SSE

A resposta abre `text/event-stream` e pode emitir:

### `metadata`

Emitido no início do stream.

```text
event: metadata
data: {"requestId":"...","model":"qwen2.5-coder:1.5b-instruct","cached":false}
```

### `token`

Emitido para cada pedaço textual recebido do Ollama.

```text
event: token
data: {"requestId":"...","token":"texto parcial"}
```

### `done`

Emitido no encerramento bem-sucedido.

```text
event: done
data: {"requestId":"...","done":true,"cached":false}
```

### `error`

Emitido quando há falha depois que o stream já foi aberto.

```text
event: error
data: {"requestId":"...","error":"mensagem"}
```

Erros de validação antes da abertura do stream continuam retornando JSON com HTTP 400/403/413/415, facilitando testes sem chamar Ollama.

Os nomes de eventos SSE são normalizados pelo backend: somente letras, números, `_`, `.`, e `-` são mantidos, com limite de 64 caracteres. Isso mantém a saída previsível e evita injeção de linhas no stream.

## Exemplo com `curl`

```bash
curl -N -X POST http://127.0.0.1:3131/api/generate-stream \
  -H "Content-Type: application/json" \
  -d '{"task":"Crie uma função Dart simples para validar email","language":"Dart"}'
```

No Windows PowerShell:

```powershell
curl.exe -N -X POST http://127.0.0.1:3131/api/generate-stream `
  -H "Content-Type: application/json" `
  -d "{\"task\":\"Crie uma função Node.js para validar CPF sem dependências\",\"language\":\"Node.js\"}"
```

## Decisões de segurança e performance

- O streaming passa pela mesma fila de geração, preservando `GENERATION_CONCURRENCY=1` por padrão.
- Respostas vindas do cache são enviadas como um único evento `token`, seguido de `done`.
- O timeout `REQUEST_TIMEOUT_MS` também se aplica ao streaming.
- O cache continua pequeno e em memória para não crescer indefinidamente.
- O endpoint não executa código do usuário nem código gerado.
- Os nomes de eventos SSE são sanitizados e limitados antes da escrita no stream.

## Pendências

- Validar o fluxo real com Ollama em Windows.
- Adicionar exemplo de cliente mínimo em Node.js ou Flutter quando o frontend/API client for definido.
- Considerar CI leve para rodar `npm test` automaticamente.
