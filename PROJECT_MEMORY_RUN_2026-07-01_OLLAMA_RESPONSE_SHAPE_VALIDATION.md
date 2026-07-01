# PROJECT MEMORY RUN - 2026-07-01 - Ollama response shape validation

## Avaliacao inicial

Antes de alterar arquivos, o repositorio `PheidiasSoftware/TESTE` foi examinado na branch `main`.

Arquivos e areas analisadas:

- `README.md`: objetivo do backend local leve para LLM/SLM de programacao em PC Windows fraco, 8 GB RAM e sem GPU; endpoints, variaveis, testes, CI e guias.
- `package.json`: projeto Node.js ESM sem dependencias externas, com scripts `start`, `start:windows`, `dev`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: rotas locais, fila, cache, rate limit, leitura segura de arquivos, deteccao de contexto grande e headers de seguranca.
- `src/http.js`: helpers de JSON/SSE, headers e leitura de corpo JSON com limite.
- `src/ollama.js`: cliente Ollama com payload conservador, opcoes sanitizadas, erros seguros, geracao normal e streaming.
- `src/config.js`: configuracao conservadora, normalizacao de host/modelo/Ollama URL, limites numericos e allowlist.
- `test/config.test.js` e `test/ollama.test.js`: testes offline relevantes.
- `.github/workflows/node-test.yml`: CI leve com Node.js 20 sem instalar Ollama.
- `memory.md` e `PROJECT_MEMORY.md`: historico incremental.
- Issues/PRs: busca por registros abertos relacionados a Claude Agent, backend, Ollama, SLM e memoria nao retornou pendencias; busca de PRs recentes nao retornou PRs.
- Commits recentes: havia alteracoes focadas em tratamento seguro de JSON invalido do Ollama e parsing de streaming sem newline final.

## Decisao tomada

Foi escolhida uma melhoria pequena e reversivel: validar o formato da resposta JSON nao-streaming retornada pelo Ollama antes de considerar a chamada bem-sucedida.

Motivo:

- O cliente ja tratava JSON invalido como erro seguro `502`.
- Porem uma resposta JSON valida com formato inesperado poderia ser interpretada como resposta vazia.
- Para uma ferramenta local de programacao, resposta vazia por formato malformado dificulta diagnostico.
- A correcao nao adiciona dependencias, nao executa codigo gerado e nao aumenta uso de memoria.

## Arquivos alterados/criados

### `src/ollama.js`

- Adicionado helper interno `isPlainObject()`.
- Adicionada funcao exportada `normalizeOllamaGenerateResult()`.
- `generate()` agora valida que a resposta nao-streaming do Ollama e um objeto simples com `response` textual.
- Respostas malformadas agora viram erro seguro `502` com mensagem `Resposta invalida do Ollama.`.
- `total_duration` continua opcional e so e preservado quando numerico finito.

### `test/ollama.test.js`

- Importada `normalizeOllamaGenerateResult()`.
- Adicionado teste para aceitar resposta esperada do Ollama.
- Adicionado teste para rejeitar formatos malformados: `null`, array, string, objeto sem `response` e `response` nao textual.
- Adicionado teste para garantir que `createOllamaClient.generate()` mapeia JSON valido porem malformado para erro seguro `502`.

### Este arquivo

- Criado registro da execucao com avaliacao, decisao, alteracoes, validacoes, riscos, pendencias e proximos passos.

## Validacoes executadas

- Revisao estatica do fluxo em `src/ollama.js`.
- Conferido que a alteracao continua usando apenas Node.js nativo.
- Conferido que a alteracao nao executa codigo do usuario e nao altera endpoints publicos.
- Conferido que o erro segue o padrao seguro existente para falhas de runtime local.
- Conferido que os testes adicionados sao offline e nao chamam Ollama.
- `npm test` nao foi executado nesta execucao por nao haver checkout local disponivel no conector GitHub.

## Riscos

- Se algum runtime compativel com Ollama retornar JSON valido sem campo `response`, agora sera tratado como erro `502`, o que e intencional para evitar sucesso silencioso vazio.
- A validacao foi aplicada apenas a geracao nao-streaming. O streaming mantem a estrategia atual de parse JSONL tolerante.
- A validacao final ainda depende do CI do GitHub Actions ou de execucao local com Node.js 20+.

## Pendencias

1. Aguardar ou consultar CI do commit final quando disponivel.
2. Executar `npm test` localmente em Windows com Node.js 20+.
3. Considerar teste adicional para diagnostico de streaming malformado, sem quebrar tolerancia necessaria a JSONL.
4. Testar `npm run smoke:windows` em Windows real com Ollama local.
5. Manter documentacao do MVP atualizada caso novos contratos de erro sejam expostos ao usuario.

## Proximo passo sugerido

Na proxima execucao segura, priorizar uma melhoria pequena em documentacao de troubleshooting do Ollama ou um teste adicional para erros de streaming/SSE, mantendo o backend leve, local e reversivel.
