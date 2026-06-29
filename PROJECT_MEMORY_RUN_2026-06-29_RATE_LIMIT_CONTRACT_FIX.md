# Project memory — rate limit contract fix

Data/hora: 2026-06-29 02:35 America/Sao_Paulo

## Avaliação inicial do repositório

- Repositório analisado: `PheidiasSoftware/TESTE`, branch padrão `main`, público, com permissão de escrita pelo conector.
- README revisado: confirma backend Node.js 20+ sem dependências externas, foco em PC fraco Windows com 8 GB de RAM e sem GPU, Ollama local e modelo `qwen2.5-coder:1.5b-instruct`.
- `package.json` revisado: projeto ESM, scripts `start`, `start:windows`, `dev` e `test`, sem dependências externas.
- `src/server.js` revisado: servidor HTTP nativo modularizado com `cache`, `generation-queue`, `http`, `logger`, `ollama`, `project-files` e `rate-limit`.
- `src/config.js` revisado: limites conservadores para fila, cache, leitura de arquivos, contexto e rate limit.
- `src/rate-limit.js` revisado: status público expunha `activeClients`, mas não `trackedClients`.
- `test/server.test.js` revisado: contrato público de `/health` e `/api/status` espera `rateLimit.trackedClients`.
- `test/rate-limit.test.js` revisado: cobria limite, separação de clientes, desligamento, poda e proxy, mas não o alias `trackedClients`.
- PRs recentes do usuário no repositório: nenhum PR encontrado pelo conector.
- Busca por registros do Claude Agent: nenhum registro claro localizado nesta execução pelo conector.

## Decisão tomada

Corrigir uma possível regressão de teste/contrato sem refatoração grande: expor `trackedClients` no status do rate limit e preservar `activeClients` como alias de compatibilidade.

Motivo: `test/server.test.js` já validava `body.rateLimit.trackedClients`, enquanto `src/rate-limit.js` retornava apenas `activeClients`. Isso poderia quebrar `npm test` e clientes locais que dependam do contrato público recém-documentado.

## Arquivos alterados/criados

- Alterado `src/rate-limit.js`:
  - `getStatus()` agora calcula `trackedClients` a partir de `clients.size`.
  - Mantém `activeClients` com o mesmo valor para compatibilidade com testes e integrações anteriores.
- Alterado `test/rate-limit.test.js`:
  - Adicionado teste específico para garantir que `trackedClients` existe e que `activeClients` continua equivalente.
  - Atualizado teste de poda para validar os dois campos após limpeza.
- Alterado `docs/backend-mvp-status.md`:
  - Registrada a correção do contrato de `rateLimit.trackedClients`.
  - Próximos passos atualizados para validar CI após essa correção.
- Criado `PROJECT_MEMORY_RUN_2026-06-29_RATE_LIMIT_CONTRACT_FIX.md`:
  - Este registro de memória da execução.

## Validações executadas

- Revisão estática via conector GitHub dos arquivos principais.
- Comparação lógica entre contrato esperado por `test/server.test.js` e status produzido por `src/rate-limit.js`.
- Não foi possível executar `npm test` nesta execução: o checkout local pelo ambiente de execução retornou bloqueio de autorização. A validação final ainda depende de CI ou execução local.

## Riscos

- Baixo risco: alteração apenas adiciona campo público e mantém o campo antigo.
- Sem dependências novas.
- Sem mudanças destrutivas.
- Sem execução automática de código do usuário.
- Sem aumento de uso de memória relevante; `trackedClients` apenas reaproveita `clients.size`.

## Pendências

- Confirmar `npm test` no GitHub Actions ou localmente.
- Verificar se o último commit acionou CI e se passou.
- Depois de CI verde, registrar o backend como MVP funcional completo.

## Próximos passos seguros

1. Verificar status do CI para o último commit.
2. Se CI verde, atualizar `docs/mvp-readiness-review.md` e `docs/backend-mvp-status.md` declarando MVP backend validado.
3. Se CI falhar, corrigir apenas a falha objetiva antes de qualquer refatoração.
4. Evitar mexer em `src/server.js` até a validação estar verde.

## Compatibilidade com Claude Agent

Nenhum arquivo, branch, PR, issue ou registro claramente atribuído ao Claude Agent foi encontrado nesta execução. A correção foi feita de forma pequena e compatível com futuras execuções de outros agentes.
