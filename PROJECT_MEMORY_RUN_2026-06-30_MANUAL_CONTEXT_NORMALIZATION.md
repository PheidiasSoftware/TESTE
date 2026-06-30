# Project memory - manual context normalization hardening

## Data/hora

2026-06-30 11:36 America/Sao_Paulo

## Avaliação inicial do repositório

Repositório analisado antes de alterações, conforme regra operacional. O projeto continua sendo um backend Node.js leve para uma LLM/SLM local focada em programação, com alvo explícito em Windows, 8 GB de RAM, CPU e sem GPU.

Arquivos e áreas examinados nesta execução:

- `README.md`
- `package.json`
- `src/server.js`
- `src/project-files.js`
- `src/config.js`
- `test/project-files.test.js`
- `docs/api-contract.md`
- `docs/generate-request-validation.md`
- `docs/backend-mvp-status.md`
- issues abertas do repositório
- PRs abertos/recentes do repositório
- commits recentes relacionados a contexto/PROJECT_MEMORY

Resumo encontrado:

- O README já documenta API local, Ollama, Windows, testes, CI leve e variáveis conservadoras.
- `package.json` mantém Node.js 20+, sem dependências externas pesadas, com `npm test` e `npm run test:windows`.
- `src/server.js` já possui geração normal e streaming, fila, cache, rate limit, validação de `Content-Type`, `task` não vazia, `language` normalizado e status público sanitizado.
- `src/project-files.js` já possuía leitura segura de arquivos, allowlist de extensões, bloqueio de `.env`, travessia, `node_modules`, artefatos e corte UTF-8 seguro.
- `contextFiles` já era validado como array e com limite de quantidade.
- Não foram encontrados PRs ou issues abertos pelo conector.
- Não foram encontrados registros claros de Claude Agent nesta execução pela busca disponível.

## Decisão tomada

A menor melhoria segura identificada foi endurecer o `context` manual enviado no corpo de `/api/generate` e `/api/generate-stream`.

Motivo: o `context` manual já era limitado por bytes, mas ainda entrava no prompt sem normalização explícita de caracteres de controle. Para um backend local em PC fraco, a melhoria reduz risco de prompt sujo, comportamento estranho em clientes locais e conteúdo difícil de diagnosticar, sem adicionar dependências e sem alterar a arquitetura.

## Arquivos alterados/criados

### Alterados

- `src/project-files.js`
  - Criada função `normalizeManualContext(value, maxBytes)`.
  - Preserva quebras de linha úteis (`LF`).
  - Normaliza `CRLF`/`CR` para `LF`.
  - Remove caracteres de controle não textuais como NUL e BEL.
  - Ignora valores não textuais.
  - Reutiliza `truncateUtf8ToBytes()` para respeitar `MAX_CONTEXT_BYTES` sem quebrar caracteres multibyte.
  - `buildContextFromFiles()` passa a usar `normalizeManualContext()` em todos os caminhos de montagem de contexto manual.

- `test/project-files.test.js`
  - Export/import coberto para `normalizeManualContext()`.
  - Adicionados testes para remoção de controles não textuais, preservação de quebras úteis, fallback para valor não textual e corte UTF-8 seguro.

- `docs/api-contract.md`
  - Campo `context` documentado como normalizado: CRLF/CR para LF, remoção de controles não textuais, limite por `MAX_CONTEXT_BYTES` sem quebrar UTF-8 e ignorar valores não textuais.

- `docs/generate-request-validation.md`
  - Adicionada seção específica para validação/normalização de `context`.
  - Atualizada seção de testes esperados.

### Criado

- `PROJECT_MEMORY_RUN_2026-06-30_MANUAL_CONTEXT_NORMALIZATION.md`

## Commits desta execução

- `355384603e0acd1804c85092c761b7c76f5e6bb9` - Normalize manual generation context
- `c43251c07af0f6b1d82f0253d87d4056627a0f43` - Cover manual context normalization
- `66544aed959d133de4864de329870023cd8c3f25` - Document manual context normalization
- `7dfafe486f06e96e6c6b9e861edcdfb758735ccf` - Document manual context validation

## Validações executadas

Validações via conector GitHub:

- Releitura parcial de `src/project-files.js` após alteração para confirmar presença de `normalizeManualContext()` e uso em `buildContextFromFiles()`.
- Releitura parcial de `test/project-files.test.js` após alteração para confirmar novos testes.
- Consulta de status combinado do commit final `7dfafe486f06e96e6c6b9e861edcdfb758735ccf`: sem checks registrados.
- Consulta de workflow runs para o commit final: sem execuções retornadas.

Validação local:

- Tentativa de `git clone`/`npm test` local foi bloqueada por autorização do ambiente de execução (`UnauthorizedError`).
- Portanto, `npm test` e `npm run test:windows` ainda precisam ser confirmados fora deste ambiente ou pela CI.

## Riscos

- A alteração é pequena e reversível.
- Não executa código do usuário.
- Não adiciona dependências.
- Não chama Ollama.
- Não baixa modelos.
- Não aumenta consumo de memória de forma relevante.
- Como os testes não foram executados localmente, ainda há risco residual de erro de teste/sintaxe até validação objetiva.

## Pendências

- Confirmar `npm test`, `npm run test:windows` ou CI verde no commit mais recente.
- Evitar novas funcionalidades grandes até haver evidência objetiva de testes passando.
- Backend já está próximo do MVP; próximas execuções devem continuar priorizando endurecimentos pequenos, documentação e testes.

## Próximos passos seguros sugeridos

1. Confirmar a suíte de testes no ambiente do usuário ou GitHub Actions.
2. Se os testes passarem, revisar se o contrato de erro do streaming deve ocultar `detail` em todos os casos da mesma forma que `/api/generate`.
3. Se ainda não houver cliente/frontend, manter backend estável e criar exemplos mínimos de consumo local sem execução automática de código.

## Compatibilidade com Claude Agent

Nenhum registro claro de intervenção do Claude Agent foi encontrado nesta execução. A mudança foi documentada em arquivo de memória próprio para facilitar continuidade por outros agentes.
