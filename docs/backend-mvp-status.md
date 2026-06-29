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

Em execução posterior de 2026-06-29, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `.github/workflows/node-test.yml`, `docs/backend-mvp-status.md`, `docs/local-validation.md`, `src/server.js`, `src/config.js`, `scripts/test-windows.ps1`, `scripts/start-windows.ps1` e `test/config.test.js`; também foi consultada a lista de PRs recentes, sem resultados. Não foram encontrados registros claros do Claude Agent. A tentativa de checkout local continuou bloqueada pelo ambiente, então a alteração segura foi alinhar o helper de inicialização Windows ao helper de teste: `scripts/start-windows.ps1` agora valida raiz do repositório, exige Node.js 20+, define explicitamente padrões conservadores de ambiente e imprime a versão do Node antes de iniciar o backend.

Em execução posterior de 2026-06-29, o repositório foi reexaminado antes de alterações. Foram lidos `README.md`, `package.json`, `.github/workflows/node-test.yml`, `docs/backend-mvp-status.md`, `docs/local-validation.md`, `src/server.js`, `src/config.js`, `scripts/test-windows.ps1`, `scripts/start-windows.ps1` e `test/config.test.js`; issues e PRs abertos foram consultados e não retornaram resultados; a busca por registros claros de Claude Agent também não retornou resultados. A alteração segura foi alinhar explicitamente `MAX_BODY_BYTES=65536` e `REQUEST_TIMEOUT_MS=120000` nos helpers Windows e na CI, reduzindo variação operacional entre teste offline, start local e workflow remoto sem mexer no roteamento do backend.

Até a confirmação objetiva de `npm test`, `npm run test:windows` ou CI verde, a recomendação é não adicionar recursos grandes nem fazer refatorações amplas em `src/server.js`.

## Critérios atendidos

- Projeto Node.js 20+ sem dependências externas pesadas.
- Servidor HTTP nativo escutando `127.0.0.1` por padrão.
- `GET /health` para diagnóstico básico.
- `GET /api/status` para métricas locais.
- `POST /api/generate` para geração via Ollama.
- `POST /api/generate-stream` com Server-Sent Events.
- `POST /api/read-file` para leitura segura de arquivos textuais pequenos.
- Fila simples de geração com concorrência conservadora.
- Cache em memória por hash de prompt integrado via `src/cache.js`.
- Leitura segura de arquivos textuais pequenos com allowlist e bloqueio de caminhos sensíveis.
- `contextFiles` em `/api/generate` reutilizando a leitura segura.
- Rate limit local em memória nas rotas pesadas.
- Logs estruturados em JSON Lines com redaction de campos sensíveis.
- Script PowerShell para início conservador no Windows, com checagem de raiz do repositório, Node.js 20+, padrões locais explícitos e verificação leve do Ollama antes do start.
- Script PowerShell `scripts/test-windows.ps1` para validação offline conservadora no Windows via `npm run test:windows`, incluindo checagem de raiz do repositório e Node.js 20+.
- Helpers Windows e CI agora fixam explicitamente `MAX_BODY_BYTES=65536` e `REQUEST_TIMEOUT_MS=120000`, além dos limites conservadores de fila, contexto, cache, rate limit, proxy e logs.
- Testes com `node --test` sem chamar Ollama.
- CI leve com Node.js 20 e ambiente offline alinhado ao helper Windows para rate limit, proxy confiável desativado e logs silenciosos.
- Documentação de arquitetura, contrato da API local, streaming, rate limit, modelos leves, integração de clientes, validação local e revisão de prontidão do MVP.
- README principal com links para arquitetura, contrato da API, status do MVP, revisão de prontidão, streaming, rate limit, seleção de modelos, integração de clientes e validação local.
- Helpers de cliente Ollama em `src/ollama.js` para montagem de payload, parse de JSONL streaming, chamada não-streaming e leitura de stream, com testes isolados por `fetchImpl` fake.
- `src/server.js` integrado ao cliente Ollama de `src/ollama.js`, removendo duplicação direta de payload/parsing de streaming no servidor.
- `src/server.js` integrado aos helpers HTTP de `src/http.js` para JSON, SSE e leitura de corpo com `MAX_BODY_BYTES`, reduzindo duplicação local.
- Fila de geração extraída para `src/generation-queue.js`, com testes próprios para limite de fila, concorrência conservadora, falhas, configuração inválida e job inválido.
- `src/server.js` integrado ao módulo `src/generation-queue.js`, mantendo reexport para compatibilidade com testes existentes.
- Leitura segura de arquivos e montagem de contexto extraídas para `src/project-files.js`, com testes próprios para caminho seguro, bloqueios, limite de tamanho, contexto por arquivos e entradas inválidas.
- `src/server.js` integrado ao módulo `src/project-files.js`, mantendo reexports para compatibilidade com testes existentes.
- Logging estruturado extraído para `src/logger.js`, com testes próprios para redaction, truncamento conservador, níveis de log e modo `silent`.
- `src/server.js` integrado ao módulo `src/logger.js`, mantendo reexports para compatibilidade com testes e uso técnico futuro.
- Guia `docs/local-validation.md` criado para validação mínima sem Ollama, health/status, entrada inválida, leitura segura, teste opcional com Ollama e checklist antes de novas mudanças no backend.
- Guia `docs/local-validation.md` ampliado com validação por CI leve, critérios mínimos para continuar refatorando `src/server.js` e orientação para tratar ausência de checks como ausência de evidência, não como falha.
- Guia `docs/local-validation.md` atualizado com `npm run test:windows` como alternativa Windows para validação offline, incluindo checagem de raiz do repositório e Node.js 20+.
- Guia `docs/local-validation.md` atualizado com o comportamento endurecido de `npm run start:windows`, incluindo checagem de raiz do repositório, Node.js 20+ e padrões explícitos antes do start.
- Guia `docs/local-validation.md` atualizado com alinhamento explícito de limites de payload e timeout entre CI, `npm run test:windows` e `npm run start:windows`.
- Guia `docs/mvp-readiness-review.md` criado para registrar critérios de MVP atendidos, pendências de validação e fronteiras de escopo.
- `test/server.test.js` agora valida contrato público mínimo de `logging` e `rateLimit` em `GET /health` e `GET /api/status`, reduzindo risco de regressão nos campos usados por clientes locais.
- `src/rate-limit.js` agora expõe `trackedClients` no status público, preservando `activeClients` como alias de compatibilidade; `test/rate-limit.test.js` cobre essa compatibilidade.
- Verificação operacional do commit `f45af224071e6b633954b199072b12d370546f4e` registrada: sem status/CI disponível pelo conector no momento da consulta, mantendo validação final como pendência explícita.

