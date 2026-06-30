# PROJECT MEMORY - 2026-06-30 - Client-aborted JSON body handling

## Data/hora

2026-06-30 04:38 America/Sao_Paulo.

## Avaliação inicial do repositório

Antes de alterar qualquer arquivo, o repositório `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub.

Arquivos e áreas verificados:

- `README.md`: confirma backend local leve para PC Windows fraco, 8 GB RAM, sem GPU, Node.js 20+, Ollama e modelo pequeno `qwen2.5-coder:1.5b-instruct`.
- `package.json`: projeto Node.js ESM sem dependências externas pesadas, scripts `start`, `start:windows`, `test`, `test:windows`.
- `src/server.js`: API local com `/health`, `/api/status`, `/api/generate`, `/api/generate-stream`, `/api/read-file`, fila, cache, rate limit, validação de `Content-Type` JSON e 405 para método incorreto.
- `src/http.js`: helpers HTTP/SSE e leitura de corpo JSON com limite de payload.
- `test/http.test.js`: testes unitários dos helpers HTTP.
- `docs/api-contract.md`: contrato HTTP local.
- `docs/backend-mvp-status.md`: estado do MVP e pendências.
- PRs recentes: nenhum retornado pelo conector.
- Issues abertas/busca por Claude Agent: sem registros relevantes retornados.

## Decisão tomada

A próxima tarefa segura e incremental foi melhorar a robustez de leitura de corpo JSON quando o cliente encerra a conexão antes do `end` da requisição.

Motivo:

- É melhoria de backend pequena, reversível e sem dependências.
- Ajuda clientes locais em Node.js, Flutter Desktop ou scripts Windows a lidar melhor com cancelamentos/interrupções.
- Evita confundir abortos de conexão com JSON inválido ou erro genérico.
- Mantém foco em segurança/performance para PC fraco.

## Arquivos alterados/criados

Alterados:

- `src/http.js`
  - Adicionado helper interno `createClientClosedError()`.
  - `readJsonBody()` agora rastreia `end` e trata eventos `aborted` e `close` antes do fim como erro `499` com `code='CLIENT_CLOSED_REQUEST'`.
  - Mantidos comportamentos existentes para JSON inválido (`400`) e payload grande (`413`).

- `test/http.test.js`
  - Adicionado mock de requisição abortada.
  - Adicionado teste para garantir erro `499 CLIENT_CLOSED_REQUEST` quando o cliente encerra a conexão antes do corpo completo.

- `docs/api-contract.md`
  - Documentado tratamento de encerramento prematuro do cliente como `499 CLIENT_CLOSED_REQUEST`.
  - Atualizada lista de erros e orientações de compatibilidade.

- `docs/backend-mvp-status.md`
  - Registrada a execução, análise inicial, decisão, arquivos alterados e novo critério atendido.

Criado:

- `PROJECT_MEMORY_RUN_2026-06-30_CLIENT_ABORTED_JSON_BODY.md`

## Validações executadas

Validação por inspeção via conector GitHub.

Não foi possível executar `npm test` ou `npm run test:windows` localmente neste ambiente. A pendência permanece confirmar a suíte no clone local ou pela CI.

## Riscos

- `499` é uma convenção usada para requisição encerrada pelo cliente, não um status HTTP padronizado pela IANA. Aqui ele é usado de forma local/interna para classificação previsível.
- Se a conexão já estiver encerrada, o cliente pode não receber corpo de erro; o principal benefício é diagnóstico e tratamento no servidor.
- A alteração é pequena, mas ainda precisa de validação objetiva com `npm test`/CI.

## Pendências

- Confirmar `npm test`, `npm run test:windows` ou CI verde no commit mais recente.
- Evitar refatorações amplas em `src/server.js` até validação objetiva.
- Considerar, em execução futura, cobertura de servidor para abortos reais de requisição HTTP se a suíte permitir simulação sem dependências.

## Próximos passos sugeridos

1. Confirmar CI ou teste local.
2. Revisar se os handlers de geração/stream devem evitar tentativa de `sendJson` quando a conexão já foi encerrada.
3. Manter melhorias pequenas e reversíveis voltadas a robustez HTTP, segurança de entrada e documentação.

## Compatibilidade com Claude Agent

Não foram encontrados registros claros de Claude Agent, branches, issues, PRs ou arquivos de estado dele nesta execução. A alteração foi documentada para permitir continuidade por outro agente.