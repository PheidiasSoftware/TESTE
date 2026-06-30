# PROJECT MEMORY RUN - 2026-06-30 - API smoke tests offline

## Data/hora

2026-06-30 20:19 America/Sao_Paulo.

## Avaliacao inicial do repositorio

Antes de alterar qualquer arquivo, o repositorio `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub.

Arquivos e areas analisadas:

- `README.md`: confirma objetivo do backend leve para LLM/SLM local de programacao em PC fraco com Windows, 8 GB de RAM e sem GPU; documenta Ollama, scripts Windows, endpoints, variaveis de ambiente e testes offline.
- `package.json`: projeto Node.js 20+, sem dependencias externas, scripts `start`, `start:windows`, `dev`, `test` e `test:windows`.
- `src/server.js`: backend HTTP nativo com health/status, geracao, streaming SSE, leitura segura de arquivos, planejamento grande, fila, cache, rate limit, logging e sanitizacao publica.
- `src/config.js`: limites conservadores, parsing seguro de variaveis de ambiente, normalizacao de host, porta, modelo, Ollama URL, extensoes permitidas e flags booleanas.
- `src/http.js`: helpers JSON/SSE, headers de seguranca e leitura de corpo JSON com tratamento de payload grande, JSON invalido e cliente encerrado.
- `test/server.test.js`, `test/http.test.js` e `test/config.test.js`: cobertura offline para contrato publico, seguranca, configuracao conservadora, leitura segura, fila, cache, streaming e geracao grande sem chamar Ollama.
- `docs/api-contract.md`, `docs/local-validation.md` e `docs/backend-mvp-status.md`: contrato da API, guia de validacao local e status do MVP.
- Issues/PRs/commits recentes: busca por issues abertas com termos relacionados a backend/Ollama/Claude nao retornou resultados. Commits recentes indicam varias execucoes incrementais focadas em status de MVP, validacao, seguranca e documentacao.

Nao foram encontrados registros claros de Claude Agent, branches, PRs ou issues abertas exigindo coordenacao adicional nesta execucao.

## Decisao tomada

Como o status do MVP recomenda evitar refatoracoes amplas sem evidencia objetiva de `npm test`/CI verde, a melhoria segura escolhida foi documental: criar um guia de smoke tests HTTP offline para validar o contrato da API em ambiente Windows fraco, sem Ollama e sem executar codigo gerado.

Essa mudanca e pequena, reversivel e nao altera runtime, dependencias ou comportamento de producao.

## Arquivos criados

- `docs/api-smoke-tests.md`: guia pratico com comandos PowerShell para validar `/health`, `/api/status`, rejeicao de `Content-Type` nao JSON, JSON invalido, task ausente, sugestao de `large-code-plan`, plano incremental offline, metodo incorreto `405` e leitura insegura `403`.
- `PROJECT_MEMORY_RUN_2026-06-30_API_SMOKE_TESTS.md`: este registro de memoria/estado.

## Validacoes executadas

- Revisao estatica dos arquivos principais e documentos existentes pelo conector GitHub.
- Confirmado que `docs/api-smoke-tests.md` nao existia antes da criacao.
- `npm test` nao foi executado neste ambiente.
- Nenhum codigo gerado por usuario foi executado.
- Nenhuma dependencia foi adicionada.
- Nenhum segredo foi lido ou exposto.

## Riscos

- O guia e documental; pode conter comandos que ainda precisam ser testados manualmente em PowerShell real.
- A ausencia de checks/CI visiveis para o commit nao prova sucesso nem falha.
- Como nao houve checkout local, a validacao ficou limitada a revisao estatica via conector.

## Pendencias

- Executar `npm test` ou `npm run test:windows` em checkout limpo.
- Confirmar CI verde no commit mais recente.
- Opcionalmente testar `docs/api-smoke-tests.md` em Windows 10/11 com Node.js 20+.
- Atualizar `README.md` com link para `docs/api-smoke-tests.md` em uma execucao futura, se desejado.

## Proximos passos seguros

1. Confirmar checks do commit mais recente ou rodar testes localmente.
2. Se houver evidencia verde, considerar pequena extracao de helper em `src/server.js` somente com teste correspondente.
3. Se ainda nao houver evidencia de testes, continuar preferindo documentacao, cobertura isolada ou ajustes pequenos de contrato.

## Criterios de MVP observados

O backend ja possui API local, integracao com Ollama, streaming SSE, fila conservadora, cache em memoria, leitura segura de arquivos, deteccao de tarefa grande, planejamento incremental, rate limit, logs estruturados, validacao de entrada, scripts Windows e documentacao. A pendencia principal continua sendo evidencia objetiva de testes/checks verdes no estado atual.
