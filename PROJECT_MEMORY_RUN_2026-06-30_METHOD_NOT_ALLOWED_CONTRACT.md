# PROJECT MEMORY — 2026-06-30 — Method Not Allowed Contract

## Data/hora

2026-06-30 03:38 America/Sao_Paulo.

## Avaliação inicial

Antes de alterar o repositório, foram revisados `README.md`, `package.json`, `src/server.js`, `src/config.js`, `src/project-files.js`, `test/server.test.js`, `docs/api-contract.md` e `docs/backend-mvp-status.md`.

Também foram consultados issues abertas e PRs recentes. Não foram encontrados itens abertos relevantes. A busca por registros claros de Claude Agent também não retornou resultado.

O projeto continua sendo um backend Node.js leve, sem dependências externas, para API local de apoio a programação com Ollama, adequado para Windows em PC fraco com 8 GB de RAM e sem GPU.

## Decisão

A melhoria segura escolhida foi ajustar o contrato HTTP para rotas conhecidas chamadas com método incorreto. Agora o backend diferencia rota inexistente de método errado.

## Alterações

- `src/server.js`: adicionados `ROUTE_METHODS` e `sendMethodNotAllowed`; rotas conhecidas com método incorreto retornam `405`, header `Allow` e campo JSON `allowedMethods`.
- `test/server.test.js`: adicionado teste para `GET /api/generate` retornando `405` e `Allow: POST`.
- `docs/api-contract.md`: documentado o comportamento `405`.
- `docs/backend-mvp-status.md`: status atualizado com a execução.

## Validação

- Reaberto `src/server.js` após alteração para confirmar a presença do roteamento `405`.
- Não foi possível executar `npm test` localmente porque o clone no ambiente retornou bloqueio de autorização.
- Ainda é necessário confirmar `npm test`, `npm run test:windows` ou CI verde.

## Riscos

Baixo risco. A mudança afeta apenas chamadas com método HTTP errado em rotas existentes. Clientes que antes viam `404` nesse caso agora recebem `405`, que é mais correto para integração local.

## Próximos passos

1. Confirmar testes/CI do commit mais recente.
2. Continuar com melhorias pequenas de contrato, validação e documentação.
3. Evitar refatorações grandes até haver validação objetiva dos testes recentes.