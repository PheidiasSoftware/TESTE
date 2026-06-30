# Project memory - structured JSON content type coverage

## Data/hora

2026-06-30 18:34 America/Sao_Paulo

## Avaliacao inicial do repositorio

Antes de qualquer alteracao, foi revisado o estado atual do repositorio PheidiasSoftware/TESTE com foco em backend leve para LLM/SLM local em PC fraco com Windows, 8 GB RAM e sem GPU.

Arquivos e areas examinadas:

- README.md
- package.json
- src/server.js
- src/config.js
- src/ollama.js
- src/generation-queue.js
- scripts/start-windows.ps1
- scripts/test-windows.ps1
- .github/workflows/node-test.yml
- docs/api-contract.md
- test/server.test.js
- test/config.test.js
- busca textual por Claude Agent, memorias e pendencias
- issues/PRs acessiveis via busca
- commits recentes acessiveis via busca

Resumo tecnico encontrado:

- O backend esta em Node.js 20, sem dependencias externas pesadas.
- O projeto ja possui API local com /health, /api/status, /api/generate, /api/generate-stream, /api/read-file e /api/large-code-plan.
- Ha fila simples, cache de prompt, streaming SSE, leitura segura de arquivos, rate limit local, logs estruturados e redaction de campos sensiveis.
- A configuracao e scripts Windows mantem padroes conservadores para PC fraco.
- A CI roda npm test em Node.js 20 sem instalar Ollama nem baixar modelo.
- O contrato da API documenta que rotas POST aceitam application/json e media type compativel com sufixo +json.
- Nao foi encontrado registro direto de Claude Agent na busca textual desta execucao.
- Nao foram encontrados issues/PRs relevantes na busca executada.

## Decisao tomada

Foi escolhida uma melhoria pequena, segura e reversivel de cobertura: adicionar teste offline garantindo que `POST /api/generate` aceita `Content-Type: application/vnd.api+json; charset=utf-8`.

Motivo:

- O comportamento ja existe em `isJsonContentType`, mas nao havia teste dedicado para media type estruturado com sufixo `+json`.
- O contrato publico promete suporte a media type compativel `+json`.
- A validacao nao chama Ollama, nao executa codigo gerado e continua adequada para CI leve e PC fraco.

## Arquivos alterados/criados

- `test/json-content-type.test.js`
  - Novo teste offline para validar `application/vnd.api+json; charset=utf-8` em `POST /api/generate`.
  - O corpo propositalmente nao envia `task`; assim o endpoint deve aceitar o Content-Type e retornar `400` por validacao de entrada, comprovando que nao caiu no bloqueio `415`.

- `PROJECT_MEMORY_RUN_2026-06-30_STRUCTURED_JSON_CONTENT_TYPE.md`
  - Memoria desta execucao.

## Validacoes executadas

- Revisao estatica dos arquivos relevantes via conector GitHub.
- Nao foi executado `npm test` neste ambiente.
- O novo teste foi desenhado para nao chamar Ollama e nao depender de GPU, modelo local ou internet.

Validacao pendente recomendada:

```bash
npm test
```

ou, no Windows:

```powershell
npm run test:windows
```

## Riscos

- Risco baixo: adiciona apenas um arquivo de teste.
- Nao altera comportamento de runtime.
- Nao adiciona dependencias.
- Nao executa codigo gerado pelo usuario.
- Nao expoe segredos.

Possivel risco operacional:

- Se o runner do Node.js executar arquivos de teste compartilhando o mesmo processo e servidor singleton de forma inesperada, pode haver conflito de listen/close. O padrao esperado do runner nativo com arquivos separados deve isolar corretamente, mas a CI deve confirmar.

## Pendencias

- Confirmar `npm test` local ou GitHub Actions apos os commits.
- Continuar reforcando testes pequenos para contrato publico sem chamar Ollama.

## Proximos passos sugeridos

1. Adicionar cobertura similar para `POST /api/read-file` ou `/api/large-code-plan` com media type `+json`, se necessario.
2. Documentar exemplos de clientes locais usando `fetch` com streaming SSE.
3. Revisar metricas de streaming para expor `queueWaitMs` tambem no evento `done` em uma execucao futura pequena.
4. Quando o backend for considerado MVP completo, registrar criterios atendidos e pendencias de frontend/decisao do usuario.
