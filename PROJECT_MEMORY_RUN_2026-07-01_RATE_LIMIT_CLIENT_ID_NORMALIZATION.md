# PROJECT MEMORY RUN - 2026-07-01 - RATE LIMIT CLIENT ID NORMALIZATION

## Data/hora

2026-07-01 12:21 America/Sao_Paulo

## Avaliação inicial do repositório

Antes de qualquer alteração, o repositório `PheidiasSoftware/TESTE` foi examinado conforme a regra de execução:

- `README.md`: confirma backend Node.js local para LLM/SLM de programação, focado em Windows, 8 GB RAM, sem GPU, Ollama local, endpoints de geração, streaming, leitura segura, geração grande, cache, fila e rate limit.
- `package.json`: projeto ESM, Node.js 20+, sem dependências externas, scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: servidor HTTP nativo com rotas `/health`, `/api/status`, `/api/generate`, `/api/generate-stream`, `/api/read-file` e `/api/large-code-plan`; rotas POST validam JSON e aplicam rate limit.
- `src/http.js`: headers de segurança, JSON, SSE e leitura limitada de payload.
- `src/rate-limit.js`: rate limit de janela fixa com limite de clientes rastreados e suporte opcional a proxy confiável via `X-Forwarded-For`.
- `test/rate-limit.test.js`: testes offline do rate limit e extração de client id.
- `PROJECT_MEMORY.md`: histórico complementar longo de evolução incremental do backend.
- PRs recentes do usuário no repositório: nenhum retornado pelo conector.
- Issues/PRs pesquisados no repositório: sem resultados relevantes.
- Não foram encontrados registros conflitantes do Claude Agent nos arquivos analisados nesta execução.

## Decisão tomada

Foi escolhida uma melhoria pequena, segura e reversível: normalizar de forma centralizada o identificador de cliente usado pelo rate limit.

Motivo: `getClientIdFromRequest()` e `check()` aceitavam strings vindas de socket/proxy com corte de tamanho, mas sem remoção explícita de caracteres de controle. Mesmo sem expor IDs em respostas públicas, endurecer essa borda reduz risco de logs/estado interno com quebras de linha e mantém o rastreamento previsível e leve.

## Arquivos alterados/criados

- `src/rate-limit.js`
  - Criada função exportada `normalizeClientId(value, fallback = 'local')`.
  - Remove caracteres de controle ASCII, normaliza espaços, aplica `trim()`, limita em 120 caracteres e usa fallback seguro.
  - `createFixedWindowRateLimiter().check()` passou a usar `normalizeClientId()`.
  - `getClientIdFromRequest()` passou a normalizar tanto IP/endereço do socket quanto o primeiro item de `X-Forwarded-For` quando `TRUST_PROXY=true`.

- `test/rate-limit.test.js`
  - Importa `normalizeClientId()`.
  - Adicionado teste para remoção de controles, limite de tamanho e fallback seguro.
  - Atualizado teste de `getClientIdFromRequest()` para cobrir normalização de caracteres de controle no socket e no `X-Forwarded-For`.

- `PROJECT_MEMORY_RUN_2026-07-01_RATE_LIMIT_CLIENT_ID_NORMALIZATION.md`
  - Criado este registro de execução com análise inicial, decisão, arquivos alterados, validações, riscos, pendências e próximos passos.

## Commits gerados

- `6c3af79862376cfa996c1f26e349720359084012` - Harden rate limit client id normalization
- `84cfbd03552a327be318779854a3ce1320593acf` - Add client id normalization tests

## Validações executadas

- Revisão estática do diff via leitura dos arquivos atualizados pelo conector GitHub.
- Conferido que a alteração não adiciona dependências externas.
- Conferido que não há execução de código gerado pelo usuário.
- Conferido que a mudança mantém `TRUST_PROXY=false` como padrão seguro.
- Conferido que o limite de 120 caracteres foi mantido para evitar crescimento desnecessário em memória.
- `npm test` não foi executado neste ambiente porque não há checkout local autorizado disponível nesta execução.

## Riscos

- Mudança de comportamento pequena: IDs com caracteres de controle passam a ser tratados como a mesma chave normalizada. Isso é desejável para segurança e previsibilidade, mas pode agrupar entradas artificialmente malformadas.
- Em ambientes com proxy confiável, `X-Forwarded-For` continua sendo usado apenas quando `TRUST_PROXY=true`; a configuração errada de proxy ainda deve ser evitada por operação/documentação.
- Commit final ainda precisa de validação por CI ou execução local de `npm test`.

## Pendências

1. Executar `npm test` em ambiente local ou CI com Node.js 20+.
2. Continuar fortalecendo testes offline das rotas HTTP e contratos de erro.
3. Revisar documentação operacional de proxy somente se o backend vier a ser exposto atrás de gateway local/confiável.
4. Manter o MVP focado em execução local, sem GPU, sem dependências pesadas e sem execução automática de código do usuário.

## Próximos passos sugeridos

Na próxima execução segura, priorizar uma melhoria pequena em documentação ou teste offline de contrato HTTP, especialmente em erros 429/405/415 ou no comportamento de streaming, mantendo o backend leve e reversível.
