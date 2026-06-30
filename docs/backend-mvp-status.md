# Status do MVP backend

Registro técnico do estado atual do backend local do projeto `TESTE` para orientar próximas execuções, agentes e revisões.

## Escopo do MVP

O MVP backend deve permitir que um PC fraco com Windows, 8 GB de RAM e sem GPU rode uma API local para apoio a programação em Node.js, Flutter/Dart e MySQL usando modelo pequeno via runtime local, inicialmente Ollama.

O backend não deve executar automaticamente código informado pelo usuário ou gerado pelo modelo. O foco é geração/análise textual assistida, leitura segura de contexto do projeto e integração local por HTTP.

## Decisão de prontidão

Em 2026-06-29, foi criada a revisão `docs/mvp-readiness-review.md`.

A avaliação técnica é que o backend atende aos critérios funcionais do MVP por implementação e documentação. A única pendência antes de declarar estabilidade é confirmar `npm test` localmente ou CI verde após as extrações recentes.

Em verificação anterior de 2026-06-29, o commit conhecido `f45af224071e6b633954b199072b12d370546f4e` foi consultado pelo conector GitHub. O status combinado retornou sem checks registrados e a busca de workflow runs para o commit não retornou execuções, então a validação final continuou pendente.

Em nova execução de 2026-06-29, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `.github/workflows/node-test.yml`, `docs/backend-mvp-status.md`, `docs/local-validation.md`, `src/server.js`, `src/rate-limit.js` e `test/server.test.js`. Não foram encontrados PRs recentes ou issues abertas relevantes pelo conector, e a busca textual não retornou registros claros de Claude Agent. A tentativa de checkout local para rodar `npm test` foi bloqueada pelo ambiente de execução, então nenhuma refatoração de código foi feita. A alteração segura desta execução foi reforçar `docs/local-validation.md` com critérios de validação por CI leve e conduta quando não houver evidência de checks.

Em execução posterior de 2026-06-29, o repositório foi reexaminado novamente antes de alterações. Foram lidos `README.md`, `package.json`, `.github/workflows/node-test.yml`, `docs/backend-mvp-status.md`, `docs/local-validation.md`, `src/server.js`, `src/config.js`, `test/server.test.js` e `scripts/start-windows.ps1`. Não havia PRs recentes pelo conector. A decisão segura foi adicionar uma validação offline para Windows: `scripts/test-windows.ps1`, comando `npm run test:windows` e documentação correspondente. O script apenas roda a suíte offline com variáveis conservadoras; não chama Ollama, não baixa modelos e não executa código gerado.

Em execução posterior de 2026-06-29, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `.github/workflows/node-test.yml`, `docs/backend-mvp-status.md`, `docs/local-validation.md`, `src/server.js`, `src/config.js`, `scripts/test-windows.ps1` e `scripts/start-windows.ps1`. O conector não retornou PRs recentes e não foram encontrados registros claros do Claude Agent pela busca disponível. Como o checkout local continuou bloqueado, a decisão segura foi endurecer somente a validação offline Windows: `scripts/test-windows.ps1` agora verifica execução na raiz do repositório e Node.js 20+ antes de rodar `npm test`. `docs/local-validation.md` foi atualizado para refletir esse comportamento.

