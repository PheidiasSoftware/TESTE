# PROJECT MEMORY — execução 2026-06-29 — revisão de limites numéricos

## Data/hora

2026-06-29 21:35 America/Sao_Paulo.

## Avaliação inicial do repositório

Antes de qualquer alteração, o repositório `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub.

Arquivos e áreas analisadas:

- `README.md`
- `package.json`
- `src/config.js`
- `src/server.js`
- `src/http.js`
- `src/project-files.js`
- `test/config.test.js`
- `test/http.test.js`
- `test/server.test.js`
- `docs/backend-mvp-status.md`
- PRs recentes do usuário no repositório
- issues abertas no repositório

Resumo encontrado:

- Projeto Node.js 20+ sem dependências externas pesadas.
- Backend HTTP local com endpoints de health/status, geração, streaming SSE e leitura segura de arquivos.
- Integração local via Ollama, com modelo pequeno recomendado para CPU.
- Configuração já endurecida para host local, porta, URL do Ollama, nome de modelo, flags booleanas, inteiros completos, extensões permitidas, logs e leitura segura.
- Não foram encontrados PRs recentes nem issues abertas pelo conector.
- Não foram encontrados registros claros do Claude Agent nos dados consultados nesta execução.

## Decisão tomada

Foi identificada uma lacuna incremental: os limites numéricos de ambiente já possuem padrões conservadores, validação de inteiro e mínimos, mas ainda poderiam aceitar valores manualmente muito altos. Em PC fraco com 8 GB de RAM e sem GPU, isso pode causar pressão de memória, latência excessiva ou fila grande demais.

A primeira decisão técnica foi implementar tetos conservadores diretamente em `src/config.js` com testes em `test/config.test.js`. Porém, a tentativa de atualização do arquivo de configuração foi bloqueada pela verificação de segurança do conector ao enviar o payload completo do arquivo. Para manter a execução segura e reversível, nenhuma alteração de código foi aplicada nessa tentativa.

Como alternativa segura nesta execução, foi criada documentação técnica específica registrando a lacuna, os tetos sugeridos e critérios de aceitação para implementação futura.

## Arquivos alterados/criados

Criado:

- `docs/runtime-numeric-limits-review-2026-06-29.md`
- `PROJECT_MEMORY_RUN_2026-06-29_NUMERIC_LIMITS_REVIEW.md`

Nenhum arquivo de código foi alterado nesta execução.

## Validações executadas

- Leitura estrutural e técnica dos arquivos principais pelo conector GitHub.
- Consulta de PRs recentes: sem resultados.
- Consulta de issues abertas: sem resultados.
- Não foi possível executar `npm test` porque o ambiente de automação não autorizou checkout local do repositório em execuções anteriores e esta execução usou apenas o conector GitHub.

## Riscos

- A documentação criada não aplica o limite em runtime; ela registra a melhoria recomendada.
- A validação final por `npm test`, `npm run test:windows` ou CI verde continua pendente.
- A implementação futura deve evitar mudança ampla no servidor e deve se limitar a `src/config.js` e testes.

## Pendências

- Implementar tetos conservadores para variáveis numéricas em `src/config.js` quando o conector permitir alteração segura do arquivo.
- Adicionar testes para valores acima do teto em `test/config.test.js`.
- Confirmar `npm test`, `npm run test:windows` ou CI verde no commit mais recente.

## Próximos passos sugeridos

1. Adicionar função de parsing numérico com mínimo e máximo em `src/config.js`.
2. Preservar todos os padrões atuais documentados no README.
3. Cobrir pelo menos `MAX_CONTEXT_BYTES`, `MAX_BODY_BYTES`, `MAX_QUEUE_SIZE`, `GENERATION_CONCURRENCY` e `RATE_LIMIT_MAX_CLIENTS` com testes de teto.
4. Depois disso, atualizar `docs/backend-mvp-status.md` com a evidência da implementação.

## Compatibilidade com Claude Agent

Nenhum PR, issue, arquivo de estado ou registro explícito do Claude Agent foi encontrado nesta execução. A documentação criada é compatível com execução futura por outro agente porque descreve a lacuna, os limites sugeridos e os critérios de aceitação sem exigir contexto externo.
