# PROJECT MEMORY RUN - 2026-07-01 - Safe streaming empty body handling

## Data/hora

2026-07-01 03:35 America/Sao_Paulo.

## Avaliação inicial do repositório

Arquivos e áreas examinadas antes de alterar:

- `README.md`: confirma o objetivo do backend local para LLM/SLM de programação em PC fraco com Windows, 8 GB de RAM e sem GPU; documenta Node.js 20+, Ollama local, scripts Windows, testes offline, CI leve, endpoints, variáveis de ambiente e guias técnicos.
- `package.json`: projeto Node.js ESM sem dependências externas pesadas; scripts principais `start`, `start:windows`, `dev`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: backend HTTP local com API JSON/SSE, fila, cache, rate limit, leitura segura de arquivos, detecção de geração grande e status público.
- `src/ollama.js`: cliente Ollama com payload conservador, sanitização de opções, erros upstream seguros, geração normal e geração por streaming.
- `src/http.js`: helpers JSON/SSE com headers de segurança, limite de payload e validação de JSON objeto.
- `src/config.js`: limites conservadores de runtime, host local, modelo padrão pequeno e allowlist de extensões.
- `test/ollama.test.js`: testes offline cobrindo payload Ollama, sanitização, resposta não-streaming, JSONL de streaming e parsing final sem newline.
- `docs/streaming.md`: documentação do endpoint `POST /api/generate-stream` e decisões de segurança/performance.
- Busca por issues/PRs/registros Claude Agent: não foram encontrados resultados acessíveis/relevantes no conector para esta execução.

## Decisão tomada

Foi escolhida uma melhoria pequena, segura e reversível no cliente Ollama de streaming: tratar ausência de `response.body` como erro upstream seguro padronizado, em vez de lançar um erro genérico. Isso melhora a robustez da API para falhas inesperadas do runtime local sem expor detalhes internos ao cliente.

## Arquivos alterados/criados

- Alterado `src/ollama.js`:
  - `generateStream()` agora usa `createSafeUpstreamError('Runtime local não retornou corpo de streaming.')` quando o Ollama retorna sucesso HTTP mas sem corpo de streaming.
  - Mantém status `502`, `exposeDetail=false` e não expõe detalhe interno.
- Alterado `test/ollama.test.js`:
  - Adicionado teste offline para garantir que `generateStream()` mapeia resposta sem corpo para erro seguro.
- Criado este arquivo de memória:
  - `PROJECT_MEMORY_RUN_2026-07-01_SAFE_STREAMING_EMPTY_BODY.md`.

## Validações executadas

- Revisão estática via leitura do repositório pelo conector GitHub.
- Conferência pós-alteração dos trechos modificados em `src/ollama.js` e `test/ollama.test.js`.
- `npm test` não foi executado nesta execução porque não houve checkout local disponível/autorizado; o teste adicionado é offline e usa somente `node:test`.

## Riscos

- Baixo risco: alteração restrita ao tratamento de erro quando o corpo de streaming está ausente.
- Não altera contrato de sucesso do streaming, payload Ollama, fila, cache, rate limit ou leitura de arquivos.
- Não adiciona dependências.
- Não executa código gerado pelo usuário.

## Pendências

- Rodar `npm test` em ambiente local ou CI para validar a suíte completa.
- Validar manualmente `POST /api/generate-stream` com Ollama real em Windows 8 GB RAM.
- Continuar endurecendo bordas do streaming, especialmente eventos de erro e cancelamento de cliente, sem aumentar consumo de memória.

## Próximos passos seguros

1. Adicionar teste para erro JSONL de streaming vindo do Ollama (`{"error":"..."}`), garantindo sanitização e status 502.
2. Documentar no guia de streaming que falhas upstream após abertura do stream são enviadas por evento `error` quando possível.
3. Verificar se o cliente SSE mínimo em Node.js pode ser documentado sem adicionar dependências.

## Compatibilidade com Claude Agent

Nenhum arquivo, branch, issue, PR ou registro explícito do Claude Agent foi encontrado nesta execução. A alteração é incremental e compatível com futuras mudanças de outros agentes, pois fica isolada em `src/ollama.js` e no teste correspondente.
