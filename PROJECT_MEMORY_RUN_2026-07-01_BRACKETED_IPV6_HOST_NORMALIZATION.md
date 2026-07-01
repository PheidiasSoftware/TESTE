# PROJECT MEMORY RUN - 2026-07-01 - Bracketed IPv6 host normalization

## Análise inicial

Antes de alterar, o repositório `PheidiasSoftware/TESTE` foi reexaminado com foco em backend leve para PC fraco com Windows, 8 GB RAM e sem GPU.

Arquivos e áreas lidas nesta execução:

- `README.md`
- `package.json`
- `.github/workflows/node-test.yml`
- `docs/backend-mvp-status.md`
- `scripts/start-windows.ps1`
- `src/config.js`
- `src/http.js`
- `src/server.js`
- `src/ollama.js`
- `test/http.test.js`
- `test/config.test.js`

Também foram consultados PRs recentes e issues abertas pelo conector GitHub. Não foram encontrados PRs recentes nem issues abertas. A busca disponível não retornou registros claros de Claude Agent.

## Decisão

Foi escolhida uma melhoria pequena, segura, reversível e objetiva em configuração de backend: normalizar `HOST=[::1]` para `::1`.

Motivo: `[::1]` é uma forma comum de representar IPv6 loopback em URLs, mas `server.listen()` no Node espera o host sem colchetes. A versão anterior aceitava `[::1]` como host permitido, o que poderia causar falha de bind em ambiente local. A mudança preserva o bloqueio contra bind público e mantém o padrão seguro `127.0.0.1`.

## Arquivos alterados

- `src/config.js`
  - `ALLOWED_LOCAL_HOSTS` agora contém `::1` sem a variante com colchetes.
  - `normalizeHost()` converte explicitamente `[::1]` para `::1` antes de validar a allowlist.

- `test/config.test.js`
  - Cobertura adicionada para `normalizeHost('[::1]') === '::1'`.
  - Cobertura adicionada para `loadConfig({ HOST: '[::1]' }).HOST === '::1'`.

## Validações

- Revisão estática feita nos trechos alterados.
- Os testes adicionados usam apenas `node:test` e `node:assert`, sem dependências externas.
- `npm test` não foi executado porque o checkout local está bloqueado no ambiente desta execução.

## Riscos

- Baixo risco: alteração concentrada em parsing de configuração.
- A mudança pode afetar apenas quem configurou `HOST=[::1]`; nesse caso, passa a funcionar com o valor aceito pelo Node.
- Hosts públicos continuam bloqueados por fallback para `127.0.0.1`.

## Pendências

- Confirmar `npm test` localmente ou via CI verde após os commits desta execução.
- Continuar evitando refatorações grandes até haver validação automatizada confirmada.

## Próximos passos sugeridos

- Adicionar, em execução futura, documentação curta no guia Windows explicando que `HOST` deve permanecer em loopback (`127.0.0.1`, `localhost` ou `::1`).
- Revisar se há outros parâmetros que aceitam formas de URL mas são usados como host bruto.

## Status MVP backend

Pelos documentos e código lidos, o backend segue atendendo aos critérios funcionais de MVP: API local Node.js 20+, sem dependências pesadas, Ollama/SLM local, fila conservadora, cache em memória, streaming SSE, leitura segura de arquivos, planejamento de geração grande e testes offline. A pendência objetiva continua sendo validação por `npm test`, `npm run test:windows` ou CI verde recente.