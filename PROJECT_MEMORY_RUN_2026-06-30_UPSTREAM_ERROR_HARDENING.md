# Project memory - upstream Ollama error hardening

## Data/hora

2026-06-30 12:34 America/Sao_Paulo

## Avaliacao inicial do repositorio

Repositorio analisado antes de qualquer alteracao, conforme regra operacional.

Arquivos e areas examinados nesta execucao:

- `README.md`
- `package.json`
- `.github/workflows/node-test.yml`
- `src/server.js`
- `src/config.js`
- `src/ollama.js`
- `test/server.test.js`
- `test/ollama.test.js`
- `docs/api-contract.md`
- issues abertas do repositorio
- PRs abertos do repositorio
- busca por commits/registros associados a Claude/agent

Resumo encontrado:

- O projeto continua sendo um backend Node.js 20+ leve para LLM/SLM local de programacao, pensado para Windows, 8 GB de RAM, CPU e sem GPU.
- `README.md` documenta instalacao, Windows, Ollama, modelo pequeno, endpoints, CI leve, variaveis conservadoras e testes sem chamar Ollama.
- `package.json` permanece sem dependencias externas pesadas e usa `node --test`.
- `.github/workflows/node-test.yml` roda `npm test -- --test-reporter=spec` em Node.js 20, com variaveis conservadoras e rate limit desativado apenas no CI.
- `src/server.js` ja possui API local, streaming SSE, fila, cache, leitura segura, rate limit, validacao de Content-Type, status sanitizado e logs estruturados.
- `src/config.js` limita valores numericos, host local, modelo e extensoes permitidas.
- `src/ollama.js` ja tinha sanitizacao de detalhe de erro upstream, mas ainda anexava esse texto em `error.detail`, que o servidor repassava em respostas publicas de `/api/generate` e eventos `error` de `/api/generate-stream`.
- `test/ollama.test.js` ja cobria payload conservador, sanitizacao de opcoes, parsing JSONL e falhas do Ollama.
- Nao foram encontrados PRs ou issues abertos pelo conector.
- Nao foram encontrados registros claros de Claude Agent nesta verificacao.

## Decisao tomada

A menor melhoria segura foi endurecer o contrato de erro do runtime local Ollama.

Motivo: mensagens de erro upstream podem conter detalhes locais, caminhos, partes de resposta do runtime ou informacoes dificeis de controlar. Para um backend local seguro, especialmente em clientes simples, e melhor expor apenas uma mensagem curta e manter detalhe sanitizado como campo interno do erro para diagnostico/testes.

## Arquivos alterados/criados

### Alterados

- `src/ollama.js`
  - Criada funcao `createSafeUpstreamError(message, { statusCode, detail })`.
  - O detalhe bruto do Ollama continua passando por `sanitizeUpstreamErrorDetail()`.
  - O detalhe sanitizado agora fica em `upstreamErrorDetail`, sem preencher `detail`.
  - Erros carregam `exposeDetail: false`.
  - `generate()` e `generateStream()` passam a usar `createSafeUpstreamError()`.

- `test/ollama.test.js`
  - Importa e cobre `createSafeUpstreamError()`.
  - Atualiza o teste de falha do Ollama para verificar que `detail` nao e exposto, enquanto `upstreamErrorDetail` permanece sanitizado e limitado.

- `docs/api-contract.md`
  - Documenta que detalhes brutos do runtime local nao fazem parte do contrato publico.
  - Atualiza a descricao de erro `502`.
  - Documenta o evento SSE `error` com mensagem segura e `requestId`.

### Criado

- `PROJECT_MEMORY_RUN_2026-06-30_UPSTREAM_ERROR_HARDENING.md`

## Commits desta execucao

- `31912702a71c7c4cbcee5f30da0633dd21eb6f7d` - Keep upstream Ollama details internal
- `9da8b7481ad51aa635202cd445084d012f1e88c9` - Cover internal upstream Ollama error details
- `89a0e0ec1937920fca064c0705451bf9a995b20d` - Document sanitized upstream error responses

## Validacoes executadas

Validadas via conector GitHub:

- Releitura parcial de `src/ollama.js` confirmou `createSafeUpstreamError()` e uso em falhas de `generate()`.
- Releitura de `test/ollama.test.js` confirmou os testes novos/atualizados.
- Releitura de docs confirmou a atualizacao do contrato publico.

Validacao local:

- Tentativa de `git clone` para executar `npm test` localmente foi bloqueada por autorizacao do ambiente (`UnauthorizedError`).
- Portanto, `npm test` e `npm run test:windows` precisam ser confirmados pela CI do GitHub ou em maquina local.

## Riscos

- Mudanca pequena e reversivel.
- Nao altera fluxo feliz de geracao.
- Nao adiciona dependencias.
- Nao chama Ollama.
- Nao executa codigo de usuario.
- Pode reduzir detalhe mostrado ao cliente final em falhas do Ollama, intencionalmente. O cliente deve usar `requestId` e logs locais para diagnostico.

## Pendencias

- Confirmar CI verde no commit final desta execucao.
- Se ainda houver falha no GitHub Actions, abrir o step `Run tests` e corrigir pelo nome exato do teste.
- Considerar uma etapa futura para centralizar formatacao de erros publicos em `src/server.js`, evitando campos opcionais repetidos nos handlers.

## Proximos passos seguros sugeridos

1. Verificar `npm test`/CI no commit mais recente.
2. Centralizar respostas de erro publicas em helper unico no servidor.
3. Adicionar teste HTTP especifico para garantir que `/api/generate` e `/api/generate-stream` nao exponham `detail` quando o runtime local falha.
4. Manter backend estavel e evitar funcionalidades grandes ate a CI confirmar a suite.

## Compatibilidade com Claude Agent

Nenhum registro claro de intervencao do Claude Agent foi encontrado nesta execucao. A memoria foi criada para facilitar continuidade por outros agentes.