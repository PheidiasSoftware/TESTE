# Project memory - README large-code endpoint alignment

## Data/hora

2026-06-30 14:21 America/Sao_Paulo

## Avaliação inicial do repositório

Antes de alterar arquivos, foram examinados via conector GitHub:

- metadados do repositório `PheidiasSoftware/TESTE`;
- `README.md`;
- `package.json`;
- `src/server.js`;
- `src/large-code.js`;
- `src/config.js`;
- `test/large-code.test.js`;
- `test/server.test.js`;
- `.github/workflows/node-test.yml`;
- `docs/backend-mvp-status.md`;
- `docs/large-code-generation.md`;
- PRs recentes do usuário no repositório;
- busca textual por registros de Claude Agent e arquivos de memória.

## Situação encontrada

- O backend já possui API local Node.js 20+ sem dependências externas pesadas.
- O backend já possui `/api/generate`, `/api/generate-stream`, `/api/read-file`, `/health`, `/api/status` e `/api/large-code-plan`.
- A documentação dedicada `docs/large-code-generation.md` descreve o endpoint de planejamento grande.
- O `README.md` listava guias técnicos e endpoints principais, mas ainda não destacava claramente `docs/large-code-generation.md`, as variáveis `MAX_LARGE_PLAN_*` e o endpoint `POST /api/large-code-plan` no fluxo principal.
- Não foram encontrados PRs recentes pelo conector.
- A busca textual não retornou registros claros do Claude Agent.

## Decisão tomada

Foi escolhida uma melhoria somente de documentação, pequena, segura e reversível: alinhar o `README.md` ao estado real do backend para que um usuário em Windows/PC fraco encontre rapidamente o fluxo correto de geração grande em etapas.

## Arquivos alterados/criados

- Alterado: `README.md`
  - Adicionado link para `docs/large-code-generation.md` na lista de guias técnicos.
  - Adicionadas variáveis `MAX_LARGE_PLAN_FILES`, `MAX_LARGE_PLAN_STEPS` e `MAX_FILES_PER_CONTEXT_BATCH` na tabela de ambiente.
  - Adicionada observação de que `/api/generate` pode retornar `422` com `largeCodeSuggestion` para tarefas grandes.
  - Adicionada seção `POST /api/large-code-plan` com exemplo `curl` e orientação de enviar cada `steps[n].task` para `/api/generate-stream`.

- Criado: `PROJECT_MEMORY_RUN_2026-06-30_README_LARGE_CODE_ENDPOINT.md`
  - Este registro de execução.

## Validações executadas

- Validação estática por leitura do repositório via conector GitHub.
- Não houve execução local de `npm test` neste ambiente.
- A alteração foi documental e não muda código de runtime.

## Riscos

- Baixo risco: mudança apenas em documentação.
- Pode haver necessidade futura de revisar a seção final `POST /api/read-file`, pois o `README.md` já terminava em `Proteções aplicadas:` no trecho examinado.

## Pendências

- Confirmar `npm test` localmente ou pelo GitHub Actions em commit recente.
- Verificar se o `README.md` deve receber uma finalização mais completa para a seção `POST /api/read-file`.
- Manter a recomendação de evitar refatorações amplas enquanto não houver CI/teste confirmado.

## Próximos passos seguros

1. Completar a seção `POST /api/read-file` do `README.md`, se ainda estiver truncada.
2. Validar CI ou `npm test`.
3. Depois da validação, considerar pequeno hardening de sanitização para `previousStepMemory` em `largeCodeSuggestion.suggestedRequest.body`.

## Compatibilidade com Claude Agent

Não foram encontrados registros claros do Claude Agent nesta execução. A alteração não conflita com branches, PRs ou issues existentes pelo que foi retornado pelo conector.