Em execução posterior de 2026-06-29, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `.github/workflows/node-test.yml`, `docs/backend-mvp-status.md`, `docs/local-validation.md`, `src/server.js`, `src/config.js` e `scripts/test-windows.ps1`; também foi consultada a lista de PRs recentes, sem resultados. Não foram encontrados registros claros do Claude Agent. A tentativa de checkout local foi bloqueada pelo ambiente, então a alteração segura foi alinhar `.github/workflows/node-test.yml` aos padrões conservadores do helper Windows, adicionando `ENABLE_RATE_LIMIT`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_MAX_CLIENTS`, `TRUST_PROXY` e `LOG_LEVEL=silent` ao ambiente de teste offline da CI.

Em execução posterior de 2026-06-29, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `.github/workflows/node-test.yml`, `docs/backend-mvp-status.md`, `docs/local-validation.md`, `src/server.js`, `src/config.js`, `test/server.test.js` e `scripts/start-windows.ps1`; também foi consultada a lista de PRs recentes, sem resultados. Não foram encontrados registros claros do Claude Agent. A tentativa de checkout local continuou bloqueada pelo ambiente, então a alteração segura foi alinhar o helper de inicialização Windows ao helper de teste: `scripts/start-windows.ps1` agora valida raiz do repositório, exige Node.js 20+, define explicitamente padrões conservadores de ambiente e imprime a versão do Node antes de iniciar o backend.

Em execução posterior de 2026-06-29, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `.github/workflows/node-test.yml`, `docs/backend-mvp-status.md`, `docs/local-validation.md`, `src/server.js`, `src/config.js`, `test/config.test.js`, `scripts/test-windows.ps1` e `scripts/start-windows.ps1`; issues e PRs abertos foram consultados e não retornaram resultados; a busca por registros claros de Claude Agent também não retornou resultados. A alteração segura foi alinhar explicitamente `MAX_BODY_BYTES=65536` e `REQUEST_TIMEOUT_MS=120000` nos helpers Windows e na CI, reduzindo variação operacional entre teste offline, start local e workflow remoto sem mexer no roteamento do backend.

Em execução posterior de 2026-06-29, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `.github/workflows/node-test.yml`, `docs/backend-mvp-status.md`, `docs/local-validation.md`, `src/server.js`, `src/config.js`, `test/config.test.js` e `scripts/test-windows.ps1`; também foi consultada a lista de PRs recentes, sem resultados. Não foram encontrados registros claros do Claude Agent. A alteração segura foi endurecer os helpers Windows para validar disponibilidade de comandos antes de executá-los: `scripts/test-windows.ps1` agora falha com mensagem clara se `node` ou `npm` não estiverem no PATH, e `scripts/start-windows.ps1` falha com mensagem clara se `node` não estiver no PATH. A documentação de validação local foi atualizada para registrar esse comportamento.

Em execução posterior de 2026-06-29, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `.github/workflows/node-test.yml`, `docs/backend-mvp-status.md`, `docs/local-validation.md`, `src/server.js`, `src/config.js`, `test/config.test.js` e `scripts/test-windows.ps1`; issues abertas e PRs recentes foram consultados e não retornaram resultados; a busca textual não encontrou registros claros do Claude Agent. A alteração segura foi endurecer o parsing de `PORT` em `src/config.js`: agora a porta só é aceita dentro do intervalo TCP válido `1..65535`, caindo para `3131` em valores inválidos. `test/config.test.js` recebeu cobertura para portas válidas, inválidas e fallback.

Em execução posterior de 2026-06-29, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `.github/workflows/node-test.yml`, `docs/backend-mvp-status.md`, `src/server.js`, `src/config.js`, `src/ollama.js`, `test/config.test.js` e `scripts/start-windows.ps1`; PRs recentes foram consultados, sem resultados; a busca textual não encontrou registros claros do Claude Agent. A alteração segura foi endurecer `OLLAMA_URL` em `src/config.js`: agora a URL é normalizada, aceita apenas `http`/`https`, remove query/hash e barras finais e retorna para `http://127.0.0.1:11434` em valores inválidos. `test/config.test.js` recebeu cobertura para esse parsing.

Em execução posterior de 2026-06-29, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `.github/workflows/node-test.yml`, `docs/backend-mvp-status.md`, `src/server.js`, `src/http.js`, `src/config.js`, `test/http.test.js` e `test/config.test.js`; issues e PRs abertos foram consultados e não retornaram resultados; a busca textual não encontrou registros claros do Claude Agent. A alteração segura foi endurecer `parseInteger` em `src/config.js` para aceitar somente inteiros completos e seguros, evitando que valores parciais como `65536x`, decimais ou notação científica sejam aceitos silenciosamente em limites de ambiente. `test/config.test.js` recebeu cobertura dedicada.

