# PROJECT MEMORY RUN - 2026-07-01 - Ollama stream JSON object guard

## Data/hora

- 2026-07-01 02:34 America/Sao_Paulo

## Avaliação inicial do repositório

Repositório examinado antes de alterar qualquer arquivo, conforme regra da execução.

Arquivos e áreas verificados:

- `README.md`: confirma objetivo do backend local para LLM/SLM de programação em PC fraco com Windows, 8 GB RAM e sem GPU; documenta scripts Windows, testes offline, CI leve, endpoints, limites de contexto, fila, cache, leitura segura e guias técnicos.
- `package.json`: projeto Node.js ESM sem dependências externas, scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `.github/workflows/node-test.yml`: CI leve com Node.js 20 e `npm test`, sem instalar Ollama ou baixar modelos.
- `src/server.js`: API local com `/health`, `/api/status`, `/api/generate`, `/api/generate-stream`, `/api/read-file` e `/api/large-code-plan`; aplica content-type JSON, rate limit, fila, cache e contexto seguro.
- `src/http.js`: helpers HTTP com headers de segurança, JSON/SSE e leitura segura de corpo JSON como objeto.
- `src/config.js`: limites conservadores de memória, contexto, fila, cache, rate limit e normalização de `OLLAMA_URL` sem credenciais.
- `src/ollama.js`: cliente Ollama, payload conservador, sanitização de opções, erro upstream seguro, normalização de resposta não-streaming e parser JSONL de streaming.
- `test/ollama.test.js`: testes offline para payload, opções, erros seguros, JSON inválido/malformado e agregação de streaming.

## Registros Claude Agent / PRs / issues / estado

- Não foram encontrados PRs recentes do usuário no repositório pelo conector.
- Busca por registros explícitos de `Claude Agent` ou `PROJECT_MEMORY_RUN` via code search não retornou resultados, embora existam memórias recentes conhecidas por caminho/commits anteriores.
- Nenhuma issue/PR foi alterada nesta execução.

## Decisão tomada

Foi escolhida uma melhoria pequena, segura e reversível no backend: endurecer `parseOllamaStreamLine()` para aceitar somente objetos JSON em linhas JSONL do Ollama.

Justificativa:

- O streaming do Ollama deve retornar objetos JSONL.
- Linhas inválidas já eram ignoradas, mas JSON válido não-objeto (`null`, array, string) não representava evento de token/done válido.
- A alteração evita interpretação acidental de formatos inesperados sem tornar o backend mais pesado e sem adicionar dependências.
- Mantém compatibilidade com ruído/linhas inválidas, retornando `null` de forma segura.

## Arquivos alterados

- `src/ollama.js`
  - `parseOllamaStreamLine()` agora valida `isPlainObject(parsed)` antes de acessar campos `response`, `done` e `total_duration`.

- `test/ollama.test.js`
  - Teste `parseOllamaStreamLine parses JSONL and ignores noise` ampliado para cobrir `null`, `[]` e string JSON como ruído ignorado.

## Validações executadas

- Revisão estática dos arquivos alterados.
- Não foi executado `npm test` nesta execução porque não havia checkout local disponível pelo conector; a validação completa fica para o GitHub Actions ou execução local.

## Riscos

- Baixo risco: a mudança apenas ignora formatos JSONL que não são objetos, que não deveriam ser usados pelo contrato esperado do Ollama.
- Caso algum runtime alternativo emita JSONL não-objeto, ele passará a ser ignorado, o que é mais seguro do que tentar tratá-lo como evento válido.

## Pendências

- Confirmar resultado do GitHub Actions após os commits.
- Continuar ampliando testes offline para casos de streaming parcial e encerramento sem `done` quando fizer sentido.
- Avaliar documentação breve sobre contrato esperado de JSONL do runtime local em `docs/streaming.md` numa execução futura.

## Próximos passos seguros

1. Rodar `npm test` localmente ou aguardar CI.
2. Documentar o contrato mínimo esperado do JSONL do Ollama/llama.cpp em streaming.
3. Avaliar uma proteção incremental para expor, em `/api/status`, contadores de erros upstream sem registrar prompts/respostas.
