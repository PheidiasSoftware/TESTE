# Project memory - local validation for large-code planning

## Data/hora

2026-06-30 15:38 America/Sao_Paulo

## Pedido

Executar uma melhoria incremental e segura no repositório PheidiasSoftware/TESTE como engenheiro de backend sênior, priorizando backend de LLM/SLM local para programação em PC fraco com Windows, 8 GB de RAM e sem GPU. Antes de alterar, examinar README, package.json, backend, scripts, docs, testes, workflows, issues/PRs, commits recentes, arquivos de memória/estado e possíveis registros do Claude Agent.

## Avaliação inicial do repositório

Arquivos e áreas examinadas antes da alteração:

- README.md
- package.json
- src/config.js
- src/server.js
- src/large-code.js
- test/server.test.js
- .github/workflows/node-test.yml
- docs/backend-mvp-status.md
- docs/local-validation.md
- issues e PRs via conector GitHub
- busca por registros de Claude Agent via conector GitHub

Resumo do estado encontrado:

- O projeto é um backend Node.js 20+ sem dependências externas pesadas.
- O README já descreve o objetivo do backend local para programação com PC fraco, Windows, 8 GB RAM e sem GPU.
- O backend já possui endpoints GET /health, GET /api/status, POST /api/generate, POST /api/generate-stream, POST /api/read-file e POST /api/large-code-plan.
- O backend já possui fila, cache, streaming SSE, rate limit, leitura segura de arquivos, validação de Content-Type JSON, tratamento 405 para método incorreto e sanitização de status público.
- src/large-code.js já implementa detecção de tarefas grandes e planejamento incremental sem chamar o Ollama.
- test/server.test.js já cobre o retorno 422 de /api/generate para tarefa grande e a criação de plano por /api/large-code-plan.
- .github/workflows/node-test.yml já roda npm test com limites conservadores.
- docs/local-validation.md ainda não tinha um procedimento manual dedicado para validar a detecção de tarefa grande e o endpoint /api/large-code-plan sem Ollama.
- A busca por issues/PRs e por registros claros de Claude Agent não retornou resultados relevantes nesta execução.

## Decisão tomada

Como o backend já está próximo do MVP e ainda há pendência recorrente de validação objetiva por npm test/CI, a melhoria segura foi documental: atualizar docs/local-validation.md para orientar a validação manual do fluxo de geração grande sem chamar o Ollama.

Essa mudança evita refatoração ampla em src/server.js enquanto não há evidência nova de CI verde, mas melhora a operação real do projeto em Windows/PC fraco.

## Arquivos alterados/criados

Alterado:

- docs/local-validation.md
  - adicionada cobertura explícita de geração grande na lista de testes offline;
  - corrigido o texto de /api/status para deixar claro que a URL real do Ollama e a raiz absoluta do projeto não são expostas;
  - adicionada seção "Testar detecção de tarefa grande sem chamar modelo";
  - adicionado exemplo PowerShell para esperar HTTP 422 com largeCodeSuggestion;
  - adicionado exemplo PowerShell para validar POST /api/large-code-plan sem Ollama;
  - atualizado checklist final para incluir /api/large-code-plan.

Criado:

- PROJECT_MEMORY_RUN_2026-06-30_LOCAL_VALIDATION_LARGE_CODE.md

## Commits desta execução

- d21e18d Document large-code local validation

## Validações executadas

- Revisão estática via conector GitHub dos arquivos principais e documentação.
- Consulta de issues/PRs via conector GitHub sem achados relevantes.
- Busca textual por Claude Agent sem achados relevantes.

Não foi possível executar npm test localmente neste ambiente. A validação objetiva pendente continua sendo:

```bash
npm test
```

ou, no Windows:

```powershell
npm run test:windows
```

## Riscos

- Risco baixo: alteração apenas documental e reversível.
- Não adiciona dependências.
- Não altera comportamento do backend.
- Não executa código gerado por usuário.
- Não expõe segredos.

## Pendências

- Confirmar npm test ou CI verde no commit mais recente.
- Validar manualmente no Windows os exemplos de docs/local-validation.md.
- Quando houver evidência de testes verdes, considerar pequenas extrações adicionais em src/server.js se ainda fizer sentido.

## Próximos passos seguros

1. Aguardar ou consultar checks do commit mais recente.
2. Se CI/testes estiverem verdes, melhorar gradualmente documentação de contrato ou exemplos de cliente.
3. Evitar mudanças grandes de arquitetura até existir validação objetiva recente.

## Compatibilidade com Claude Agent

Não foram encontrados registros claros de Claude Agent nesta execução. A mudança foi mantida pequena e compatível com qualquer agente futuro, pois apenas documenta validação de fluxos já implementados.
