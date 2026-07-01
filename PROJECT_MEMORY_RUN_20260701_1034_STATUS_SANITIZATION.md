# PROJECT_MEMORY_RUN_20260701_1034_STATUS_SANITIZATION

## Data/hora

2026-07-01 10:34 America/Sao_Paulo

## Avaliação inicial do repositório

Arquivos e áreas examinadas antes de alterar:

- `README.md`: confirma backend leve para LLM/SLM local de programação, Windows/Linux, Node.js 20+, Ollama local, PC com 8 GB RAM e sem GPU; documenta endpoints, scripts, testes, cache, fila, rate limit, leitura segura de arquivos e guias técnicos.
- `package.json`: projeto Node.js ESM, sem dependências externas; scripts `start`, `start:windows`, `dev`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: servidor HTTP nativo, fila conservadora, cache, rate limit, leitura segura de arquivos, detecção de tarefas grandes, SSE, status sanitizado e integração com Ollama.
- `src/config.js`: defaults conservadores, normalização de host local, porta, modelo, `OLLAMA_URL`, limites numéricos e flags booleanas.
- `src/ollama.js`: payload conservador, sanitização de opções, tratamento seguro de erros upstream, normalização de respostas e leitura JSONL em streaming.
- `src/cache.js`: cache em memória limitado, grava apenas respostas completas com `done: true`.
- `test/ollama.test.js`, `test/config.test.js`, `test/server.test.js`: cobertura offline ampla de payload Ollama, erros seguros, streaming, configuração, rotas e contrato público.
- `.github/workflows/node-test.yml`: CI leve com Node.js 20 e `npm test`, sem instalar Ollama nem baixar modelos.
- `PROJECT_MEMORY.md`: histórico extenso de execuções incrementais.
- `docs/local-ollama-security.md`: orientação para manter Ollama local e não vazar prompts/código.

Também foram verificadas buscas de issues abertas relacionadas a Claude/backend/Ollama/memory e commits recentes relacionados a Ollama. Não foram encontrados issues/PRs abertos ou registros conflitantes do Claude Agent nesta execução.

## Decisão tomada

A próxima melhoria segura e reversível foi reforçar o contrato de status sanitizado com teste offline dedicado. O objetivo é evitar regressão futura que exponha `OLLAMA_URL`, porta interna do Ollama ou `PROJECT_ROOT` em `GET /health` e `GET /api/status`.

Essa melhoria foi escolhida porque:

- preserva o foco backend/API;
- aumenta segurança sem alterar contrato funcional;
- não adiciona dependências;
- não chama Ollama;
- não executa código gerado por usuário;
- é pequena, objetiva e fácil de reverter.

## Arquivos alterados/criados

- `test/status-sanitization-contract.test.js`
  - Criado teste offline para `GET /health`.
  - Criado teste offline para `GET /api/status`.
  - Valida que `body.ollama.endpoint` permanece `redacted`.
  - Valida ausência de `ollamaUrl`, `OLLAMA_URL`, `projectRoot`, `11434` e `PROJECT_ROOT` no corpo serializado.

- `PROJECT_MEMORY_RUN_20260701_1034_STATUS_SANITIZATION.md`
  - Criado este registro de execução.

## Validações executadas

- Revisão estática dos testes criados.
- Conferido que os testes usam apenas módulos nativos do Node.js: `node:test`, `node:assert/strict`, servidor HTTP exportado e `fetch` global.
- Conferido que os testes não chamam `/api/generate` nem Ollama.
- Conferido que não há novas dependências.

Não foi possível executar `npm test` diretamente neste ambiente de conector. A validação final deve ocorrer localmente ou via GitHub Actions.

## Riscos

- Baixo risco: alteração apenas adiciona testes.
- O teste verifica ausência da porta `11434` no JSON serializado; se no futuro o backend decidir expor uma métrica pública legítima que contenha essa porta, o teste precisará ser ajustado de forma consciente.

## Pendências

1. Aguardar/consultar GitHub Actions no commit desta execução.
2. Executar `npm test` localmente no Windows com Node.js 20+.
3. Continuar melhorias pequenas em segurança de status, streaming, cache, fila, documentação e experiência Windows.
4. Quando o backend for considerado completo para MVP, consolidar critérios em `docs/backend-mvp-status.md` e registrar o que dependerá de frontend/decisão do usuário.

## Próximo passo sugerido

Na próxima execução segura, priorizar uma das opções:

- ampliar documentação de uso do `/api/status` para clientes locais;
- testar contrato de erro SSE em rota de streaming;
- revisar se o README já referencia todos os guias técnicos novos;
- consultar checks do commit mais recente antes de alterar código.
