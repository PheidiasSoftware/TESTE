# TESTE Local Code LLM Backend

Backend leve para uma LLM/SLM local focada em programação, pensado para PC fraco com Windows, 8 GB de RAM e sem GPU.

## Objetivo

Fornecer uma API local simples para auxiliar programação em Node.js, Flutter/Dart e MySQL usando um runtime local leve, inicialmente Ollama.

## Requisitos recomendados

- Windows 10/11 ou Linux
- Node.js 20+
- 8 GB de RAM
- Sem GPU obrigatória
- Ollama instalado e rodando localmente

Modelo padrão sugerido:

```bash
ollama pull qwen2.5-coder:1.5b-instruct
```

Esse modelo é pequeno o bastante para testes iniciais em CPU. Em máquinas muito limitadas, reduza contexto, feche apps pesados e evite prompts longos.

## Como rodar

```bash
npm install
npm start
```

Como o projeto ainda não usa dependências externas, `npm install` apenas prepara o projeto Node.

Servidor padrão:

```text
http://127.0.0.1:3131
```

## Como rodar no Windows

Use o script PowerShell para iniciar o backend com padrões conservadores para PC fraco:

```powershell
npm run start:windows
```

Ou diretamente:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-windows.ps1
```

O script:

- mantém `GENERATION_CONCURRENCY=1` quando a variável não foi definida;
- mantém `MAX_QUEUE_SIZE=4` quando a variável não foi definida;
- mantém cache pequeno por padrão;
- verifica se o Ollama responde em `OLLAMA_URL`;
- apenas inicia o backend local, sem executar código gerado pelo modelo.

Se o Ollama não responder, inicie o Ollama e instale o modelo sugerido:

```powershell
ollama pull qwen2.5-coder:1.5b-instruct
```

## Testes

O projeto usa o test runner nativo do Node.js, sem dependências externas:

```bash
npm test
```

Os testes atuais validam:

- montagem do prompt técnico sem chamar Ollama;
- fila de geração, limite de fila cheia e concorrência conservadora;
- cache simples por hash de prompt, incluindo reaproveitamento e limite de entradas;
- leitura segura de arquivos com bloqueio de travessia, pastas sensíveis, `.env` real e arquivos grandes;
- montagem de contexto para geração a partir de lista controlada de arquivos textuais;
- logs estruturados com redaction de campos sensíveis;
- rotas HTTP locais `GET /health`, `GET /api/status`, `POST /api/generate` com entrada inválida, `POST /api/generate-stream` com entrada inválida, `POST /api/read-file` com caminho inválido e rota 404.

Esses testes não chamam o Ollama nem exigem modelo instalado, então podem rodar em máquina fraca apenas com Node.js 20+.

## CI leve

O repositório possui GitHub Actions em `.github/workflows/node-test.yml` para rodar `npm test` automaticamente em Node.js 20.

O workflow roda em:

- push na branch `main`;
- pull request para `main`;
- execução manual por `workflow_dispatch`.

A CI não instala Ollama, não baixa modelos e não chama `/api/generate` com tarefa válida. Ela cobre somente os testes locais que não dependem de GPU nem de runtime externo.

## Guias técnicos

- [Streaming SSE](docs/streaming.md)
- [Rate limit local](docs/rate-limit.md)
- [Seleção de modelos leves](docs/model-selection.md)
- [Integração de clientes locais](docs/client-integration.md)

## Variáveis de ambiente

| Variável | Padrão | Uso |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Interface local do servidor |
| `PORT` | `3131` | Porta HTTP |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | URL local do Ollama |
| `MODEL` | `qwen2.5-coder:1.5b-instruct` | Modelo usado na geração |
| `MAX_BODY_BYTES` | `65536` | Limite do corpo JSON |
| `REQUEST_TIMEOUT_MS` | `120000` | Timeout da chamada ao modelo |
| `MAX_QUEUE_SIZE` | `4` | Quantidade máxima de pedidos aguardando geração |
| `GENERATION_CONCURRENCY` | `1` | Gerações simultâneas; manter `1` em PC fraco sem GPU |
| `ENABLE_PROMPT_CACHE` | `true` | Ativa cache em memória para prompts repetidos |
| `MAX_CACHE_ENTRIES` | `20` | Quantidade máxima de respostas em cache |
| `PROJECT_ROOT` | pasta atual | Raiz permitida para leitura segura de arquivos |
| `MAX_FILE_READ_BYTES` | `32768` | Tamanho máximo de arquivo lido pela API |
| `MAX_CONTEXT_FILES` | `4` | Quantidade máxima de arquivos que `/api/generate` aceita em `contextFiles` |
| `MAX_CONTEXT_BYTES` | `12000` | Tamanho máximo do contexto final montado para o prompt |
| `ALLOWED_FILE_EXTENSIONS` | lista segura | Extensões permitidas separadas por vírgula |
| `LOG_LEVEL` | `info` | Nível dos logs estruturados: `silent`, `error`, `warn`, `info` ou `debug` |
| `ENABLE_RATE_LIMIT` | `true` | Ativa rate limit local nas rotas pesadas |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Janela do rate limit em milissegundos |
| `RATE_LIMIT_MAX_REQUESTS` | `30` | Máximo de requisições por cliente em cada janela |
| `RATE_LIMIT_MAX_CLIENTS` | `500` | Máximo de clientes rastreados em memória |
| `TRUST_PROXY` | `false` | Usa `X-Forwarded-For` somente quando o backend estiver atrás de proxy confiável |

Extensões permitidas por padrão:

```text
.css,.dart,.html,.js,.json,.md,.ps1,.sql,.ts,.txt,.yaml,.yml
```

## Endpoints

### `GET /health`

Retorna estado básico do backend, situação da fila, métricas do cache, configuração de leitura segura e configuração de logs.

```bash
curl http://127.0.0.1:3131/health
```

### `GET /api/status`

Retorna métricas simples de uso da fila, do cache, da leitura segura e do logging, incluindo gerações ativas, pendentes, concluídas, falhas, acertos e descartes de cache.

```bash
curl http://127.0.0.1:3131/api/status
```

### `POST /api/generate`

Gera resposta de programação usando o modelo local.

```bash
curl -X POST http://127.0.0.1:3131/api/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"task\":\"Crie uma função JS para validar email\",\"language\":\"Node.js\"}"
```

Campos aceitos:

- `task` obrigatório: tarefa de programação.
- `language` opcional: foco técnico, por exemplo `Node.js`, `Dart`, `Flutter`, `MySQL`.
- `context` opcional: trecho controlado do projeto.
- `contextFiles` opcional: lista de caminhos relativos para arquivos textuais pequenos dentro do projeto.

Exemplo com arquivos do projeto como contexto:

```bash
curl -X POST http://127.0.0.1:3131/api/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"task\":\"Revise esta função\",\"language\":\"Node.js\",\"contextFiles\":[\"src/server.js\"]}"
```

A resposta informa:

- `cached: true` quando a resposta veio do cache local em memória;
- `contextFiles` com os arquivos incluídos no prompt;
- `contextTruncated: true` quando o contexto foi limitado por `MAX_CONTEXT_BYTES`.

`contextFiles` reutiliza as mesmas proteções de `POST /api/read-file`: não aceita caminho absoluto, travessia, `.env`, `.git`, `node_modules`, artefatos gerados, extensões fora da allowlist ou arquivos grandes.

### `POST /api/generate-stream`

Gera resposta por streaming usando Server-Sent Events. É útil para respostas longas porque o cliente começa a receber tokens antes do término completo da geração.

Guia técnico completo: [`docs/streaming.md`](docs/streaming.md).

Eventos emitidos:

- `metadata`: dados iniciais da requisição, cache, fila e contexto.
- `token`: pedaços de texto gerados pelo modelo.
- `done`: finalização bem-sucedida.
- `error`: erro durante a geração em streaming.

### `POST /api/read-file`

Lê um arquivo textual pequeno dentro da pasta do projeto para alimentar contexto de programação, sem executar código.

```bash
curl -X POST http://127.0.0.1:3131/api/read-file ^
  -H "Content-Type: application/json" ^
  -d "{\"path\":\"src/server.js\"}"
