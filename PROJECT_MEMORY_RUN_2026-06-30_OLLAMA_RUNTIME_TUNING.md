# PROJECT MEMORY RUN - 2026-06-30 - Ollama Runtime Tuning

## Data/hora

2026-06-30 21:20 BRT.

## Avaliação inicial do repositório

Repositório analisado antes de qualquer alteração, conforme regra obrigatória.

Arquivos e áreas verificados:

- `README.md`: confirma backend local para LLM/SLM de programação em PC fraco com Windows, 8 GB RAM e sem GPU; documenta Node.js 20+, Ollama, scripts Windows, testes, endpoints e variáveis de ambiente.
- `package.json`: projeto Node.js ESM sem dependências externas; scripts `start`, `start:windows`, `dev`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: API HTTP local com `/health`, `/api/status`, `/api/generate`, `/api/generate-stream`, `/api/read-file` e `/api/large-code-plan`; usa fila, cache, rate limit, leitura segura de arquivos, streaming SSE e integração Ollama.
- `src/config.js`: limites conservadores para corpo, timeout, fila, cache, contexto, arquivos, rate limit e normalização de `OLLAMA_URL`, `MODEL`, `HOST` e flags.
- `src/http.js`: helpers JSON/SSE com headers de segurança e limite de payload.
- `src/ollama.js`: cliente Ollama local com payload conservador (`num_ctx`, `num_predict`, `temperature`) e parsing de streaming.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20, sem Ollama/modelo, executando `npm test` offline.
- `test/config.test.js` e `test/http.test.js`: cobrem normalização de configuração e helpers HTTP.
- Busca por issues/PRs abertos com termos de backend/Ollama/Claude/MVP: nenhum item aberto encontrado pelo conector.
- Busca por registros explícitos de Claude Agent: nenhum arquivo/registro visível encontrado pelo conector.
- Histórico recente pesquisado por commits relacionados a backend: há documentação e status de MVP recentes, incluindo revisão de prontidão e validações.

## Decisão tomada

Foi escolhida uma melhoria pequena, segura, reversível e documental: criar um guia de ajuste seguro do Ollama/runtime local para Windows/CPU/8 GB RAM.

Motivo:

- O backend já possui endpoints, fila, cache, streaming, leitura segura, rate limit, testes e documentação avançada.
- A operação em PC fraco depende muito de uso correto de contexto, concorrência e modelo pequeno.
- A mudança não altera comportamento runtime, não adiciona dependências, não executa código gerado e não expõe segredos.

## Arquivos alterados/criados

- Criado `docs/ollama-runtime-tuning.md`.
- Criado este arquivo `PROJECT_MEMORY_RUN_2026-06-30_OLLAMA_RUNTIME_TUNING.md`.

## Validações executadas

- Revisão estática do conteúdo criado.
- Conferência de consistência com variáveis e scripts existentes no README e no código.
- Não foi executado `npm test`, pois a alteração foi documental e o ambiente desta execução usou conector GitHub, sem checkout local autorizado.

## Riscos

- O novo guia não está linkado no índice do README nesta execução para manter a alteração mínima e evitar editar arquivo grande desnecessariamente.
- Valores operacionais são conservadores e alinhados ao estado atual do código, mas podem precisar ajuste se o usuário decidir usar outro runtime além de Ollama.

## Pendências

- Opcional: linkar `docs/ollama-runtime-tuning.md` em `README.md` na seção de guias técnicos.
- Opcional: expor configuração segura de opções Ollama (`num_ctx`, `num_predict`, `temperature`) por variáveis de ambiente, com testes e limites.
- Opcional: adicionar smoke test Linux/macOS equivalente ao script Windows.

## Próximos passos seguros

1. Linkar o novo guia no README em uma execução futura pequena.
2. Adicionar testes para qualquer futura configuração de opções Ollama antes de mudar comportamento runtime.
3. Manter foco em compatibilidade com CPU, 8 GB RAM e sem GPU.

## Compatibilidade com Claude Agent

Nenhum registro, branch, PR, issue ou arquivo explícito do Claude Agent foi encontrado nesta execução pelo conector GitHub. A alteração é documental e não conflita com trabalho paralelo conhecido.
