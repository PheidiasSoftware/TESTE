# Project memory run - API contract

## Data/hora

2026-06-28 13:36 America/Sao_Paulo.

## Avaliação inicial do repositório

Antes de alterar arquivos, foram verificados:

- metadados do repositório `PheidiasSoftware/TESTE`, branch padrão `main`, permissões de escrita disponíveis;
- `README.md`, com objetivo do backend, endpoints, variáveis, testes e documentação técnica;
- `package.json`, confirmando Node.js 20+, `node --test` e ausência de dependências externas;
- `src/server.js`, que ainda concentra rotas, fila, cache, leitura segura, chamadas Ollama e streaming;
- `src/http.js`, já existente com helpers para JSON, SSE e leitura de corpo com limite;
- `src/ollama.js`, já existente com helpers de payload e parsing de streaming;
- `docs/backend-mvp-status.md`, que apontava falta de contrato HTTP dedicado;
- PRs recentes e issues abertas: não havia PRs ou issues abertas retornadas pelo conector;
- busca por registros do Claude Agent: não foram encontrados registros explícitos retornados pela busca do conector.

## Decisão tomada

A tarefa segura escolhida foi criar documentação dedicada de contrato da API local, pois:

- estava registrada como lacuna do MVP;
- melhora integração com clientes locais Node.js, Flutter/Dart e ferramentas simples;
- não altera comportamento runtime;
- é reversível e não adiciona dependências;
- evita mexer diretamente em `src/server.js` sem validação local completa.

## Arquivos criados

- `docs/api-contract.md`
  - Base URL;
  - padrões gerais de resposta;
  - contrato de `GET /health`;
  - contrato de `GET /api/status`;
  - contrato de `POST /api/generate`;
  - contrato de `POST /api/generate-stream`;
  - contrato de `POST /api/read-file`;
  - erros comuns;
  - exemplo mínimo em Node.js;
  - orientações para clientes locais.

## Arquivos alterados

- `docs/backend-mvp-status.md`
  - Marcou o contrato da API local como documentação atendida;
  - registrou que o README ainda precisa linkar `docs/api-contract.md`;
  - atualizou próximos passos seguros.

## Validações executadas

- Validação estrutural por revisão do conteúdo criado.
- O conector GitHub não executa `npm test`.
- Como não houve alteração de código runtime, o risco de regressão funcional é baixo.

## Bloqueio parcial

- A atualização do `README.md` para linkar `docs/api-contract.md` foi tentada, mas o conector bloqueou a escrita pelo filtro de segurança da ferramenta.
- Para evitar insistir em uma ação bloqueada, o status foi registrado em `docs/backend-mvp-status.md` e este arquivo de memória.

## Riscos

- `src/server.js` segue grande e deve ser modularizado com cautela.
- O contrato documentado precisa ser mantido sincronizado quando endpoints mudarem.
- Testes automatizados não foram executados nesta sessão.

## Próximos passos

1. Linkar `docs/api-contract.md` no `README.md` quando a atualização do arquivo principal estiver disponível.
2. Integrar `src/ollama.js` no servidor em alteração pequena.
3. Integrar `src/http.js` no servidor preservando `MAX_BODY_BYTES`.
4. Extrair cache, fila e leitura segura para módulos dedicados com testes.
5. Rodar `npm test` localmente ou confirmar CI após os próximos commits.