```

Proteções aplicadas:

- aceita apenas caminho relativo ao projeto;
- bloqueia travessia como `../arquivo`;
- bloqueia `.git`, `node_modules`, `dist`, `build`, `.next` e `.cache`;
- bloqueia arquivos `.env` e `.env.*`;
- aceita apenas extensões textuais permitidas;
- bloqueia arquivos acima de `MAX_FILE_READ_BYTES`.

Essa rota deve ser usada para montar contexto controlado para `/api/generate`, não para executar arquivos.

## Logs estruturados

O backend emite logs em JSON Lines para eventos importantes como início do servidor, requisições de geração, cache hit, falhas e leitura segura de arquivos.

Exemplo de linha de log:

```json
{"timestamp":"2026-06-28T00:00:00.000Z","level":"info","service":"teste-local-code-llm-backend","event":"generate.request.completed","requestId":"...","durationMs":1200}
```

Proteções de log:

- não registra prompt completo, contexto, conteúdo de arquivo nem resposta gerada;
- redige campos com nomes sensíveis como `authorization`, `token`, `secret`, `password`, `apiKey`, `prompt`, `context`, `content` e `response`;
- limita strings longas para reduzir ruído e memória;
- pode ser desligado com `LOG_LEVEL=silent`.

Níveis aceitos:

```text
silent,error,warn,info,debug
```

## Proteção para PC fraco

O backend usa uma fila simples de geração para evitar sobrecarregar CPU e RAM. Por padrão, apenas uma geração roda por vez (`GENERATION_CONCURRENCY=1`) e até quatro ficam aguardando (`MAX_QUEUE_SIZE=4`). Quando a fila enche, a API responde `429` em vez de deixar o computador travar.

Também existe cache em memória por hash de prompt. Em perguntas repetidas, o backend pode responder sem chamar o Ollama novamente, economizando CPU. O cache é pequeno por padrão (`MAX_CACHE_ENTRIES=20`) e é perdido ao reiniciar o backend, o que mantém o MVP simples e reversível.

Para máquina com 8 GB RAM e sem GPU, recomenda-se manter:

```text
GENERATION_CONCURRENCY=1
MAX_QUEUE_SIZE=4
ENABLE_PROMPT_CACHE=true
MAX_CACHE_ENTRIES=20
MAX_FILE_READ_BYTES=32768
MAX_CONTEXT_FILES=4
MAX_CONTEXT_BYTES=12000
LOG_LEVEL=info
ENABLE_RATE_LIMIT=true
RATE_LIMIT_MAX_REQUESTS=30
```

Se a máquina ficar com pouca memória, reduza `MAX_CACHE_ENTRIES`, reduza `MAX_FILE_READ_BYTES`, reduza `MAX_CONTEXT_FILES`, reduza `MAX_CONTEXT_BYTES`, use `LOG_LEVEL=warn` ou desative cache com `ENABLE_PROMPT_CACHE=false`.

## Decisões de arquitetura

- Sem framework no MVP para reduzir dependências e consumo de memória.
- API local vinculada por padrão a `127.0.0.1`.
- Limite de payload para evitar uso excessivo de memória.
- Timeout para evitar travamento em PC fraco.
- Fila de concorrência baixa para evitar múltiplas inferências simultâneas.
- Cache em memória pequeno para economizar CPU em prompts repetidos.
- Leitura segura limitada a arquivos textuais pequenos dentro do projeto.
- Contexto por arquivos integrado ao `/api/generate` com limite de quantidade e bytes.
- Streaming em rota separada via SSE para melhorar experiência sem alterar o endpoint JSON.
- Rate limit em memória nas rotas pesadas para reduzir abuso acidental e travamentos.
- Logs estruturados em JSON Lines com redaction de campos sensíveis e sem persistência em arquivo.
- Script Windows em PowerShell para iniciar com padrões conservadores e verificar Ollama.
- CI leve com GitHub Actions roda apenas `npm test` em Node.js 20, sem instalar Ollama.
- Funções de prompt, cache, fila, leitura de arquivo, montagem de contexto, logging e servidor exportadas para testes sem iniciar o processo via `npm start`.
- Rotas HTTP básicas testadas sem depender do Ollama.
- Prompt técnico focado em respostas curtas, seguras e úteis para código.

## Próximos passos

- Testar `npm run start:windows` em Windows real com Ollama instalado.
- Testar `POST /api/generate-stream` com Ollama real e modelo `qwen2.5-coder:1.5b-instruct`.
- Validar integração inicial com uma extensão VS Code ou cliente Flutter usando [`docs/client-integration.md`](docs/client-integration.md).
- Considerar separação gradual de `src/server.js` em módulos menores quando o arquivo crescer mais.
