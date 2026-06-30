# PROJECT MEMORY - Generate task text validation

## Data/hora

2026-06-30 02:37 America/Sao_Paulo

## Avaliação inicial do repositório

Antes de alterar arquivos, o repositório `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub.

Arquivos e áreas verificados:

- `README.md`
- `package.json`
- `src/server.js`
- `src/config.js`
- `src/project-files.js`
- `test/server.test.js`
- `docs/api-contract.md`
- `docs/backend-mvp-status.md`
- PRs recentes pelo conector
- commits e memórias recentes do projeto
- busca textual por registros claros de Claude Agent

Resultado da verificação:

- O projeto continua sendo um backend Node.js 20+ sem dependências externas pesadas.
- O escopo segue compatível com PC fraco com Windows, 8 GB de RAM e sem GPU.
- `README.md` confirma objetivo de API local para programação com Ollama e modelo pequeno.
- `package.json` continua usando apenas scripts Node/PowerShell e `node --test`.
- O backend já possui fila, cache, streaming SSE, leitura segura de arquivos, rate limit e status público sanitizado.
- Não foram retornados PRs recentes pelo conector.
- Não foram encontrados registros claros do Claude Agent nesta execução.
- A pendência recorrente segue sendo confirmar `npm test`, `npm run test:windows` ou CI verde no commit mais recente.

## Decisão tomada

A melhoria segura desta execução foi endurecer a validação de `task` nas rotas de geração.

Motivo: antes, `task` com apenas espaços era uma string válida e poderia avançar até montagem de prompt/fila. Em PC fraco, isso desperdiça recursos e piora o contrato para clientes locais.

## Arquivos alterados/criados

Alterados:

- `src/server.js`
  - normaliza `task` com `trim()`;
  - rejeita `task` ausente, não textual, vazia ou somente espaços com `HTTP 400`;
  - normaliza `language` com `trim()` e fallback `general` quando vazio.

Criados:

- `test/generate-validation.test.js`
  - cobre `/api/generate` com `task` somente espaços/quebra/tabulação;
  - cobre `/api/generate-stream` com `task` vazia antes de abrir SSE.

- `docs/generate-request-validation.md`
  - documenta o contrato de validação de `task` e `language`;
  - registra o motivo de performance/segurança para PC fraco.

- `PROJECT_MEMORY_RUN_2026-06-30_GENERATE_TASK_TEXT_VALIDATION.md`

## Validações executadas

Validação remota por leitura do conector:

- `src/server.js` foi relido após alteração e confirmou `task.trim()` e erro `task precisa ser texto não vazio`.
- `test/generate-validation.test.js` foi relido após criação; uma primeira versão tinha literal multilinha inválido e foi corrigida para `String.fromCharCode(...)`.

Não foi possível executar `npm test` diretamente no ambiente desta automação porque o checkout local por `git clone` retornou bloqueio de autorização. A validação final objetiva segue pendente até `npm test`, `npm run test:windows` ou CI verde.

## Riscos

Baixo risco. A alteração é restrita à validação de entrada antes de chamar o runtime local. Não muda integração Ollama, fila, cache, leitura segura de arquivos, rate limit, scripts Windows ou dependências.

Possível impacto compatível: clientes que enviavam `task` com apenas espaços agora recebem `HTTP 400`, o que é desejado.

## Pendências

- Confirmar `npm test` ou `npm run test:windows`.
- Confirmar CI verde no commit mais recente.
- Atualizar o contrato principal da API em execução futura, se desejado, para referenciar diretamente `docs/generate-request-validation.md`.
- Evitar novas funcionalidades grandes até haver validação objetiva dos testes.

## Próximos passos seguros

- Consolidar documentação de validação no `docs/api-contract.md`.
- Verificar CI/checks do commit mais recente.
- Revisar limites de `context` manual e mensagens de erro, mantendo mudanças pequenas.

## Compatibilidade com Claude Agent

Nenhum registro claro do Claude Agent foi encontrado nesta execução. Esta memória registra a decisão e os arquivos alterados para facilitar coordenação futura com outros agentes.
