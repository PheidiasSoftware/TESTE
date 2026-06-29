# PROJECT MEMORY - 2026-06-29 - Request limit alignment

## Data/hora

2026-06-29 10:37 America/Sao_Paulo.

## Avaliação inicial obrigatória

Antes de qualquer alteração, o repositório `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub.

Arquivos e áreas verificados:

- `README.md`
- `package.json`
- `.github/workflows/node-test.yml`
- `docs/backend-mvp-status.md`
- `docs/local-validation.md`
- `src/server.js`
- `src/config.js`
- `scripts/test-windows.ps1`
- `scripts/start-windows.ps1`
- `test/config.test.js`
- issues abertas
- PRs abertos
- histórico recente de commits pesquisável pelo conector
- busca por registros claros de Claude Agent, `memory` e `PROJECT_MEMORY`

## Estado encontrado

- O projeto continua como backend Node.js 20+ sem dependências pesadas.
- O README descreve backend local para LLM/SLM de programação em PC fraco com Windows, 8 GB RAM e sem GPU.
- O backend usa Ollama local como runtime inicial e mantém API local em `127.0.0.1:3131`.
- Não havia issues abertas relevantes pelo conector.
- Não havia PRs abertos pelo conector.
- Não foram encontrados registros claros de Claude Agent nesta execução.
- `src/server.js` ainda concentra roteamento/handlers, mas já usa módulos auxiliares para cache, config, fila, HTTP, logger, Ollama, arquivos do projeto e rate limit.
- `src/config.js` já define padrões conservadores para `MAX_BODY_BYTES=65536` e `REQUEST_TIMEOUT_MS=120000`.
- Os helpers Windows e a CI ainda não fixavam explicitamente esses dois limites no ambiente, enquanto já fixavam fila, cache, contexto, rate limit, proxy e logs.

## Decisão tomada

Como a validação objetiva por `npm test`, `npm run test:windows` ou CI verde ainda estava pendente, a decisão segura foi não refatorar `src/server.js` e não adicionar recursos grandes.

A melhoria incremental escolhida foi alinhar explicitamente os limites de payload e timeout nos helpers Windows e no workflow de CI:

- `MAX_BODY_BYTES=65536`
- `REQUEST_TIMEOUT_MS=120000`

Essa mudança reduz variação operacional entre teste offline, start local e CI, sem alterar comportamento interno do servidor e sem adicionar dependências.

## Arquivos alterados/criados

Alterados:

- `scripts/test-windows.ps1`
  - Define `MAX_BODY_BYTES` e `REQUEST_TIMEOUT_MS` quando não informados.
  - Imprime os valores durante a validação offline.

- `scripts/start-windows.ps1`
  - Define `MAX_BODY_BYTES` e `REQUEST_TIMEOUT_MS` quando não informados.
  - Imprime os valores antes de iniciar o backend.

- `.github/workflows/node-test.yml`
  - Adiciona `MAX_BODY_BYTES=65536` e `REQUEST_TIMEOUT_MS=120000` no ambiente do job de teste offline.

- `docs/local-validation.md`
  - Documenta o alinhamento dos limites entre CI, `npm run test:windows` e `npm run start:windows`.

- `docs/backend-mvp-status.md`
  - Registra a execução, os arquivos lidos, a decisão tomada e a nova cobertura operacional dos limites.

Criado:

- `PROJECT_MEMORY_RUN_2026-06-29_REQUEST_LIMIT_ALIGNMENT.md`

## Validações executadas

Validações realizadas via inspeção estática pelo conector GitHub:

- Leitura de documentação principal.
- Leitura de configuração do projeto.
- Leitura de workflow de CI.
- Leitura de scripts Windows.
- Leitura parcial de backend e testes de configuração.
- Consulta de issues e PRs abertos.
- Busca por registros claros de Claude Agent.

Validação não executada:

- `npm test`
- `npm run test:windows`
- `npm run start:windows`
- teste real com Ollama

Motivo: o ambiente desta execução não forneceu checkout local executável para rodar comandos do repositório. A próxima evidência deve vir da CI ou de execução local em checkout limpo.

## Riscos

- Sem evidência objetiva de CI verde para o commit mais recente desta execução.
- `src/server.js` ainda tem responsabilidade alta; refatorações devem aguardar validação.
- Uso real de geração depende de Ollama instalado e modelo pequeno disponível.
- PCs fracos podem ter latência alta; manter concorrência 1, fila pequena e contexto limitado.

## Pendências

1. Confirmar CI verde no commit mais recente.
2. Executar `npm test` ou `npm run test:windows` em checkout limpo.
3. Confirmar `npm run start:windows` em Windows com Node.js 20+.
4. Se houver Ollama, testar geração real com `qwen2.5-coder:1.5b-instruct`.

## Próximos passos seguros

1. Se CI/testes estiverem verdes, registrar o backend como MVP funcional completo.
2. Depois disso, extrair roteamento/handlers de `src/server.js` em alteração pequena e com testes.
3. Manter novas melhorias como hardening pós-MVP, não como requisito para o MVP inicial.

## Compatibilidade com Claude Agent

Nenhum registro claro de Claude Agent foi encontrado nesta execução. O arquivo de memória foi criado para preservar estado e orientar qualquer agente futuro, incluindo Claude Agent se ele atuar no repositório depois.