## Critérios parcialmente atendidos

- Modularização: já existem módulos auxiliares como `src/config.js`, `src/http.js`, `src/rate-limit.js`, `src/ollama.js`, `src/cache.js`, `src/generation-queue.js`, `src/project-files.js` e `src/logger.js`, mas `src/server.js` ainda concentra roteamento, handlers HTTP e composição de resposta.
- Cliente Ollama: `src/ollama.js` está integrado ao servidor; falta apenas validação final por `npm test`/CI após a alteração.
- Helpers HTTP: `src/http.js` está integrado ao servidor; falta apenas validação final por `npm test`/CI após a alteração.
- Cache: `src/cache.js` está integrado ao servidor e mantém testes próprios; manter este item sob observação apenas para validação de CI/local após mudanças no `src/server.js`.
- Fila de geração: `src/generation-queue.js` está integrada ao servidor; falta validação final por `npm test`/CI após a extração.
- Leitura segura: `src/project-files.js` está integrada ao servidor; falta validação final por `npm test`/CI após a extração.
- Logging: `src/logger.js` está integrado ao módulo `src/logger.js`; falta validação final por `npm test`/CI após a extração.
- Validação local: existe guia documentado em `docs/local-validation.md` e helpers `npm run test:windows`/`npm run start:windows`, mas ainda é necessário executar `npm test`, `npm run test:windows` ou confirmar CI verde.
- Testes de contrato público: cobertura de `logging` e `rateLimit` foi adicionada; foi corrigida a compatibilidade do campo `trackedClients`, mas ainda precisa de validação por `npm test`/CI.
- CI/status remoto: a CI agora possui ambiente de teste mais completo, mas ainda é necessário confirmar execução verde no commit mais recente.

## Não faz parte do MVP backend

- Frontend completo.
- Execução automática de código gerado.
- Sandbox de execução de código.
- Treinamento ou fine-tuning de modelo.
- Download automático de modelos grandes.
- Banco de dados, Redis ou fila persistente.
- Exposição pública da API por padrão.

## Riscos atuais

- `src/server.js` ainda tem responsabilidade alta; alterações grandes nesse arquivo aumentam risco de regressão.
- A validação final de `npm test` depende de execução local ou CI, pois o conector GitHub não executa os testes diretamente.
- O ambiente usado nas últimas execuções bloqueou checkout local do repositório, então não houve como executar `npm test` fora do GitHub Actions.
- Ainda não existe evidência objetiva de CI verde para o commit mais recente desta execução.
- Uso real depende do Ollama instalado, rodando e com modelo leve disponível.
- Em CPU fraca, respostas podem ser lentas; os limites padrão devem continuar conservadores.

## Próximas tarefas seguras recomendadas

1. Confirmar CI verde no GitHub Actions para o commit mais recente.
2. Executar o checklist de `docs/local-validation.md`, começando por `npm test` ou `npm run test:windows` sem Ollama.
3. Se testes/CI estiverem verdes, registrar o backend como MVP funcional completo.
4. Só depois disso extrair roteamento/handlers para módulo dedicado, em alteração pequena.
5. Em seguida, tratar melhorias adicionais como hardening pós-MVP, não como requisito para o MVP inicial.

## Decisão operacional

O backend está funcionalmente pronto para o MVP em termos de implementação e documentação. A prioridade agora é validação objetiva, redução de risco técnico e preservação da compatibilidade com agentes futuros, incluindo Claude Agent se aparecerem registros dele no repositório.
