# PROJECT MEMORY RUN — 2026-07-01 — Ollama stream error frames

## Data/hora

- 2026-07-01 03:18 America/Sao_Paulo.

## Avaliação inicial do repositório

Arquivos e áreas examinadas antes da alteração:

- `README.md`: confirma objetivo do backend local para programação em PC fraco com Windows, 8 GB RAM e sem GPU; documenta Ollama, endpoints, testes offline, fila, cache, rate limit, leitura segura, streaming e geração grande em etapas.
- `package.json`: projeto Node.js ESM sem dependências externas; scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20 executando `npm test` sem Ollama real.
- `src/server.js`: backend já possui API local, fila de geração, cache, rate limit, headers JSON/SSE, leitura segura de arquivos, detecção de contexto grande e status público sem expor `OLLAMA_URL`.
- `src/config.js`: limites conservadores para 8 GB RAM, allowlist de extensões, normalização de host/modelo/Ollama URL e redaction de logs sensíveis.
- `src/ollama.js`: cliente Ollama com payload conservador, sanitização de opções, parsing JSONL de streaming e erros upstream seguros.
- `test/ollama.test.js`: testes offline existentes para payload conservador, sanitização de erro, streaming e cliente Ollama.
- PRs/issues recentes consultados via conector: não encontrei PRs ou issues abertas relevantes retornadas para esta execução.
- Registros do Claude Agent: nenhum arquivo/registo específico do Claude Agent foi identificado nesta execução pelo conector.

## Decisão tomada

Fazer uma melhoria pequena e segura no tratamento de streaming do Ollama. Antes, um frame JSONL de streaming contendo `error` poderia ser tratado como linha sem token e o backend poderia finalizar com resposta parcial ou `done: false`, em vez de retornar erro seguro ao cliente.

## Arquivos alterados/criados

- Alterado `src/ollama.js`:
  - `parseOllamaStreamLine` agora preserva `error` quando o Ollama envia frame JSONL de erro.
  - `readOllamaStream` agora converte frame `error` em `createSafeUpstreamError('Falha ao chamar Ollama em streaming.')`, mantendo detalhe sanitizado apenas em `upstreamErrorDetail` e `exposeDetail=false`.
- Criado `test/ollama-stream-error.test.js`:
  - cobre parsing de frame `error`;
  - cobre conversão de erro de streaming em erro 502 seguro, sem expor `detail` público.

## Commits

- `3e1d62b5e82f5df569c3d4810051b13e1483ca23` — Handle Ollama stream error frames safely
- `d4ae511b4a23cae3e1e39643143b2f4ed11b17fa` — Add Ollama stream error frame tests
- `21ee4bb6c98228ef30b2c18ff0e0c2107f4c18ed` — Fix stream error test escaped newlines

## Validações executadas

- Revisão estática via leitura dos arquivos alterados pelo conector GitHub.
- `npm test` não foi executado nesta execução porque não houve checkout local disponível no ambiente do conector.
- A alteração é offline e não chama Ollama, não baixa modelos e não executa código gerado por usuário.

## Riscos e observações

- O novo teste deve rodar no test runner nativo do Node.js 20 sem dependências externas.
- A mudança preserva compatibilidade com frames normais `{ response, done, total_duration }`.
- O detalhe bruto do erro do Ollama permanece sanitizado e interno, evitando vazamento direto para resposta pública.

## Pendências e próximos passos sugeridos

- Rodar `npm test` localmente ou aguardar CI do GitHub Actions para confirmar a suíte completa.
- Em próxima execução segura, considerar documentar exemplos de erro de streaming no guia `docs/streaming.md` ou adicionar teste de rota `/api/generate-stream` simulando erro upstream sem Ollama real.
