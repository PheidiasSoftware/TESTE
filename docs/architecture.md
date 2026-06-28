# Arquitetura do backend local

Este documento descreve a arquitetura atual do backend local do projeto `TESTE`, com foco em execução leve em Windows, 8 GB de RAM e sem GPU.

## Objetivo técnico

O backend deve fornecer uma API local para apoio à programação em Node.js, Flutter/Dart e MySQL usando uma LLM/SLM pequena executada localmente, inicialmente via Ollama.

As decisões priorizam:

- baixo consumo de memória;
- ausência de dependências pesadas;
- execução local por padrão em `127.0.0.1`;
- segurança na leitura de arquivos;
- não execução automática de código gerado;
- facilidade de teste com `node --test`;
- compatibilidade com PC fraco sem GPU.

## Componentes atuais

### `src/server.js`

Responsável pelo servidor HTTP nativo e pela orquestração principal:

- criação do servidor com `node:http`;
- roteamento HTTP;
- endpoints `/health`, `/api/status`, `/api/generate`, `/api/generate-stream` e `/api/read-file`;
- montagem de prompt técnico;
- fila de geração conservadora;
- cache em memória por hash de prompt;
- chamada ao Ollama;
- streaming SSE;
- leitura segura de arquivos do projeto;
- logs estruturados;
- rate limit local.

Ainda concentra muitas responsabilidades, mas isso foi aceitável para o bootstrap do MVP. A evolução recomendada é separar gradualmente funções puras e adaptadores.

### `src/config.js`

Centraliza configuração por variáveis de ambiente:

- host e porta;
- URL do Ollama;
- modelo padrão;
- limites de payload, arquivo e contexto;
- cache;
- fila;
- logs;
- rate limit;
- extensões permitidas.

Esse módulo deve permanecer sem efeitos colaterais pesados, para facilitar testes e reduzir risco em Windows.

### `src/http.js`

Contém helpers HTTP reutilizáveis:

- `sendJson()`;
- `sendServerEvent()`;
- `openEventStream()`;
- `readJsonBody()`.

Próximo passo técnico recomendado: integrar esses helpers em `src/server.js`, removendo duplicação local. A integração deve ser feita em um commit pequeno, mantendo o contrato das rotas e usando `readJsonBody(request, { maxBodyBytes: MAX_BODY_BYTES })` para preservar o limite configurável.

### `src/rate-limit.js`

Contém rate limit em memória com janela fixa:

- sem Redis;
- sem banco;
- sem dependência externa;
- adequado para uso local;
- evita abuso acidental de rotas pesadas.

O rate limit não deve bloquear `/health` e `/api/status`, pois essas rotas são usadas para diagnóstico.

## Fluxo de geração normal

1. Cliente chama `POST /api/generate`.
2. Backend aplica rate limit.
3. Backend lê JSON com limite de corpo.
4. Backend valida `task`, `language`, `context` e `contextFiles`.
5. Quando `contextFiles` é informado, os arquivos são lidos por caminho relativo seguro.
6. Prompt técnico é montado.
7. Cache por hash de prompt é consultado.
8. Se não houver cache, a tarefa entra na fila de geração.
9. Backend chama Ollama em `/api/generate`.
10. Resposta é salva no cache, quando habilitado.
11. Backend retorna resposta, métricas de fila/cache e informações de contexto.

## Fluxo de streaming

1. Cliente chama `POST /api/generate-stream`.
2. Backend valida entrada igual ao endpoint normal.
3. Backend abre conexão SSE.
4. Evento `metadata` é enviado.
5. Tokens são emitidos em eventos `token`.
6. Finalização ocorre em evento `done`.
7. Falhas são emitidas em evento `error`.

O streaming melhora a experiência em CPU fraca porque o usuário começa a receber texto antes do término da geração.

## Segurança local

O backend não deve:

- executar código enviado pelo usuário;
- executar código gerado pelo modelo;
- abrir servidor publicamente por padrão;
- ler `.env`, `.env.*`, `.git`, `node_modules`, `dist`, `build`, `.next` ou `.cache`;
- aceitar caminho absoluto ou travessia com `../`;
- registrar prompt, contexto, resposta gerada ou conteúdo de arquivo em logs.

## Limites para PC fraco

Configuração conservadora recomendada:

```text
HOST=127.0.0.1
GENERATION_CONCURRENCY=1
MAX_QUEUE_SIZE=4
MAX_CONTEXT_FILES=4
MAX_CONTEXT_BYTES=12000
MAX_FILE_READ_BYTES=32768
REQUEST_TIMEOUT_MS=120000
ENABLE_PROMPT_CACHE=true
MAX_CACHE_ENTRIES=20
```

Para PCs com 8 GB RAM, evitar modelos grandes. O guia de seleção de modelos detalha opções leves.

## Direção de refatoração

A evolução deve ser incremental, com um módulo por vez:

1. integrar `src/http.js` em `src/server.js` sem alterar contrato das rotas;
2. extrair cache para `src/cache.js`;
3. extrair fila para `src/generation-queue.js`;
4. extrair leitura segura para `src/project-files.js`;
5. extrair cliente Ollama para `src/ollama-client.js`;
6. manter `src/server.js` como composição de rotas e dependências.

Cada etapa deve ter teste próprio e não deve adicionar dependências externas sem justificativa forte.

## Critérios de MVP backend

O backend pode ser considerado MVP quando atender, no mínimo:

- inicialização local documentada;
- endpoint de saúde;
- geração via Ollama;
- fila de geração com concorrência 1 por padrão;
- streaming SSE;
- cache leve;
- leitura segura de arquivos;
- rate limit local;
- logs estruturados com redaction;
- testes básicos sem chamar Ollama;
- CI leve com Node.js 20;
- documentação de instalação, modelos e integração local.

O projeto já cobre a maior parte desses critérios. O principal débito técnico atual é a concentração de responsabilidades em `src/server.js`.
