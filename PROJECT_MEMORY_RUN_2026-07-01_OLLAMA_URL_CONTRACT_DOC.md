# PROJECT_MEMORY_RUN_2026-07-01_OLLAMA_URL_CONTRACT_DOC

## Data/hora

2026-07-01 09:20 America/Sao_Paulo.

## Avaliação inicial do repositório

Repositório `PheidiasSoftware/TESTE` examinado antes de qualquer alteração.

Arquivos e áreas analisadas:

- `README.md`: confirma backend Node.js leve para LLM/SLM local focada em programação, Windows, 8 GB RAM, sem GPU, Ollama local, testes offline e guias técnicos.
- `package.json`: projeto ESM sem dependências externas, scripts `start`, `start:windows`, `dev`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: API HTTP nativa com `/health`, `/api/status`, `/api/generate`, `/api/generate-stream`, `/api/read-file`, `/api/large-code-plan`, fila, cache, rate limit, leitura segura de arquivos, SSE e status público sanitizado.
- `src/config.js`: limites conservadores, parsing seguro de inteiros/booleanos, normalização de host, modelo e `OLLAMA_URL`.
- `src/ollama.js`: cliente Ollama com opções conservadoras, tratamento seguro de erros upstream, streaming JSONL, limite de linha pendente e normalização de resposta.
- `test/config.test.js` e `test/ollama.test.js`: cobertura offline para configuração, cliente Ollama, streaming e erros seguros sem chamar runtime externo.
- `docs/backend-mvp-status.md`: registra que o backend atende os critérios funcionais de MVP por implementação e documentação, mas a validação final segue pendente até `npm test`, `npm run test:windows` ou CI verde.
- `PROJECT_MEMORY.md`: histórico de execuções anteriores e pendências recorrentes.
- Issues/PRs: consulta retornou nenhuma issue aberta e nenhum PR recente no repositório.
- Commits recentes: histórico indica melhorias incrementais recentes em normalização de `OLLAMA_URL`, cache, logger, streaming e registros de memória.
- Claude Agent: não foram encontrados registros claros, PRs, issues ou arquivos de estado conflitantes do Claude Agent nos itens examinados.

## Decisão tomada

Foi escolhida uma melhoria documental pequena, segura e reversível: criar um contrato técnico específico para `OLLAMA_URL` e linká-lo no README.

Motivo: o código já normaliza casos comuns de URL do Ollama, mas usuários em Windows podem copiar URLs com `/api`, `/api/generate`, credenciais, query ou hash. Documentar o formato seguro reduz erro operacional, evita exposição acidental de dados locais e mantém a integração previsível em PC fraco sem GPU.

Durante a execução, também foi identificada uma oportunidade de hardening futuro no cliente Ollama exportado: centralizar a montagem do endpoint para tolerar `baseUrl` direto com `/api` ou `/api/generate`. Uma tentativa de alteração direta em `src/ollama.js` pelo conector foi bloqueada pelo ambiente, então a execução foi limitada à documentação segura.

## Arquivos criados/alterados

- Criado `docs/ollama-url-contract.md`
  - Define valor recomendado `OLLAMA_URL=http://127.0.0.1:11434`.
  - Lista formatos a evitar, incluindo `/api`, `/api/generate` e URLs com credenciais/query/hash.
  - Registra checklist de segurança para uso local, sem runtime remoto por padrão.
  - Inclui validação rápida com `npm run smoke:windows`, sem chamar Ollama nem executar código gerado.

- Alterado `README.md`
  - Adicionado link para `docs/ollama-url-contract.md` na seção de guias técnicos.

- Criado este arquivo de memória da execução.

## Validações executadas

- Revisão estática da documentação criada.
- Conferido que a alteração não adiciona dependências.
- Conferido que a alteração não executa código gerado pelo usuário.
- Conferido que a alteração não expõe segredos e orienta a não usar credenciais em `OLLAMA_URL`.
- Conferido que a alteração é reversível por remoção do arquivo novo e do link no README.
- `npm test`, `npm run test:windows` e `npm run smoke:windows` não foram executados nesta execução porque não houve checkout local autorizado pelo ambiente.

## Riscos

- A mudança é documental e não altera comportamento runtime.
- A documentação recomenda loopback/local por padrão; uso de runtime remoto ainda dependeria de decisão explícita do usuário e avaliação de segurança.
- Permanece a oportunidade futura de reforçar a montagem do endpoint diretamente em `src/ollama.js`, com teste offline dedicado.

## Pendências

1. Executar `npm test` ou `npm run test:windows` em ambiente local com Node.js 20+.
2. Confirmar CI verde no commit final quando os checks estiverem disponíveis.
3. Em execução futura, se o conector permitir alteração de código, adicionar helper testável para montagem do endpoint Ollama no cliente exportado, evitando duplicação de `/api/generate` mesmo quando usado fora de `loadConfig()`.
4. Continuar evitando dependências pesadas e manter limites conservadores para Windows com 8 GB RAM sem GPU.

## Próximos passos sugeridos

- Priorizar uma alteração pequena em `src/ollama.js` ou `test/ollama.test.js` para cobrir a montagem robusta do endpoint quando `baseUrl` já contém `/api` ou `/api/generate`.
- Caso o backend seja considerado completo para MVP, registrar somente validação objetiva (`npm test`, `test:windows` ou CI verde) e decisões pendentes de frontend/UX.