Em execução posterior de 2026-06-29, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `src/server.js`, `src/config.js`, `test/server.test.js`, `test/config.test.js`, `docs/backend-mvp-status.md` e registros de memória recentes; PRs recentes foram consultados, sem resultados; a busca textual não encontrou registros claros do Claude Agent. A alteração segura foi sanitizar o contrato público de `GET /health` e `GET /api/status`: os endpoints não expõem mais `PROJECT_ROOT` nem a URL real do Ollama, mantendo apenas `ollama.configured` e `ollama.endpoint=redacted`. `test/server.test.js` cobre a ausência de `ollamaUrl` e `fileRead.projectRoot` nos endpoints públicos.

Em execução de 2026-06-30, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `src/config.js`, `src/server.js`, `src/http.js`, `test/server.test.js`, `docs/api-contract.md`, `docs/backend-mvp-status.md`, issues/PRs abertos e commits recentes relacionados a configuração. Não foram encontrados issues/PRs abertos nem registros claros do Claude Agent. A alteração segura foi validar `Content-Type` JSON nas rotas `POST /api/generate`, `POST /api/generate-stream` e `POST /api/read-file` antes de ler o corpo, retornando `415` para media type não JSON. `test/server.test.js` recebeu cobertura para rejeição de `text/plain` e aceitação de `application/json; charset=utf-8`. `docs/api-contract.md` foi atualizado com a exigência.

Em execução posterior de 2026-06-30, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `src/server.js`, `src/config.js`, `src/project-files.js`, `test/server.test.js`, `docs/api-contract.md`, `docs/backend-mvp-status.md`, issues/PRs abertos e buscas por registros do Claude Agent. Não foram encontrados issues/PRs abertos nem registros claros do Claude Agent. A alteração segura foi melhorar o contrato HTTP para rotas conhecidas chamadas com método incorreto: o backend agora retorna `405 Method Not Allowed`, header `Allow` e campo `allowedMethods`, preservando `404` somente para rotas inexistentes. `test/server.test.js` recebeu cobertura para `GET /api/generate`, e `docs/api-contract.md` foi atualizado.

Em execução posterior de 2026-06-30, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `src/server.js`, `src/http.js`, `test/http.test.js`, `docs/api-contract.md`, `docs/backend-mvp-status.md`, PRs recentes e issues abertas/buscas por Claude Agent. Não foram encontrados PRs/issues abertos nem registros claros do Claude Agent. A alteração segura foi tornar `readJsonBody` resiliente a requisições encerradas pelo cliente antes do corpo completo, classificando o caso como `499 CLIENT_CLOSED_REQUEST` em vez de misturar com JSON inválido ou erro genérico. `test/http.test.js` recebeu cobertura para stream abortado e `docs/api-contract.md` foi atualizado.

Em execução posterior de 2026-06-30, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `.github/workflows/node-test.yml`, `src/server.js`, `src/config.js`, `src/logger.js`, `test/logger.test.js`, `docs/api-contract.md`, `docs/backend-mvp-status.md`, PRs/issues abertos, commits recentes e buscas por registros do Claude Agent. Não foram encontrados PRs/issues abertos nem registros claros do Claude Agent. A alteração segura foi ampliar a redaction de logs estruturados para campos operacionais locais (`projectRoot`, `ollamaUrl`, `baseUrl`) além de prompts/contexto/respostas, evitando registrar caminho absoluto do projeto e URL real do runtime local. `test/logger.test.js` recebeu cobertura dedicada e `docs/api-contract.md` foi atualizado.

Em execução posterior de 2026-06-30, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `src/server.js`, `src/config.js`, `test/server.test.js`, `docs/api-contract.md`, `docs/backend-mvp-status.md`, PRs/issues abertos e buscas por registros do Claude Agent. Não foram encontrados PRs/issues abertos nem registros claros do Claude Agent. A alteração segura foi parar de expor a raiz absoluta do projeto na saída de console de inicialização: `startServer()` agora usa `getStartupConsoleLines()`, que imprime `raiz=redacted` para leitura de arquivos. Foi criado `test/startup-console.test.js` para cobrir essa garantia sem chamar Ollama.

