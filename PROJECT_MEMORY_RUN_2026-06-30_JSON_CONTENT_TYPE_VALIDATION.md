# Project memory - JSON content type validation

## Data/hora

2026-06-30 00:34 America/Sao_Paulo

## Avaliação inicial

Repositório reexaminado antes de alterações: `PheidiasSoftware/TESTE`.

Arquivos e itens consultados:

- `README.md`
- `package.json`
- `src/config.js`
- `src/server.js`
- `src/http.js`
- `test/server.test.js`
- `docs/api-contract.md`
- `docs/backend-mvp-status.md`
- issues abertas
- PRs abertos
- commits recentes de backend/configuração

Não foram encontrados issues ou PRs abertos. Também não apareceu registro claro de outro agente nas consultas disponíveis.

## Decisão

Foi escolhida uma melhoria pequena e segura de backend: validar `Content-Type` nas rotas `POST` antes de ler o corpo da requisição.

Rotas afetadas:

- `POST /api/generate`
- `POST /api/generate-stream`
- `POST /api/read-file`

A API aceita `application/json`, `application/json; charset=utf-8` e media types terminados em `+json`. Requisições com media type não JSON agora retornam `HTTP 415`.

## Arquivos alterados

- `src/server.js`
  - adicionadas funções de validação de media type JSON;
  - validação aplicada antes de `readJsonBody`.
- `test/server.test.js`
  - teste para rejeição de `text/plain`;
  - teste para aceitação de `application/json; charset=utf-8`.
- `docs/api-contract.md`
  - documentado requisito de `Content-Type: application/json` nas rotas POST.
- `docs/backend-mvp-status.md`
  - status do MVP atualizado com o novo endurecimento HTTP.

## Validações

- Consulta de status combinado do commit de documentação retornou sem checks registrados.
- Consulta de workflow runs para o commit também retornou vazia.
- `npm test` não foi executado localmente porque o checkout local continuou bloqueado por autorização no ambiente.

## Riscos

- Clientes que enviavam JSON sem `Content-Type` correto receberão `415`. Isso é desejado para contrato HTTP mais seguro.
- Ainda falta evidência objetiva de testes passando no commit final.

## Próximos passos

1. Confirmar `npm test`, `npm run test:windows` ou CI verde.
2. Evitar refatorações amplas até essa confirmação.
3. Depois, seguir com melhorias pequenas de contrato HTTP, erros e documentação.
