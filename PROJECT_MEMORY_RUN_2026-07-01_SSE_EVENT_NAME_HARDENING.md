# Memória de execução - 2026-07-01 - endurecimento do nome de eventos SSE

## Avaliação inicial

- Repositório `PheidiasSoftware/TESTE` examinado antes de qualquer alteração.
- Arquivos analisados:
  - `README.md`: confirma objetivo de backend local leve para programação, Windows, 8 GB RAM, sem GPU, Ollama e documentação técnica.
  - `package.json`: projeto Node.js ESM sem dependências externas, scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
  - `src/server.js`: API local com `/health`, `/api/status`, `/api/generate`, `/api/generate-stream`, `/api/read-file`, `/api/large-code-plan`, fila, cache, rate limit, leitura segura e detecção de geração grande.
  - `src/http.js`: helpers centrais para JSON, SSE, headers de segurança e leitura limitada de JSON.
  - `src/ollama.js`: cliente Ollama com payload conservador, sanitização de opções, streaming JSONL e erros upstream seguros.
  - `test/http.test.js`: testes de headers, JSON, SSE e leitura de corpo.
  - `test/ollama.test.js`: testes offline do cliente Ollama e streaming JSONL.
  - `.github/workflows/node-test.yml`: CI leve com Node.js 20 e `npm test`, sem Ollama.
  - `PROJECT_MEMORY.md`: histórico inicial do projeto e pendências antigas.
- PRs recentes consultados pelo conector GitHub: nenhum PR retornado.
- Não foram encontrados registros acionáveis do Claude Agent nesta execução.

## Decisão tomada

Realizar uma melhoria pequena, segura e reversível no helper SSE: normalizar o nome do evento antes de escrever no stream. Isso reduz risco de quebra de enquadramento SSE se algum uso futuro chamar `sendServerEvent()` com nome de evento contendo quebras de linha ou caracteres de controle.

## Arquivos alterados/criados

- `src/http.js`
  - Criada função exportada `normalizeServerEventName(value, fallback = 'message')`.
  - `sendServerEvent()` agora usa o nome normalizado antes de escrever `event:`.
  - Mantidos payload SSE, headers de segurança e comportamento existente para eventos válidos.

- `test/http.test.js`
  - Importado `normalizeServerEventName()`.
  - Adicionado teste para remoção de quebras de linha/caracteres de controle e fallback seguro.
  - Adicionado teste para garantir que `sendServerEvent()` normaliza o nome do evento antes de escrever no stream.

- `PROJECT_MEMORY_RUN_2026-07-01_SSE_EVENT_NAME_HARDENING.md`
  - Registrada esta execução, análise, decisão, arquivos, validações, riscos e próximos passos.

## Validações executadas

- Revisão estática das alterações no helper SSE.
- Conferido que a mudança não adiciona dependências externas.
- Conferido que não executa código gerado pelo usuário.
- Conferido que a alteração é isolada, reversível e compatível com PC fraco.
- Conferido que eventos existentes como `metadata`, `token`, `done` e `error` continuam iguais.
- `npm test` não foi executado neste ambiente por falta de checkout local autorizado; a CI do repositório deve validar os testes em Node.js 20.

## Riscos

- A normalização remove caracteres de controle do nome de evento, sem rejeitar a chamada. Para eventos internos fixos isso não muda comportamento; para usos futuros com nomes dinâmicos, evita injeção de linhas SSE, mas pode concatenar partes do texto removido.
- O projeto ainda depende de validação por CI ou máquina local para confirmar todos os testes.

## Pendências e próximos passos

1. Acompanhar o resultado do `npm test` na CI.
2. Continuar priorizando melhorias pequenas em backend/API: métricas de streaming, cache, fila, contexto grande e documentação Windows.
3. Considerar teste de contrato para garantir que somente eventos SSE conhecidos sejam usados nas rotas públicas.
4. Manter o MVP sem dependências pesadas e sem execução automática de código do usuário.
