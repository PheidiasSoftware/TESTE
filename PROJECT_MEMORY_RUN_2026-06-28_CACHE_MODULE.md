# Project memory - cache module

Data/hora: 2026-06-28 15:38 America/Sao_Paulo

## Avaliação inicial do repositório

Antes de alterar arquivos, foram examinados:

- `README.md`: confirma objetivo do backend local leve para programação, Node.js 20+, Windows, 8 GB RAM, sem GPU, Ollama local, endpoints atuais, CI e documentação técnica.
- `package.json`: confirma projeto Node.js ESM, `src/server.js` como entrada, scripts `start`, `start:windows`, `dev` e `test`, sem dependências externas.
- Issues e PRs pelo conector GitHub: não foram encontrados PRs recentes nem issues abertas relevantes.
- Busca por registros do Claude Agent/memória: não foram encontrados registros explícitos do Claude Agent pelo conector nesta execução.
- `src/server.js`: ainda concentra funções internas de cache, HTTP, Ollama, fila, leitura segura e handlers HTTP.
- `src/http.js`: já existe módulo testável para JSON, SSE e leitura de body com limite.
- `src/ollama.js`: já existe módulo testável para payload e parsing de streaming Ollama.
- `docs/backend-mvp-status.md`: indicava como próximas tarefas seguras integrar módulos auxiliares e extrair cache/fila/leitura segura.

## Decisão tomada

A decisão segura desta execução foi extrair o cache de prompt para módulo próprio e criar testes isolados, sem mexer ainda em `src/server.js`.

Motivo: `src/server.js` é arquivo crítico e já possui responsabilidade alta. Criar o módulo e testes primeiro é uma alteração pequena, reversível e compatível com o caminho de modularização gradual.

## Arquivos criados

- `src/cache.js`
  - Exporta `createPromptCache`.
  - Mantém cache em memória por hash SHA-256 do prompt.
  - Mantém política LRU simples removendo a entrada mais antiga quando excede `maxEntries`.
  - Mantém métricas de hits, misses, writes e evictions.
  - Inclui `clear()` para facilitar testes e futura manutenção.

- `test/cache.test.js`
  - Testa armazenamento e recuperação por hash sem expor prompt.
  - Testa cache desativado e miss em cache vazio.
  - Testa limite LRU para previsibilidade de memória em PC fraco.
  - Testa `clear()` sem zerar métricas.

## Arquivos alterados

- `docs/backend-mvp-status.md`
  - Atualizado para registrar `src/cache.js` como módulo auxiliar existente.
  - Atualizado para indicar que falta integrar `src/cache.js` em `src/server.js`.
  - Próximos passos reorganizados para priorizar integração gradual de `src/ollama.js`, `src/http.js` e `src/cache.js`.

## Validações executadas

- Validação estrutural via leitura dos arquivos pelo conector GitHub.
- Não foi possível executar `npm test` diretamente pelo conector GitHub nesta execução.
- Os testes foram escritos com `node:test` e `node:assert/strict`, sem dependências externas e sem chamar Ollama.

## Riscos

- `src/cache.js` ainda não está integrado ao servidor, então existe duplicação temporária com `createPromptCache` em `src/server.js`.
- Integração futura deve preservar exatamente o formato atual de `/health`, `/api/status`, `/api/generate` e `/api/generate-stream`.
- CI pode apontar ajuste fino caso algum teste existente dependa de detalhes internos não observados nesta execução.

## Compatibilidade com Claude Agent

- Nenhum arquivo explícito do Claude Agent foi encontrado nesta execução.
- A alteração é incremental e documentada para que Claude Agent ou outro agente consiga continuar sem conflito.

## Próximos passos seguros

1. Validar `npm test` localmente ou pela CI.
2. Integrar `src/cache.js` no `src/server.js` removendo a função interna duplicada em alteração pequena.
3. Integrar `src/ollama.js` no `src/server.js`, preservando payload e parsing atuais.
4. Integrar `src/http.js` no `src/server.js`, preservando `MAX_BODY_BYTES`.
5. Extrair fila para `src/generation-queue.js` com testes próprios.
