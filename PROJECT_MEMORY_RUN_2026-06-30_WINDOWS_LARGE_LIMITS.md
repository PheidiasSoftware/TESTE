# Project memory - Windows large generation limits

## Data/hora

2026-06-30 14:35 America/Sao_Paulo

## Pedido

Evoluir incrementalmente o backend do repositório PheidiasSoftware/TESTE como uma LLM/SLM local leve para programação, adequada a PC fraco com Windows, 8 GB RAM e sem GPU. Antes de qualquer alteração, examinar o estado atual do repositório, documentação, scripts, testes, workflows, memórias e possíveis registros do Claude Agent.

## Avaliação inicial do repositório

Arquivos e áreas examinados nesta execução:

- README.md
- package.json
- src/server.js
- src/large-code.js
- src/config.js
- test/config.test.js
- scripts/start-windows.ps1
- scripts/test-windows.ps1
- .github/workflows/node-test.yml
- busca por termos relacionados a Claude Agent, memory, PROJECT_MEMORY e large-code
- busca por issues abertas no repositório

Resumo encontrado:

- O backend continua em Node.js puro, sem dependências externas pesadas.
- O foco principal permanece adequado a PC fraco: HOST local, concorrência 1, fila pequena, cache pequeno, limites de contexto e leitura segura.
- A API já possui /api/generate, /api/generate-stream, /api/read-file e /api/large-code-plan.
- A geração grande em etapas já existe e está documentada.
- A detecção automática de tarefas grandes já existe e sugere /api/large-code-plan.
- O README já lista as variáveis de geração grande.
- Os scripts Windows ainda não definiam nem exibiam explicitamente MAX_LARGE_PLAN_FILES, MAX_LARGE_PLAN_STEPS e MAX_FILES_PER_CONTEXT_BATCH.
- Não foram encontrados sinais claros de Claude Agent nesta rodada por busca textual.
- Não foram encontradas issues abertas relevantes nesta rodada.

## Decisão tomada

A melhoria escolhida foi pequena, segura e reversível: alinhar os scripts Windows aos limites de geração grande já existentes no backend.

Motivo:

- melhora a previsibilidade para usuário Windows;
- evita confusão entre documentação e ambiente real dos scripts;
- não altera arquitetura;
- não chama Ollama;
- não executa código gerado;
- não adiciona dependências;
- mantém defaults conservadores para 8 GB RAM sem GPU.

## Arquivos alterados/criados

Alterados:

- scripts/start-windows.ps1
  - adiciona defaults para MAX_LARGE_PLAN_FILES=50, MAX_LARGE_PLAN_STEPS=20 e MAX_FILES_PER_CONTEXT_BATCH=4;
  - imprime os limites de planejamento grande ao iniciar.

- scripts/test-windows.ps1
  - adiciona os mesmos defaults conservadores;
  - imprime os limites antes de rodar npm test.

- README.md
  - documenta que o script Windows mantém limites conservadores de contexto e planejamento grande;
  - adiciona orientação para npm run test:windows.

Criado:

- PROJECT_MEMORY_RUN_2026-06-30_WINDOWS_LARGE_LIMITS.md

## Commits desta execução

- 9e5e93a Expose large-code limits in Windows start script
- 56c93a1 Expose large-code limits in Windows test script
- adef9b4 Document Windows large-code defaults

## Validações executadas

- Revisão estática via conector GitHub dos arquivos principais antes da alteração.
- Revisão de coerência com src/config.js, que já define os mesmos defaults e limites de geração grande.
- Não foi possível executar npm test localmente neste ambiente.
- Validação objetiva pendente por GitHub Actions ou por execução local:

```bash
npm test
```

No Windows:

```powershell
npm run test:windows
```

## Riscos

- Baixo risco: alterações apenas em scripts e documentação.
- Pode haver divergência futura se os defaults de src/config.js mudarem e os scripts não forem atualizados junto.
- Não há mudança de comportamento de API nem de chamadas ao modelo.

## Pendências

- Confirmar CI/checks do GitHub para o commit final.
- Rodar npm test ou npm run test:windows em máquina com Node.js 20+.
- Em rodada futura, considerar adicionar documentação curta de troubleshooting para Windows/Ollama quando /api/generate falhar por timeout ou Ollama offline.

## Compatibilidade com Claude Agent

Nenhum registro claro do Claude Agent foi encontrado nesta execução. A mudança foi feita de forma isolada e reversível para reduzir conflito com qualquer agente futuro.

## Próximos passos seguros

1. Confirmar CI ou teste local.
2. Melhorar troubleshooting de erros comuns do Ollama sem executar nada automaticamente.
3. Avaliar se docs/backend-mvp-status.md deve ser atualizado quando todos os critérios do MVP backend estiverem completos.
