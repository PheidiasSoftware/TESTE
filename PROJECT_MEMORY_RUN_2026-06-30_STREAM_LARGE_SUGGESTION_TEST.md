# Project memory - stream large suggestion test

## Data/hora

2026-06-30 16:34 America/Sao_Paulo

## Pedido

Execucao recorrente para evoluir o backend do repositorio `PheidiasSoftware/TESTE` como uma LLM/SLM local leve para programacao, adequada a Windows, 8 GB de RAM e sem GPU, com foco em backend, API, seguranca, performance, testes e documentacao.

## Avaliacao inicial do repositorio

Antes de alterar arquivos, foram examinados:

- metadados do repositorio `PheidiasSoftware/TESTE`;
- `README.md`;
- `package.json`;
- `.github/workflows/node-test.yml`;
- `src/server.js`;
- `src/large-code.js`;
- `src/config.js`;
- `test/server.test.js`;
- `test/large-code.test.js`;
- `docs/backend-mvp-status.md`;
- issues abertas e buscas por possiveis registros de Claude Agent.

O backend ja possui API local, leitura segura de arquivos, fila, cache, rate limit, streaming SSE, planejamento de geracao grande em etapas e deteccao automatica de tarefas grandes em `/api/generate` e `/api/generate-stream`.

Nao foram encontrados issues abertas nem registros claros do Claude Agent nesta execucao pelo conector disponivel.

## Decisao tomada

A melhoria segura escolhida foi adicionar cobertura de teste offline para garantir que `POST /api/generate-stream` tambem sugere `/api/large-code-plan` com JSON `422` antes de abrir SSE quando a tarefa parece grande demais.

Essa validacao reduz risco de cliente local receber um fluxo SSE quando deveria receber erro estruturado com sugestao de planejamento.

## Arquivos alterados/criados

- Alterado: `test/server.test.js`
  - extraido helper `assertLargeCodeSuggestion` para evitar duplicacao;
  - mantida cobertura existente de `POST /api/generate`;
  - adicionado teste de `POST /api/generate-stream` para tarefa grande, validando `422`, `Content-Type` JSON e `largeCodeSuggestion`.

- Criado: `PROJECT_MEMORY_RUN_2026-06-30_STREAM_LARGE_SUGGESTION_TEST.md`
  - registra analise, decisao, alteracoes, riscos e proximos passos.

## Validacao executada

Validacao estatica via leitura do repositorio e revisao do teste alterado pelo conector GitHub.

Nao foi executado `npm test` localmente neste ambiente. A validacao objetiva continua pendente por CI ou execucao local.

Comando recomendado:

```bash
npm test
```

No Windows:

```powershell
npm run test:windows
```

## Riscos

- Risco baixo: mudanca restrita a testes offline.
- Nao altera runtime, endpoints, limites de memoria ou integracao com Ollama.
- Nao adiciona dependencias.
- Nao executa codigo gerado pelo usuario.

## Pendencias

- Confirmar CI ou `npm test` local.
- Quando houver validacao verde, atualizar o status de prontidao do MVP se necessario.

## Proximos passos seguros

1. Aguardar ou consultar checks do commit final.
2. Adicionar, em execucao futura, teste de contrato para `forceSingleGeneration=true` bypassar a sugestao de plano sem chamar o Ollama quando possivel com mock ou camada isolada.
3. Evitar refatoracoes grandes em `src/server.js` ate existir CI verde ou validacao local confirmada.
