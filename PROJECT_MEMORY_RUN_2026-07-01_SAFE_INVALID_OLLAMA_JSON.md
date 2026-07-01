# PROJECT MEMORY RUN - 2026-07-01 - Safe invalid Ollama JSON handling

## Data/hora

2026-07-01 00:35 America/Sao_Paulo.

## Avaliação inicial do repositório

Antes de alterar qualquer arquivo, o repositório foi examinado conforme regra da execução.

Arquivos e áreas analisadas:

- `README.md`: confirma objetivo de backend local leve para LLM/SLM de programação, Windows 10/11, Node.js 20+, 8 GB RAM, sem GPU obrigatória, Ollama local, modelo padrão `qwen2.5-coder:1.5b-instruct`, endpoints, variáveis, testes e guias técnicos.
- `package.json`: projeto Node.js ESM sem dependências externas, scripts `start`, `start:windows`, `dev`, `test`, `test:windows` e `smoke:windows`.
- `.github/workflows/node-test.yml`: CI leve com Node.js 20, `npm test`, sem instalar Ollama ou baixar modelos.
- `src/server.js`: API HTTP nativa com `/health`, `/api/status`, `/api/generate`, `/api/generate-stream`, `/api/read-file` e `/api/large-code-plan`, fila, cache, rate limit, contexto seguro e geração grande em etapas.
- `src/config.js`: limites conservadores para PC fraco, normalização de host, modelo, URL do Ollama, flags e extensões permitidas.
- `src/http.js`: JSON/SSE com headers de segurança, limite de payload e validação de corpo JSON objeto.
- `src/ollama.js`: cliente Ollama local, payload conservador, sanitização de opções, tratamento seguro de erro upstream e leitura de streaming JSONL.
- `test/config.test.js` e `test/ollama.test.js`: testes offline para configuração e cliente Ollama.
- `PROJECT_MEMORY.md`: histórico extenso do projeto, com decisões anteriores de fila, cache, streaming, leitura segura, CI, scripts Windows, headers, smoke tests e correções recentes.

Verificações adicionais:

- Busca de issues/PRs no repositório não retornou itens relevantes abertos para esta execução.
- Busca por branches relacionados a Claude não retornou resultado.
- Não foram encontrados registros conflitantes do Claude Agent nos arquivos lidos nesta execução.

## Decisão tomada

Foi escolhida uma melhoria pequena, segura, reversível e de backend: tratar resposta JSON inválida do Ollama no fluxo não-streaming como erro upstream seguro `502`, sem expor `SyntaxError` cru nem detalhes internos ao cliente.

Motivo:

- Em PC fraco e ambiente local, o Ollama pode retornar resposta inesperada quando o runtime está instável, reiniciando ou por incompatibilidade de endpoint.
- Antes da alteração, `response.json()` poderia lançar erro bruto, que chegaria ao handler como falha genérica.
- A melhoria mantém o contrato seguro de erros upstream já usado para falhas HTTP do Ollama.

## Arquivos alterados/criados

### `src/ollama.js`

- `generate()` agora envolve `response.json()` em `try/catch`.
- Se o corpo da resposta não for JSON válido, lança `createSafeUpstreamError('Resposta inválida do Ollama.')`.
- Mantém `statusCode=502` e `exposeDetail=false`.
- Não adiciona dependências e não altera streaming.

### `test/ollama.test.js`

- Adicionado teste offline para simular `response.ok=true` com `json()` lançando `SyntaxError`.
- O teste confirma que o erro resultante é seguro, com status `502`, mensagem controlada e sem detalhe upstream.

### Este arquivo

- Criado `PROJECT_MEMORY_RUN_2026-07-01_SAFE_INVALID_OLLAMA_JSON.md` com avaliação, decisão, alterações, validações, riscos, pendências e próximos passos.

## Validações executadas

- Revisão estática das alterações no cliente Ollama.
- Conferido que a alteração não executa código gerado pelo usuário.
- Conferido que a alteração não expõe segredos nem corpo bruto da resposta do Ollama.
- Conferido que o teste é offline e usa somente recursos nativos do Node.js.
- Conferido que nenhuma dependência externa foi adicionada.

Limitação:

- `npm test` não foi executado neste ambiente porque o checkout local do repositório não está autorizado; a validação final deve ocorrer pelo GitHub Actions ou localmente com Node.js 20+.

## Riscos

- Se alguma instalação personalizada do Ollama retornar JSON inválido com status 200 por um motivo recuperável, o backend agora responderá erro seguro `502`, o que é adequado para contrato de API.
- A alteração cobre somente geração não-streaming; o streaming continua tolerante a linhas inválidas e retorna `done=false` se não houver linha final válida.

## Pendências

1. Executar `npm test` pelo CI ou localmente em Windows/Node.js 20+.
2. Considerar tratamento explícito para streaming sem evento final válido, retornando erro SSE controlado quando fizer sentido.
3. Avaliar exposição opcional de métricas de falhas upstream por tipo, mantendo redaction.
4. Continuar melhorias incrementais de documentação e testes sem dependências pesadas.

## Próximo passo sugerido

Na próxima execução segura, priorizar um teste/contrato para streaming incompleto do Ollama ou documentação curta de troubleshooting para erros upstream `502`, mantendo o projeto leve, local e adequado a Windows com 8 GB RAM sem GPU.
