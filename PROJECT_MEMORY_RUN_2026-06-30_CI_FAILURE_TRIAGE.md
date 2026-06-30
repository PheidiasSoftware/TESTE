# Project memory - CI failure triage

## Data/hora

2026-06-30 America/Sao_Paulo

## Avaliacao inicial do repositorio

Antes de alterar qualquer arquivo, foram examinados:

- metadados do repositorio `PheidiasSoftware/TESTE`;
- `package.json`;
- `.github/workflows/node-test.yml`;
- `src/server.js`;
- `src/config.js`;
- `src/project-files.js`;
- `src/rate-limit.js`;
- `test/server.test.js`;
- `test/config.test.js`;
- `test/project-files.test.js`;
- `test/rate-limit.test.js`;
- PRs abertos retornados pelo conector.

Resumo encontrado:

- O workflow estava rodando `npm test` em Node.js 20.
- A captura enviada mostrava falha em `npm test` e um warning separado sobre actions baseadas em Node.js 20.
- O warning de Node.js 20 deprecated nao prova a falha; a causa real esta no log detalhado da etapa `Run tests`.
- O `package.json` continua simples, sem dependencias externas pesadas, e usa `node --test`.
- O backend ja possui testes de servidor, configuracao, leitura segura de arquivos e rate limit.
- Nenhum PR aberto foi retornado pelo conector.
- Nao foi encontrado registro claro do Claude Agent nesta verificacao.

## Decisao tomada

A acao mais segura foi melhorar o workflow de CI para tornar a proxima falha diagnosticavel e reduzir interferencia de rate limit nas rotas HTTP durante os testes integrados.

## Arquivos alterados/criados

### Alterados

- `.github/workflows/node-test.yml`
  - adicionada etapa `Print runtime versions`;
  - `npm test` agora roda com `--test-reporter=spec`;
  - adicionados `CI=true`, `NO_COLOR=1` e `NODE_OPTIONS=--enable-source-maps`;
  - `ENABLE_RATE_LIMIT=false` apenas no CI;
  - `RATE_LIMIT_MAX_REQUESTS=1000` no CI.

### Criados

- `docs/ci-failure-triage-2026-06-30.md`
- `PROJECT_MEMORY_RUN_2026-06-30_CI_FAILURE_TRIAGE.md`

## Validacoes executadas

- Repositorio lido via conector GitHub.
- Arquivos principais e testes relevantes examinados via conector GitHub.
- Nao foi possivel executar `npm test` localmente porque o ambiente nao resolve `github.com` para clone direto.

## Riscos

- A mudanca e pequena, reversivel e restrita ao CI/documentacao.
- Nao altera backend de runtime.
- Nao chama Ollama.
- Nao executa codigo do usuario.
- Se a falha real for de sintaxe ou contrato de teste, o CI continuara falhando, mas agora com log mais claro.

## Pendencias

- Verificar o novo run do GitHub Actions apos o commit.
- Se continuar vermelho, abrir o step `Run tests` e usar o nome exato do teste com falha para corrigir o codigo.
