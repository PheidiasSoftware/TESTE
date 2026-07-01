# PROJECT MEMORY RUN - 2026-06-30 - Content-Type contract for POST routes

## Data/hora

2026-06-30 21:37 BRT.

## Avaliacao inicial

Repositorio analisado: `PheidiasSoftware/TESTE`, branch `main`.

Arquivos examinados antes da alteracao:

- `README.md`: backend leve para LLM/SLM local de programacao em Windows, Node.js 20+, Ollama local, 8 GB RAM e sem GPU.
- `package.json`: scripts `start`, `start:windows`, `dev`, `test`, `test:windows` e `smoke:windows`, sem dependencias pesadas.
- `src/server.js`: rotas de health, status, generate, generate-stream, read-file e large-code-plan, com fila, cache, rate limit, contexto seguro e validacao de Content-Type.
- `src/http.js`: helpers JSON/SSE, headers de seguranca, limite de payload e tratamento de cliente abortado.
- `src/config.js`: limites conservadores para memoria, contexto, fila, cache, host, URL do Ollama e modelo.
- `test/server.test.js` e `test/http.test.js`: testes offline existentes sem chamada ao Ollama.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20 com `npm test`.
- `scripts/start-windows.ps1`: inicializacao Windows com padroes conservadores.
- `docs/api-contract.md`: contrato informa que rotas POST aceitam `application/json` ou media type compativel `+json`.

A consulta a PRs recentes retornou lista vazia. A busca por registros do Claude Agent e arquivos de estado nao retornou item acionavel nesta execucao.

## Decisao tomada

Foi escolhida uma melhoria pequena e segura: fortalecer a cobertura de testes do contrato HTTP de `Content-Type` para todas as rotas POST. O codigo ja aceitava `application/json` e media types com sufixo `+json`; faltava um teste dedicado para evitar regressao em clientes locais.

A mudanca nao adiciona dependencia, nao chama Ollama, nao executa codigo gerado pelo usuario e nao aumenta consumo de memoria.

## Arquivos criados

- `test/content-type-contract.test.js`

Cobertura adicionada:

- Todas as rotas POST rejeitam `text/plain` com `HTTP 415`, `expectedContentType` e `requestId`.
- Todas as rotas POST aceitam `application/vnd.teste+json; charset=utf-8` sem retornar `415`.
- O payload usado e vazio para validar apenas a camada HTTP e manter o teste offline.

## Validacoes

- Revisao estatica do arquivo criado pelo conector GitHub.
- `npm test` nao foi executado nesta sessao porque o ambiente bloqueou o checkout local.

## Riscos

- Baixo risco: alteracao restrita a novo arquivo de teste.
- O teste replica o padrao existente de abrir o servidor em porta aleatoria e fechar ao final.

## Pendencias

- Confirmar o resultado do GitHub Actions.
- Rodar `npm test` em checkout local quando disponivel.
- Avaliar em execucao futura se a resposta `415` deve mencionar explicitamente `application/*+json` alem de `application/json`.

## Proximos passos seguros

1. Manter a cobertura como trava de regressao se a CI passar.
2. Melhorar a clareza da mensagem de erro `415` em uma execucao futura.
3. Continuar priorizando backend offline, seguranca, testes e documentacao para Windows, 8 GB RAM e sem GPU.

## Compatibilidade com Claude Agent

Nenhum registro acionavel do Claude Agent foi localizado pelo conector nesta execucao. A alteracao foi incremental e nao conflita com PRs recentes.