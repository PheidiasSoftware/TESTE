# PROJECT_MEMORY_RUN_2026-07-01_OLLAMA_NON_STREAM_ERROR_PAYLOAD

## Data/hora

2026-07-01 07:19 America/Sao_Paulo

## Avaliação inicial do repositório

Antes de qualquer alteração, o repositório `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub.

Arquivos e áreas verificados:

- `README.md`: confirma backend Node.js leve para LLM/SLM local, Windows, 8 GB RAM, sem GPU, Ollama, endpoints, testes, docs e scripts Windows.
- `package.json`: projeto ESM, Node.js 20+, sem dependências externas pesadas, scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `.github/workflows/node-test.yml`: CI leve com Node.js 20 e variáveis conservadoras; não instala Ollama nem baixa modelos.
- `src/server.js`: API local com `/health`, `/api/status`, `/api/generate`, `/api/generate-stream`, `/api/read-file`, `/api/large-code-plan`, rate limit, cache, fila, validação de JSON e contrato público sanitizado.
- `src/config.js`: normalização conservadora de variáveis de ambiente, limites numéricos e redaction de chaves sensíveis.
- `src/http.js`: headers de segurança JSON/SSE, SSE com nome de evento normalizado e leitura JSON com limite de payload.
- `src/ollama.js`: cliente Ollama, payload conservador, sanitização de opções, tratamento seguro de falhas upstream, streaming JSONL com limite de linha.
- `src/large-code.js`: detecção de tarefa grande e planejamento incremental para simular contexto grande em PC fraco.
- `scripts/start-windows.ps1`, `scripts/test-windows.ps1`, `scripts/smoke-windows.ps1`: helpers Windows conservadores e sem execução de código gerado.
- `test/ollama.test.js`: testes offline do cliente Ollama e streaming.
- `docs/backend-mvp-status.md` e `PROJECT_MEMORY.md`: histórico do MVP, pendência recorrente de confirmação objetiva de `npm test`/CI verde e orientação de evitar mudanças grandes até validação.

Consultas de coordenação:

- Issues abertas: nenhuma retornada pelo conector.
- PRs recentes: nenhum retornado pelo conector.
- Busca textual por registros claros de Claude Agent/estado não retornou resultados úteis nesta execução.

## Decisão tomada

Executar uma melhoria pequena, segura e reversível no backend: tratar respostas não-streaming do Ollama com HTTP `200 OK` mas corpo JSON contendo campo `error` como erro upstream seguro (`502`), com detalhe sanitizado apenas em `upstreamErrorDetail` interno.

Motivo: alguns runtimes locais podem devolver erro no payload em vez de falhar por status HTTP. Antes, esse caso cairia como `Resposta inválida do Ollama.`, perdendo o motivo sanitizado. A mudança melhora diagnóstico sem expor segredos, sem adicionar dependências e sem alterar execução de código do usuário.

## Arquivos alterados/criados

- `src/ollama.js`
  - `normalizeOllamaGenerateResult()` agora detecta `value.error` textual antes de validar `response`.
  - `createOllamaClient().generate()` preserva erros seguros já classificados por `normalizeOllamaGenerateResult()` e continua convertendo JSON inválido real em `Resposta inválida do Ollama.`.

- `test/ollama-non-stream-error.test.js`
  - Novo teste offline para `normalizeOllamaGenerateResult()` com `error` sanitizado e limitado.
  - Novo teste offline para `createOllamaClient().generate()` recebendo `200 OK` com `{ error: ... }`.

- `PROJECT_MEMORY_RUN_2026-07-01_OLLAMA_NON_STREAM_ERROR_PAYLOAD.md`
  - Registro desta execução, análise inicial, decisão, arquivos alterados, validações, riscos, pendências e próximos passos.

## Validações executadas

- Revisão estática dos trechos alterados em `src/ollama.js`.
- Releitura pelo conector de `src/ollama.js` após alteração para confirmar o fluxo:
  - detecta `error` textual;
  - lança erro seguro com mensagem pública genérica;
  - repropaga erros com `statusCode`;
  - mantém JSON inválido como erro de resposta inválida.
- Releitura pelo conector de `test/ollama-non-stream-error.test.js` após criação.
- Não foi executado `npm test` nesta automação porque não há checkout local autorizado/disponível; validação final deve ocorrer via CI ou ambiente local com Node.js 20+.

## Riscos

- Baixo risco e reversível por um único commit de código e um arquivo de teste.
- A mudança altera a mensagem pública de respostas não-streaming com `error` no payload para `Falha ao chamar Ollama.`, mais precisa e coerente com falhas HTTP upstream.
- `upstreamErrorDetail` continua interno e sanitizado; o servidor atual não o expõe no corpo HTTP.
- Não foram adicionadas dependências, workers, execução de comandos de usuário ou uso de GPU.

## Pendências

1. Executar `npm test` ou `npm run test:windows` em Node.js 20+.
2. Conferir checks do commit final quando o GitHub Actions registrar execução.
3. Manter próximas mudanças pequenas até haver evidência objetiva de CI verde.
4. Considerar documentar, se necessário, que erros do Ollama podem vir por status HTTP ou por campo `error` no payload.

## Próximos passos sugeridos

- Adicionar teste HTTP offline garantindo que `/api/generate` não expõe `upstreamErrorDetail` quando o cliente Ollama falha.
- Melhorar documentação de troubleshooting do Ollama local para erros comuns como modelo ausente ou runtime offline.
- Continuar priorizando segurança, baixa memória e diagnósticos úteis para Windows sem GPU.
