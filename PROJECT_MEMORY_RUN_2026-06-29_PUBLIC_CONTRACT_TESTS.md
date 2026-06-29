# Project memory - public contract tests run

Data/hora: 2026-06-29 01:35 America/Sao_Paulo

## Avaliação inicial do repositório

- Repositório verificado: `PheidiasSoftware/TESTE`.
- Branch padrão informada pelo GitHub: `main`.
- Permissões do conector: leitura e escrita disponíveis.
- PRs recentes do usuário no repositório: nenhum retornado pelo conector.
- Issues abertas relacionadas a `Claude Agent`, backend, MVP ou testes: nenhuma retornada pelo conector.
- Não foram encontrados registros ativos do Claude Agent por issue/PR nesta execução.

## Arquivos examinados antes da alteração

- `README.md`: confirma objetivo do backend local para PC fraco, Node.js 20+, Ollama, scripts Windows, endpoints e guias técnicos.
- `package.json`: projeto Node.js ESM sem dependências externas, com `npm test` usando runner nativo.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20 rodando `npm test` em push/PR/manual.
- `src/server.js`: servidor já usa módulos extraídos para cache, config, fila, HTTP, logger, Ollama, leitura segura de arquivos e rate limit.
- `src/config.js`: mantém padrões conservadores para 8 GB RAM, sem GPU e execução local.
- `test/server.test.js`: cobria rotas públicas e validações básicas, mas ainda não verificava de forma explícita o contrato público de `logging` e `rateLimit`.
- `docs/mvp-readiness-review.md`: recomendava priorizar validação e redução de risco, incluindo testes de contrato para campos públicos.
- `docs/backend-mvp-status.md`: registrava backend funcionalmente pronto para MVP, com pendência de validação por `npm test`/CI.

## Decisão tomada

Como a última revisão recomendava evitar novas refatorações grandes em `src/server.js` até confirmação de testes/CI, a tarefa segura escolhida foi ampliar testes de contrato em `test/server.test.js` sem adicionar dependências, sem tocar em execução de modelo e sem mudar comportamento do servidor.

## Arquivos alterados/criados

- Alterado `test/server.test.js`:
  - criado helper `assertPublicRuntimeContract`;
  - `GET /health` agora valida campos públicos de `logging` e `rateLimit`;
  - `GET /api/status` agora valida os mesmos campos;
  - cobertura garante presença de `appliedToRoutes` para rotas pesadas.
- Alterado `docs/backend-mvp-status.md`:
  - registrado que os testes de contrato público foram ampliados;
  - mantida pendência de validação por `npm test`/CI.
- Criado `PROJECT_MEMORY_RUN_2026-06-29_PUBLIC_CONTRACT_TESTS.md` com este registro de execução.

## Validações executadas

- Validação por inspeção via GitHub Connector.
- Não foi possível executar `npm test` localmente nesta execução porque o ambiente de checkout local não ficou disponível pelo container.
- A CI deve rodar em push na `main` conforme `.github/workflows/node-test.yml`.

## Riscos

- Os testes adicionados assumem que `GET /health` e `GET /api/status` continuarão expondo `logging` e `rateLimit`, conforme contrato documentado no README e status do MVP.
- Se o contrato público for alterado intencionalmente no futuro, esses testes deverão ser ajustados junto com a documentação.
- Ainda falta confirmação objetiva de `npm test`/CI verde após esta alteração.

## Pendências e próximos passos

1. Confirmar CI verde para o commit desta execução.
2. Se CI não aparecer no conector, validar localmente com `npm test` em Node.js 20+.
3. Se validação estiver verde, registrar o backend como MVP funcional completo.
4. Só depois considerar extração de roteamento/handlers de `src/server.js`, em alteração pequena e reversível.
5. Tratar novas melhorias como hardening pós-MVP, não como requisito do MVP inicial.
