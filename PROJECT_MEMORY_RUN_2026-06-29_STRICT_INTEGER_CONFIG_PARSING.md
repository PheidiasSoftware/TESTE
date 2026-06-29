# Project memory - strict integer config parsing

Data/hora: 2026-06-29 16:38 America/Sao_Paulo

## Avaliacao inicial

Antes de alterar arquivos, o repositorio `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub.

Arquivos analisados:

- `README.md`: objetivo de backend local para LLM/SLM leve em Windows, 8 GB RAM, sem GPU, Node.js 20+ e Ollama local.
- `package.json`: projeto Node ESM sem dependencias externas, com scripts `start`, `start:windows`, `test` e `test:windows`.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20 rodando `npm test` com ambiente conservador.
- `docs/backend-mvp-status.md`: MVP funcionalmente pronto, com pendencia de validacao objetiva por `npm test`, `npm run test:windows` ou CI verde.
- `src/server.js`: endpoints HTTP locais e integracao com fila, cache, rate limit, leitura segura e Ollama; mantido intacto nesta execucao.
- `src/http.js`: helpers HTTP ja cobertos por testes.
- `src/config.js`: foco escolhido para hardening pequeno.
- `test/http.test.js` e `test/config.test.js`: testes offline sem chamada ao Ollama.

Consultas feitas:

- Issues abertas relevantes: sem resultados.
- PRs abertos/recentes relevantes: sem resultados.
- Registros claros de Claude Agent: nao encontrados pela busca disponivel.
- Historico recente: hardening incremental de configuracao, especialmente `PORT` e `OLLAMA_URL`.

## Decisao

A tarefa segura escolhida foi endurecer `parseInteger` para aceitar somente inteiros completos e seguros.

Motivo: o uso anterior de `parseInt` podia aceitar valores parciais como `65536x`, `120000.5` ou `1e3`. Para limites de payload, timeout, fila, cache, contexto e rate limit, o comportamento mais seguro e cair para defaults conservadores quando a configuracao e ambigua.

## Arquivos alterados ou criados

- `src/config.js`
  - `parseInteger` agora e exportado.
  - Rejeita valores vazios, parciais, decimais, notacao cientifica e inteiros fora de `Number.isSafeInteger`.
  - Mantem fallback conservador para valores invalidos.

- `test/config.test.js`
  - Importa `parseInteger`.
  - Adiciona cobertura para inteiros validos e fallback em valores parciais, decimais, notacao cientifica e unsafe integer.
  - Adiciona cobertura de `loadConfig` para fallback em `MAX_BODY_BYTES`, `REQUEST_TIMEOUT_MS` e `MAX_QUEUE_SIZE`.

- `docs/backend-mvp-status.md`
  - Registra a execucao atual.
  - Adiciona parsing estrito de inteiros aos criterios atendidos.
  - Atualiza o item de configuracao parcialmente atendida.

- `PROJECT_MEMORY_RUN_2026-06-29_STRICT_INTEGER_CONFIG_PARSING.md`
  - Registro de memoria desta execucao.

## Validacoes

- Foi feita validacao estatica pela leitura dos arquivos via conector GitHub.
- Nao foi possivel executar `npm test` localmente porque nao havia checkout local autorizado nesta execucao.
- A mudanca adiciona testes offline compativeis com `node --test` e nao chama Ollama.

## Riscos

- Ainda falta evidencia objetiva de `npm test`, `npm run test:windows` ou CI verde para o commit final desta execucao.
- `src/server.js` continua concentrando responsabilidades, mas foi preservado por seguranca.
- Valores com sinal positivo, como `+3`, sao aceitos por `parseInteger`; isso e intencional por serem inteiros completos e seguros.

## Pendencias

1. Confirmar `npm test` em checkout limpo.
2. Confirmar `npm run test:windows` em Windows com Node.js 20+.
3. Confirmar CI verde no GitHub Actions para o commit mais recente.
4. Depois de validacao objetiva, considerar refatoracao pequena de roteamento/handlers de `src/server.js`.

## Proximos passos seguros

- Reconsultar status de CI/checks do commit mais recente.
- Se CI estiver indisponivel, continuar apenas com hardening, testes e documentacao de baixo risco.
- Quando houver validacao objetiva, registrar o backend como MVP completo ou iniciar refatoracao minima de roteamento.

## Compatibilidade com Claude Agent

Nenhum arquivo de estado, branch, issue, PR ou comentario claramente atribuido ao Claude Agent foi encontrado nesta execucao. A alteracao foi documentada para facilitar continuidade por Claude Agent ou outros agentes futuros.
