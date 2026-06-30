# Project memory - API contract large-code-plan alignment

## Data/hora

2026-06-30 America/Sao_Paulo

## Analise inicial

Antes de alterar arquivos, o repositorio `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub.

Arquivos e areas lidas:

- `README.md`
- `package.json`
- `.github/workflows/node-test.yml`
- `src/config.js`
- `src/server.js` em execucao anterior imediatamente antes desta rodada
- `src/http.js`
- `src/project-files.js`
- `src/rate-limit.js`
- `docs/api-contract.md`
- `docs/backend-mvp-status.md`
- `docs/local-validation.md`
- `scripts/start-windows.ps1`
- `scripts/test-windows.ps1`
- registros de memoria recentes, incluindo execucao de correcao de assercao do prompt

Tambem foram consultados:

- issues abertas: sem resultados relevantes retornados pelo conector;
- PRs recentes: sem resultados retornados pelo conector;
- busca textual por registros claros de Claude Agent: sem resultados retornados pela busca disponivel;
- commits recentes por busca de `backend`, mostrando historico de melhorias incrementais e documentacao do MVP.

## Decisao

O backend ja possui rota `POST /api/large-code-plan`, status publico com `largeGeneration`, testes offline e documentacao no README/local validation. A melhoria pequena, segura e reversivel escolhida foi alinhar `docs/api-contract.md`, que ainda estava desatualizado em partes do exemplo de `/health` e nao documentava completamente `/api/large-code-plan`.

Nao foi alterado runtime, fila, cache, streaming, Ollama, seguranca ou configuracao.

## Arquivos alterados

- `docs/api-contract.md`
  - exemplo de `/health` atualizado para incluir `largeGeneration`;
  - `rateLimit.appliedToRoutes` atualizado para incluir `POST /api/large-code-plan`;
  - lista `routes` atualizada para incluir `POST /api/large-code-plan`;
  - contrato de `/api/generate` atualizado com `targetFiles`, `forceSingleGeneration`, resposta `422` para tarefa grande e erro `422`;
  - contrato de `/api/generate-stream` atualizado para explicar que tarefa grande retorna JSON `422` antes de abrir SSE;
  - nova secao de contrato para `POST /api/large-code-plan` com request, campos, response e erros comuns;
  - secao de `POST /api/read-file` adicionada ao final do contrato para manter o documento completo.

- `PROJECT_MEMORY_RUN_2026-06-30_API_CONTRACT_LARGE_CODE_PLAN.md`
  - memoria desta execucao.

## Validacao

Validacao feita por revisao estatica via conector GitHub, comparando documentacao com o comportamento observado em:

- `src/server.js`, que registra `POST /api/large-code-plan` em `ROUTES`, aplica rate limit e retorna `largeGeneration` no status publico;
- `src/large-code.js`, que define `buildLargeCodePlan`, `steps`, `clientFlow`, limites e deteccao de tarefa grande;
- `test/server.test.js`, que cobre rejeicao `422` para tarefa grande em `/api/generate` e `/api/generate-stream`, alem da criacao de plano em `/api/large-code-plan`.

Nao foi executado `npm test` localmente neste ambiente. Como a alteracao principal e documental, a validacao objetiva recomendada continua sendo:

```bash
npm test
```

ou verificar a nova execucao do GitHub Actions apos os commits.

## Riscos

- Risco baixo: alteracao documental, sem mudanca de comportamento do backend.
- O documento agora descreve um contrato mais amplo; se o backend mudar no futuro, `docs/api-contract.md` deve ser mantido em sincronia.
- Nao foram adicionadas dependencias.
- Nao foi executado codigo gerado por usuario.
- Nao foram expostos segredos, caminhos absolutos ou URL real local alem de exemplos loopback intencionais.

## Pendencias

- Confirmar `npm test`, `npm run test:windows` ou CI verde no commit mais recente.
- Se a CI continuar falhando, abrir o log detalhado do step `Run tests` para identificar o teste exato.
- Frontend/cliente visual ainda depende de decisao do usuario.
- Integracao opcional com outros runtimes leves ainda depende de decisao futura.

## Criterios do MVP backend observados

O backend aparenta estar completo para o MVP funcional por implementacao e documentacao: Node.js 20+ sem dependencias pesadas, HTTP nativo local, health/status sanitizados, geracao Ollama, streaming SSE, fila conservadora, cache em memoria, leitura segura de contexto, deteccao de tarefa grande, planejamento incremental, rate limit, logs com redaction, helpers Windows e CI leve. A declaracao final de estabilidade ainda depende de evidencia objetiva de testes passando no commit mais recente.
