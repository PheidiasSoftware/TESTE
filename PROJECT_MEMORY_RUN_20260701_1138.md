# PROJECT_MEMORY_RUN_20260701_1138

## Data/hora

2026-07-01 11:38 BRT

## Avaliação inicial do repositório

Antes de qualquer alteração, foram examinados os itens principais do repositório `PheidiasSoftware/TESTE`:

- `README.md`: confirma backend local leve para LLM/SLM de programação em PC fraco com Windows, 8 GB de RAM e sem GPU; documenta Ollama local, rotas, testes, CI leve, cache, fila, geração grande, leitura segura, rate limit e docs técnicas.
- `package.json`: projeto Node.js ESM, sem dependências externas, com scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: contém API local, fila de geração, cache, integração Ollama, geração streaming, leitura segura de arquivos, rate limit e respostas públicas sem expor `OLLAMA_URL` real nem `PROJECT_ROOT`.
- `src/ollama.js`: possui payload conservador para Ollama, sanitização de opções, tratamento seguro de erro upstream, streaming JSONL e validações contra respostas incompletas/malformadas.
- `src/http.js`: centraliza `SECURITY_HEADERS`, envio JSON, SSE e leitura de corpo JSON com limite e erro seguro para cliente encerrado.
- `test/http.test.js`: cobre headers de segurança, JSON, SSE, limite de payload, JSON inválido, JSON não-objeto e encerramento prematuro.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20 rodando `npm test` sem Ollama e com padrões conservadores.
- `docs/api-contract.md`: documenta contrato HTTP, headers, status públicos, geração, streaming e erros.
- `PROJECT_MEMORY.md`: histórico inicial do projeto com decisões, riscos e pendências.

Também foram verificados PRs/issues recentes pelo conector GitHub. Não foram encontrados PRs ou issues recentes. A busca/commits recentes indicaram continuidade de execuções incrementais no backend. Não foram encontrados registros acionáveis do Claude Agent nesta execução.

## Decisão tomada

Foi escolhida uma melhoria pequena, segura, reversível e objetiva no backend HTTP: impedir que headers customizados passados para `sendJson()` sobrescrevam headers críticos de segurança e contrato JSON.

Motivo: `sendJson()` aceita headers adicionais para casos legítimos como `Allow` em 405 e `Retry-After` em 429. Antes desta execução, esses headers eram espalhados depois dos headers críticos, permitindo sobrescrever por engano `content-type`, `cache-control`, CSP ou `x-content-type-options`. Em uma API local de SLM que pode futuramente ganhar novas rotas, é mais seguro preservar o contrato padrão por padrão.

## Arquivos alterados/criados

### `src/http.js`

- Alterada a ordem de composição de headers em `sendJson()`:
  - headers customizados continuam aceitos;
  - `SECURITY_HEADERS`, `content-type: application/json; charset=utf-8` e `cache-control: no-store` agora são aplicados por último;
  - isso evita sobrescrita acidental de headers críticos.

### `test/http.test.js`

- Adicionado teste offline `sendJson não permite sobrescrever headers críticos por engano`.
- O teste confirma que:
  - tentativa de sobrescrever `content-type` continua retornando JSON;
  - tentativa de sobrescrever `cache-control` continua retornando `no-store`;
  - tentativa de enfraquecer CSP é ignorada;
  - tentativa de enfraquecer `x-content-type-options` é ignorada;
  - header legítimo extra, como `Allow`, continua funcionando.

### `PROJECT_MEMORY_RUN_20260701_1138.md`

- Criado este registro de memória/estado da execução.

## Validações executadas

- Revisão estática dos arquivos alterados.
- Conferido que não foram adicionadas dependências externas.
- Conferido que a alteração é compatível com os usos existentes de `sendJson()` para `Allow`, `Retry-After` e headers extras.
- Conferido que a mudança não executa código gerado pelo usuário, não expõe segredos e não altera integração Ollama.
- `npm test` não foi executado nesta execução pelo conector GitHub; a validação final deve ocorrer por CI ou checkout local com Node.js 20+.

## Riscos

- Baixo risco: se alguma rota futura tentar alterar intencionalmente `content-type` via `sendJson()`, isso não funcionará mais. Para outros tipos de resposta, deve-se usar função própria, como já ocorre com SSE em `openEventStream()`.
- Baixo risco de compatibilidade: headers complementares como `Allow`, `Retry-After` e `x-test` continuam permitidos.

## Pendências

1. Executar `npm test` via CI ou localmente em Node.js 20+.
2. Continuar reforçando testes offline de contratos HTTP e integração Ollama sem exigir GPU.
3. Revisar periodicamente docs de MVP para refletir quando o backend puder ser considerado completo para o MVP.
4. Quando houver frontend/cliente, validar fluxo real com `/api/generate-stream` e `/api/large-code-plan` em Windows com 8 GB RAM.

## Próximo passo sugerido

Na próxima execução segura, priorizar uma melhoria pequena em documentação de contrato ou teste offline envolvendo streaming/cache/rate limit, sem adicionar dependências e sem aumentar consumo de memória.
