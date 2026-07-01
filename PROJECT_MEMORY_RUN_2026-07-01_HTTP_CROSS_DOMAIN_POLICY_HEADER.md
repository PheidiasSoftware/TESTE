# PROJECT MEMORY RUN - 2026-07-01 - HTTP cross-domain policy header

## Análise inicial

Antes de alterar, o repositório `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub com foco em backend leve para PC fraco com Windows, 8 GB de RAM e sem GPU.

Arquivos/áreas consultados nesta execução:

- `README.md`
- `package.json`
- `.github/workflows/node-test.yml`
- `PROJECT_MEMORY.md`
- `docs/backend-mvp-status.md`
- `docs/security-headers.md`
- `src/server.js`
- `src/config.js`
- `src/http.js`
- `src/ollama.js`
- `src/large-code.js`
- `test/http.test.js`
- `test/large-code.test.js`

Também foram consultados:

- commits recentes relacionados ao backend;
- PRs recentes do repositório, sem resultados;
- issues abertas com busca relacionada a backend/Ollama, sem resultados relevantes;
- registros de memória do projeto e busca por sinais de Claude Agent, sem instruções conflitantes encontradas nesta execução.

## Decisão

A melhoria escolhida foi pequena, segura, reversível e objetiva: reforçar o helper HTTP central com o header `x-permitted-cross-domain-policies: none`.

Motivo: o backend já centraliza headers de segurança para JSON e SSE em `src/http.js`. Adicionar esse header reduz superfície de exposição por políticas cross-domain legadas sem dependências externas, sem custo relevante de CPU/RAM e sem alterar contrato funcional das rotas.

## Arquivos alterados

- `src/http.js`
  - Adicionado `x-permitted-cross-domain-policies: none` em `SECURITY_HEADERS`.
  - Como `sendJson()` e `openEventStream()` já reutilizam `SECURITY_HEADERS`, a proteção passa a valer para respostas JSON e SSE.

- `test/http.test.js`
  - Atualizado teste de contrato estável de `SECURITY_HEADERS`.
  - Atualizados testes de `sendJson()` e `openEventStream()` para conferir o novo header.
  - Adicionado cenário garantindo que caller não sobrescreve o header crítico com valor inseguro.

- `docs/security-headers.md`
  - Documentado o novo header e seu motivo.

## Validações

- Revisão estática feita nos arquivos alterados.
- A alteração não adiciona dependências.
- A alteração não chama Ollama, não baixa modelo e não executa código gerado pelo usuário.
- `npm test` não foi executado porque o ambiente desta execução não disponibilizou checkout local autorizado; a validação final deve ocorrer pela CI ou por `npm test`/`npm run test:windows` em ambiente local.

## Riscos

- Baixo risco: o header é apenas defensivo e não altera payloads JSON, nomes de eventos SSE, fila, cache, Ollama ou leitura de arquivos.
- Clientes incomuns que dependam explicitamente de políticas cross-domain legadas devem ser tratados como fora do escopo do backend local seguro.

## Status MVP backend

O backend continua atendendo os critérios técnicos do MVP por implementação e documentação: API local, Ollama/SLM via HTTP, streaming SSE, fila conservadora, cache em memória, leitura segura de arquivos, detecção de tarefas grandes, planejamento em etapas, rate limit, logs com redaction, testes offline e documentação para Windows/PC fraco.

A pendência principal permanece a confirmação objetiva de `npm test`, `npm run test:windows` ou CI verde após os commits recentes.

## Próximos passos sugeridos

1. Confirmar checks da CI para o commit final desta execução.
2. Corrigir a seção final truncada do `README.md`, que termina em `Eventos emitidos:` e pode confundir novos usuários.
3. Manter próximas execuções pequenas até haver validação objetiva da suíte completa.
