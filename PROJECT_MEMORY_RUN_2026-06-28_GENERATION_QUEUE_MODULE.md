# Project memory - Generation queue module

## Data/hora

2026-06-28 20:36 America/Sao_Paulo

## Avaliação inicial do repositório

Arquivos e áreas examinadas antes de alterar:

- `README.md`: confirma objetivo do backend local para PC fraco com Windows, 8 GB RAM e sem GPU, endpoints, variáveis, testes e guias técnicos.
- `package.json`: projeto Node.js 20+, sem dependências externas, scripts `start`, `start:windows`, `dev` e `test`.
- `src/server.js`: servidor já integrado a `src/config.js`, `src/http.js`, `src/ollama.js`, `src/cache.js` e `src/rate-limit.js`; ainda concentrava a implementação da fila de geração.
- `test/server.test.js`: testes ainda importavam `createGenerationQueue` via `src/server.js`.
- `docs/backend-mvp-status.md`: próximos passos indicavam extrair a fila para `src/generation-queue.js` e validar testes/CI.
- Histórico recente acessível: commits anteriores modularizaram cache, Ollama e HTTP; não encontrei registro explícito de branch/PR/issue ativa do Claude Agent nesta execução.

## Decisão tomada

Executar uma melhoria pequena, reversível e alinhada com o próximo passo registrado: extrair a fila de geração para módulo próprio sem mudar contrato HTTP e mantendo reexport em `src/server.js` para compatibilidade com testes existentes.

## Arquivos criados

- `src/generation-queue.js`
  - Implementa `createGenerationQueue`.
  - Mantém concorrência conservadora.
  - Mantém limite de fila com erro `statusCode: 429`.
  - Adiciona métrica `rejectedGenerations`.
  - Normaliza configurações inválidas para valores seguros.
  - Rejeita job inválido com `statusCode: 400`.

- `test/generation-queue.test.js`
  - Testa limite de fila cheia.
  - Testa concorrência 1 para PC fraco.
  - Testa falhas sem travar próximo item.
  - Testa normalização de configuração inválida.
  - Testa rejeição de job inválido.

## Arquivos alterados

- `src/server.js`
  - Removeu implementação local da fila.
  - Importa `createGenerationQueue` de `src/generation-queue.js`.
  - Mantém `export { createGenerationQueue }` para compatibilidade.

- `docs/backend-mvp-status.md`
  - Registrou a extração e integração de `src/generation-queue.js`.
  - Atualizou próximos passos para focar em validação e futura extração de leitura segura para `src/project-files.js`.

## Validações executadas

- Conferência estrutural via GitHub connector após alteração de `src/server.js` confirmou import e reexport do novo módulo.
- Consulta de status do commit mais recente não retornou checks/status ainda.
- Não foi possível executar `npm test` localmente pelo conector GitHub; validação final depende de CI ou ambiente local.

## Riscos

- `src/server.js` ainda concentra roteamento e leitura segura de arquivos.
- Como o conector não executa os testes, pode haver regressão sintática só detectável por CI/local.
- A nova métrica `rejectedGenerations` adiciona campo ao status da fila, mas não remove campos antigos.

## Pendências

- Verificar CI ou rodar `npm test` localmente.
- Considerar remover os testes duplicados de fila de `test/server.test.js` depois que o CI confirmar estabilidade do novo módulo.
- Extrair leitura segura de arquivos para `src/project-files.js` com testes próprios.

## Próximos passos recomendados

1. Validar `npm test`/CI no commit mais recente.
2. Extrair `validateSafeProjectFilePath`, `readProjectFile` e `buildContextFromFiles` para `src/project-files.js`.
3. Atualizar `test/server.test.js` para focar em HTTP/integração e deixar testes unitários de fila em `test/generation-queue.test.js`.
4. Reavaliar formalmente o MVP backend após a extração de leitura segura.
