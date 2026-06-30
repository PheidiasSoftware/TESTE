# Project memory - CI large generation limit alignment

## Data/hora

2026-06-30 15:22 America/Sao_Paulo

## Avaliação inicial do repositório

Antes da alteração, foram examinados:

- metadados do repositório `PheidiasSoftware/TESTE`;
- `README.md`;
- `package.json`;
- `src/config.js`;
- `src/server.js`;
- `src/large-code.js`;
- `test/large-code.test.js`;
- `.github/workflows/node-test.yml`;
- `scripts/start-windows.ps1`;
- `scripts/test-windows.ps1`;
- `docs/mvp-readiness-review.md`;
- PRs recentes do usuário no repositório.

Resumo encontrado:

- O backend já possui API local, integração com Ollama, geração normal, streaming SSE, fila, cache, leitura segura de arquivos, rate limit, logs estruturados e planejamento de geração grande.
- O `README.md` já documenta `/api/large-code-plan` e as variáveis `MAX_LARGE_PLAN_FILES`, `MAX_LARGE_PLAN_STEPS` e `MAX_FILES_PER_CONTEXT_BATCH`.
- Os scripts Windows já definem limites conservadores para geração grande.
- O workflow `.github/workflows/node-test.yml` ainda não explicitava essas três variáveis no ambiente do teste, embora o código tenha fallback seguro.
- Não foram encontrados PRs recentes do usuário no repositório pela consulta disponível.
- Não foi identificado registro claro do Claude Agent nesta execução.

## Decisão tomada

Foi feita uma melhoria pequena e reversível: alinhar o workflow de CI aos mesmos limites conservadores de geração grande usados nos scripts Windows e descritos no README.

Essa alteração reduz diferença entre validação local Windows e GitHub Actions, sem alterar comportamento de produção e sem adicionar dependências.

## Arquivos alterados/criados

- Alterado: `.github/workflows/node-test.yml`
  - adicionadas as variáveis:
    - `MAX_LARGE_PLAN_FILES: 50`;
    - `MAX_LARGE_PLAN_STEPS: 20`;
    - `MAX_FILES_PER_CONTEXT_BATCH: 4`.

- Criado: `PROJECT_MEMORY_RUN_2026-06-30_CI_LARGE_LIMIT_ALIGNMENT.md`
  - registra análise, decisão, arquivos, validação, riscos e próximos passos.

## Validação executada

- Revisão estática via conector GitHub.
- Não foi executado `npm test` localmente neste ambiente.
- A alteração é restrita ao ambiente do workflow e usa valores já compatíveis com `src/config.js`, README e scripts Windows.

## Riscos

- Baixo risco.
- Não altera código de runtime.
- Não muda endpoints.
- Não chama Ollama.
- Não baixa modelos.
- Não executa código gerado pelo usuário.

## Pendências

- Confirmar GitHub Actions verde no commit final.
- Rodar `npm test` em Node.js 20+ quando possível.
- Testar manualmente em Windows com 8 GB de RAM usando `npm run start:windows`.

## Próximos passos seguros

1. Confirmar status/checks do commit final.
2. Se CI estiver verde, atualizar documentação de prontidão para registrar CI alinhado com geração grande.
3. Como melhoria futura pós-MVP, criar exemplos mínimos de cliente para consumir `/api/generate-stream` e `/api/large-code-plan`.