Até a confirmação objetiva de `npm test`, `npm run test:windows` ou CI verde, a recomendação é não adicionar recursos grandes nem fazer refatorações amplas em `src/server.js`.

## Critérios atendidos

- Projeto Node.js 20+ sem dependências externas pesadas.
- Servidor HTTP nativo escutando `127.0.0.1` por padrão.
- `GET /health` para diagnóstico básico com contrato público sanitizado, sem expor `PROJECT_ROOT` nem URL real do Ollama.
- `GET /api/status` para métricas locais com contrato público sanitizado, sem expor `PROJECT_ROOT` nem URL real do Ollama.
- Rotas conhecidas chamadas com método HTTP incorreto retornam `405`, header `Allow` e corpo JSON com `allowedMethods`.
- `POST /api/generate` para geração via Ollama, com validação de `Content-Type` JSON antes da leitura do corpo.
- `POST /api/generate-stream` com Server-Sent Events e validação de `Content-Type` JSON antes da leitura do corpo.
- `POST /api/read-file` para leitura segura de arquivos textuais pequenos, com validação de `Content-Type` JSON antes da leitura do corpo.
- Leitura de corpo JSON classifica encerramento prematuro do cliente como `499 CLIENT_CLOSED_REQUEST`, facilitando logs e tratamento previsível sem dependências externas.
- Fila simples de geração com concorrência conservadora.
- Cache em memória por hash de prompt integrado via `src/cache.js`.
- Leitura segura de arquivos textuais pequenos com allowlist e bloqueio de caminhos sensíveis.
- `contextFiles` em `/api/generate` reutilizando a leitura segura.
- Rate limit local em memória nas rotas pesadas.
- Logs estruturados em JSON Lines com redaction de campos sensíveis, incluindo prompt, contexto, resposta, conteúdo, URL real do runtime local e caminho absoluto do projeto.
- Saída de console de inicialização sem caminho absoluto do projeto; a linha de leitura de arquivos usa `raiz=redacted`.
- Script PowerShell para início conservador no Windows, com checagem de raiz do repositório, disponibilidade de `node`, Node.js 20+, padrões locais explícitos e verificação leve do Ollama antes do start.
- Script PowerShell `scripts/test-windows.ps1` para validação offline conservadora no Windows via `npm run test:windows`, incluindo checagem de raiz do repositório, disponibilidade de `node`/`npm` e Node.js 20+.
- Configuração de `HOST` endurecida para aceitar somente loopback local (`127.0.0.1`, `localhost`, `::1`).
- Configuração de `PORT` endurecida para aceitar somente portas TCP válidas entre `1` e `65535`, com fallback local seguro para `3131`.
- Configuração de `OLLAMA_URL` endurecida para aceitar somente URLs `http`/`https`, remover query/hash/barras finais e usar fallback local seguro em valores inválidos.
- Parsing de inteiros de ambiente endurecido para aceitar apenas inteiros completos e seguros, reduzindo risco de configuração ambígua em limites de payload, timeout, fila, cache, contexto e rate limit.
- Testes com `node --test` sem chamar Ollama.
- CI leve com Node.js 20 e ambiente offline alinhado ao helper Windows para rate limit, proxy confiável desativado e logs silenciosos.
- Documentação de arquitetura, contrato da API local, streaming, rate limit, modelos leves, integração de clientes, validação local e revisão de prontidão do MVP.
- README principal com links para arquitetura, contrato da API, status do MVP, revisão de prontidão, streaming, rate limit, seleção de modelos, integração de clientes e validação local.

## Pendências

- Confirmar `npm test`, `npm run test:windows` ou CI verde no commit mais recente.
- Evitar novas funcionalidades grandes até haver evidência objetiva de testes passando.
- Frontend/cliente visual ainda depende de decisão do usuário.
- Integração opcional com outros runtimes leves, como llama.cpp direto, ainda depende de decisão futura.
