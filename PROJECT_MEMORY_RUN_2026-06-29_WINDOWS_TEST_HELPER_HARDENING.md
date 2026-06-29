# Project memory - Windows test helper hardening

## Data/hora

2026-06-29 06:35 America/Sao_Paulo.

## Avaliação inicial do repositório

O repositório `PheidiasSoftware/TESTE` foi reexaminado antes de qualquer alteração, conforme regra operacional do projeto.

Arquivos e áreas analisadas nesta execução:

- `README.md`
- `package.json`
- `.github/workflows/node-test.yml`
- `docs/backend-mvp-status.md`
- `docs/local-validation.md`
- `src/server.js`
- `src/config.js`
- `scripts/test-windows.ps1`
- `scripts/start-windows.ps1`
- PRs recentes pelo conector GitHub

Observações:

- O README continua descrevendo um backend Node.js 20+ leve, sem GPU obrigatória, com Ollama local e modelo pequeno `qwen2.5-coder:1.5b-instruct`.
- `package.json` mantém scripts simples: `start`, `start:windows`, `dev`, `test` e `test:windows`.
- A CI `.github/workflows/node-test.yml` roda `npm test` em Node.js 20 sem instalar Ollama nem modelos.
- `src/server.js` já usa módulos auxiliares para cache, fila, HTTP, logger, Ollama, leitura segura e rate limit.
- `docs/backend-mvp-status.md` ainda registra o backend como funcionalmente pronto para MVP, mas dependente de validação objetiva por `npm test`, `npm run test:windows` ou CI verde.
- O conector GitHub não retornou PRs recentes.
- A busca disponível não trouxe registro claro de Claude Agent nesta execução.

## Decisão tomada

Como o ambiente de execução não permitiu checkout local para rodar `npm test`, não foi feita refatoração em `src/server.js` nem mudança de comportamento de API.

A tarefa segura escolhida foi endurecer o helper offline Windows já existente, porque ele aproxima o projeto da validação objetiva em PC fraco sem adicionar dependências, sem chamar Ollama e sem executar código gerado.

## Arquivos alterados/criados

- Alterado `scripts/test-windows.ps1`
  - adicionada checagem de execução na raiz do repositório por `package.json`;
  - adicionada checagem de existência de `src/server.js`;
  - adicionada validação de Node.js 20+ antes de rodar testes;
  - adicionada impressão da versão Node.js usada.

- Alterado `docs/local-validation.md`
  - documentado que `npm run test:windows` valida raiz do repositório e Node.js 20+ antes da suíte offline.

- Alterado `docs/backend-mvp-status.md`
  - registrada esta execução, os arquivos analisados, a ausência de PRs recentes pelo conector e a decisão de endurecer somente o helper Windows.

- Criado `PROJECT_MEMORY_RUN_2026-06-29_WINDOWS_TEST_HELPER_HARDENING.md`
  - este registro de memória/estado da execução.

## Validações executadas

- Leitura do README, package, CI, docs, scripts e partes centrais do backend pelo conector GitHub.
- Verificação de PRs recentes pelo conector GitHub: nenhum PR retornado.
- Não foi possível executar `npm test` localmente nesta execução porque o checkout local foi bloqueado pelo ambiente.

## Riscos

- A alteração em `scripts/test-windows.ps1` é pequena, mas ainda precisa ser confirmada por `npm run test:windows` em um Windows real ou por revisão manual.
- A validação final do backend continua pendente enquanto não houver CI verde ou execução local dos testes.
- `src/server.js` continua concentrando responsabilidades, mas deve permanecer estável até haver validação objetiva.

## Pendências

1. Executar `npm test` em checkout limpo ou `npm run test:windows` no Windows.
2. Confirmar CI verde no commit mais recente.
3. Se a validação passar, registrar o backend como MVP funcional completo.
4. Só depois disso considerar extração incremental de roteamento/handlers de `src/server.js`.

## Compatibilidade com Claude Agent

Não foram encontrados PRs, branches, arquivos de estado ou comentários claros do Claude Agent pelo conector nesta execução. A memória foi criada de forma explícita para facilitar continuidade por Claude Agent ou outro agente futuro.
