# Project Memory Run - 2026-07-01 - Strict SSE Event Name Tokens

## Data/hora

2026-07-01 05:22 -03:00

## Avaliação inicial do repositório

Antes de alterar arquivos, examinei o estado atual do repositório `PheidiasSoftware/TESTE` pela integração GitHub.

Arquivos e áreas analisadas:

- `README.md`: confirma objetivo do backend local para LLM/SLM leve de programação, Windows, 8 GB RAM, sem GPU, Ollama local, endpoints HTTP, fila, cache, leitura segura, rate limit e documentação técnica.
- `package.json`: projeto Node.js ESM sem dependências externas, scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: API local com `GET /health`, `GET /api/status`, `POST /api/generate`, `POST /api/generate-stream`, `POST /api/read-file`, `POST /api/large-code-plan`, fila conservadora, cache, rate limit, leitura segura e integração Ollama.
- `src/http.js`: helpers HTTP/SSE, headers de segurança, leitura JSON com limite de payload e tratamento de cliente abortado.
- `test/http.test.js`: testes dos helpers HTTP/SSE, headers de segurança e leitura JSON.
- `docs/streaming.md`: contrato atual do SSE com eventos `metadata`, `token`, `done` e `error`.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20 executando `npm test` sem Ollama.
- Issues/PRs: não encontrei issues abertas nem PRs recentes acessíveis pelo conector.
- Commits recentes: histórico mostra evolução incremental recente de documentação backend, streaming, testes e segurança.
- Registros do Claude Agent: não encontrei menção explícita a `Claude Agent` nos resultados de busca disponíveis pelo conector.

## Decisão tomada

Escolhi uma melhoria pequena, segura e reversível no backend: restringir a normalização de nomes de eventos SSE para um conjunto simples de caracteres de token (`A-Z`, `a-z`, `0-9`, `_`, `.`, `-`).

Motivo:

- O contrato real usa apenas nomes simples (`metadata`, `token`, `done`, `error`).
- A normalização anterior removia controles, mas ainda preservava caracteres desnecessários como `:` e espaços.
- A alteração reduz superfície de ambiguidade no stream sem mudar os eventos públicos existentes.
- Não adiciona dependências, não executa código gerado e é compatível com PC fraco.

## Arquivos alterados

- `src/http.js`
  - `normalizeServerEventName()` agora remove qualquer caractere fora de `[A-Za-z0-9_.-]` e mantém fallback seguro.

- `test/http.test.js`
  - Atualizados testes para cobrir a normalização mais estrita.
  - Adicionado cenário que preserva nomes seguros como `token.created-v1_ok`.
  - Ajustado cenário de tentativa de injeção `token\nevent: error` para confirmar saída `tokeneventerror`.

## Validações executadas

- Revisão estática via leitura dos arquivos no GitHub.
- Conferência manual do contrato SSE documentado.
- Não executei `npm test` porque o checkout local via ambiente de execução não estava autorizado; a validação efetiva deve ocorrer pela CI do GitHub Actions ou por execução local.

## Riscos

- Baixo risco: nomes de evento customizados com espaço, `:` ou caracteres Unicode passam a ser compactados/removidos. O backend atual não documenta nem emite eventos desse tipo.
- Clientes que dependam apenas dos eventos documentados (`metadata`, `token`, `done`, `error`) não devem ser afetados.

## Pendências

- Aguardar GitHub Actions do commit final.
- Rodar `npm test` localmente quando houver checkout disponível.
- Validar streaming real com Ollama em Windows quando o runtime local estiver disponível.

## Próximos passos seguros

- Adicionar teste HTTP de contrato para headers SSE em rota real, se ainda não coberto.
- Documentar política de nomes SSE seguros em `docs/streaming.md`.
- Criar exemplo mínimo de cliente Node.js para consumir SSE sem dependências externas.
