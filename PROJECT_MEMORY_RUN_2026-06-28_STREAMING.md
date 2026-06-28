# Registro de execução - Streaming backend local

## Data/hora

2026-06-28 00:35 America/Sao_Paulo

## Avaliação inicial do repositório

Antes de qualquer alteração, o repositório `PheidiasSoftware/TESTE` foi examinado novamente.

Arquivos e áreas conferidos:

- `README.md`
- `package.json`
- `src/server.js`
- `test/server.test.js`
- `memory.md`
- `PROJECT_MEMORY.md`
- busca textual por registros de Claude Agent, memória, issues, PRs e instruções conflitantes

Estado observado:

- O backend já estava estruturado em Node.js nativo, sem dependências externas.
- `package.json` mantinha scripts `start`, `start:windows`, `dev` e `test` com Node.js 20+.
- `src/server.js` já possuía fila conservadora, cache pequeno, leitura segura de arquivos, contexto por arquivos e integração com Ollama sem execução automática de código.
- `README.md` documentava o MVP local para PC fraco com Windows, 8 GB RAM e sem GPU.
- `memory.md` indicava como próximo passo seguro adicionar endpoint de streaming separado ou CI leve.
- Não foram encontrados registros claros de Claude Agent, PRs, issues abertas ou instruções conflitantes durante esta execução.

## Decisão tomada

Implementar uma melhoria incremental, segura e reversível: adicionar endpoint de streaming separado via Server-Sent Events, sem alterar o contrato do endpoint JSON existente `POST /api/generate`.

Motivo:

- Streaming melhora a experiência em respostas longas de programação.
- A resposta pode começar antes de terminar a geração completa.
- A implementação reaproveita fila, cache, prompt técnico, timeout e leitura segura já existentes.
- Não adiciona dependências e continua adequada para PC fraco sem GPU.

## Arquivos alterados/criados

### `src/server.js`

Alterações principais:

- Criado `POST /api/generate-stream`.
- Criados helpers `openEventStream()` e `sendServerEvent()`.
- Criada chamada streaming ao Ollama com `stream: true`.
- Adicionado parser simples de NDJSON retornado pelo Ollama.
- Criado fluxo SSE com eventos:
  - `metadata`
  - `token`
  - `done`
  - `error`
- Reutilizada a fila `generationQueue` para manter concorrência conservadora.
- Reutilizado o cache de prompt; em cache hit, a resposta é emitida como um único evento `token` seguido de `done`.
- Reutilizada a montagem segura de contexto por `contextFiles`.
- `GET /health`, `GET /api/status` e a resposta 404 agora expõem a lista centralizada de rotas.

### `test/server.test.js`

Alterações principais:

- Criada constante `EXPECTED_ROUTES` com a nova rota.
- Atualizados testes de `/health`, `/api/status` e 404 para validar a lista de rotas atualizada.
- Adicionado teste para `POST /api/generate-stream` com `task` ausente, garantindo erro 400 antes de abrir SSE ou chamar Ollama.

### `docs/streaming.md`

Criado guia técnico do endpoint de streaming:

- objetivo do endpoint;
- entrada aceita;
- eventos SSE emitidos;
- exemplos com `curl` e PowerShell;
- decisões de segurança/performance;
- pendências.

### `PROJECT_MEMORY_RUN_2026-06-28_STREAMING.md`

Criado este registro de memória/estado para preservar avaliação, decisão, alterações, validações, riscos e próximos passos desta execução.

## Validações executadas

- Validação estática manual do fluxo de streaming.
- Conferido que o endpoint antigo `POST /api/generate` foi preservado.
- Conferido que a nova rota não executa código de usuário.
- Conferido que o streaming passa pela mesma fila conservadora usada no endpoint JSON.
- Conferido que cache, timeout e montagem segura de contexto foram reaproveitados.
- Conferido que o teste novo de streaming não chama Ollama, pois valida entrada inválida antes da abertura do SSE.
- Conferido que nenhuma dependência externa foi adicionada.

Limitação:

- Não foi possível executar `npm test` pelo conector GitHub. A validação final deve ser feita localmente com Node.js 20+ ou por CI futuro.

## Riscos e observações

- O parser de streaming ignora linhas NDJSON inválidas em vez de derrubar o processo, o que é adequado para robustez local inicial.
- Quando a fila está cheia depois do SSE já aberto, o erro é enviado como evento `error`, mantendo HTTP 200 por já estar em modo streaming.
- Clientes precisam ler SSE, não JSON tradicional, nessa rota.
- O fluxo real precisa ser validado em Windows com Ollama instalado.
- O projeto ainda não tem CI automático para `npm test`.

## Pendências atualizadas

1. Executar `npm test` localmente em Windows/Node.js 20+.
2. Testar `npm run start:windows` em Windows real com Ollama instalado.
3. Testar `POST /api/generate-stream` com Ollama real e modelo `qwen2.5-coder:1.5b-instruct`.
4. Atualizar `README.md` com link para `docs/streaming.md` em uma próxima execução segura.
5. Documentar integração futura com plugin/extensão VS Code ou cliente Flutter.
6. Considerar CI leve com GitHub Actions usando Node.js 20.

## Próximo passo sugerido

Na próxima execução segura, priorizar CI leve com GitHub Actions para executar `npm test` automaticamente ou atualizar o README principal com referência ao guia de streaming, mantendo o projeto sem dependências pesadas.
