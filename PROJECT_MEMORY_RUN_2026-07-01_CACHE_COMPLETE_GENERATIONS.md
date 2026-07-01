# PROJECT_MEMORY_RUN_2026-07-01_CACHE_COMPLETE_GENERATIONS

## Data/hora

2026-07-01 05:35 BRT

## Avaliação inicial do repositório

Antes de qualquer alteração, foram examinados os pontos principais do repositório:

- `README.md`: confirma o objetivo do backend local leve para LLM/SLM de programação em Windows, 8 GB RAM e sem GPU; documenta Ollama, endpoints, testes, CI leve, docs técnicas e variáveis de ambiente.
- `package.json`: projeto Node.js 20+, sem dependências externas, com scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `.github/workflows/node-test.yml`: workflow leve para `npm test` em Node.js 20, sem instalar Ollama nem baixar modelos.
- `src/server.js`: backend HTTP nativo com API local, fila, cache, rate limit, leitura segura de arquivos, geração grande em etapas, streaming SSE e integração com Ollama.
- `src/http.js`: helpers JSON/SSE, headers de segurança, limite de payload e validação de JSON objeto.
- `src/ollama.js`: payload conservador, sanitização de opções, tratamento seguro de erros upstream, validação de resposta non-streaming e leitura JSONL de streaming.
- `src/cache.js`: cache em memória por hash de prompt, limitado por quantidade de entradas.
- `test/server.test.js`, `test/ollama.test.js` e `test/cache.test.js`: testes offline com `node:test`, sem chamada real ao Ollama.
- `PROJECT_MEMORY.md` e arquivos `PROJECT_MEMORY_RUN_*`: histórico indica evolução incremental de backend, segurança, streaming, cache, validações e documentação.
- Issues/PRs: busca por registros abertos/recentes de Claude Agent, backend, Ollama e MVP não retornou conflitos ou pendências acionáveis nesta execução.
- Commits recentes: histórico mostra várias melhorias pequenas anteriores em backend, docs, testes e tratamento de streaming/Ollama.

## Decisão tomada

Executar uma melhoria pequena, segura e reversível no backend: impedir que o cache grave respostas incompletas/parciais do modelo local.

Motivo: em PC fraco, streaming ou geração local pode terminar de forma parcial. Reutilizar uma resposta incompleta em cache seria ruim para programação e poderia induzir o usuário a receber código quebrado repetidamente. O cache agora só aceita resultados com `done === true` e `response` textual.

## Arquivos alterados/criados

- `src/cache.js`
  - Criada função exportada `isCacheablePromptValue()`.
  - `createPromptCache().set()` agora ignora valores não cacheáveis.
  - Adicionada métrica `skippedWrites` em `getStatus()` para observabilidade local.
  - Mantida política LRU simples e limite de entradas, sem dependências externas.

- `test/cache.test.js`
  - Importa e testa `isCacheablePromptValue()`.
  - Atualiza testes existentes para usar resultados completos (`done: true`).
  - Adiciona cobertura para respostas parciais/incompletas que não devem ser gravadas.
  - Confirma que `skippedWrites` aumenta quando o cache recusa valor incompleto.

- `PROJECT_MEMORY_RUN_2026-07-01_CACHE_COMPLETE_GENERATIONS.md`
  - Registra esta execução, análise inicial, decisão, arquivos alterados, validações, riscos, pendências e próximos passos.

## Validações executadas

- Revisão estática dos arquivos alterados.
- Conferido que a alteração usa apenas API nativa do Node.js e não adiciona dependências.
- Conferido que o cache continua limitado por `MAX_CACHE_ENTRIES`.
- Conferido que os testes antigos de cache foram ajustados para o novo contrato de cache somente para geração completa.
- Não foi possível executar `npm test` diretamente neste ambiente porque não há checkout local autorizado; validação final deve rodar no GitHub Actions ou localmente com Node.js 20+.

## Riscos

- Respostas non-streaming em que Ollama retorne `done: false` não serão mais cacheadas. Isso é intencional para evitar memorizar saída parcial.
- A nova métrica `skippedWrites` passa a aparecer em `/health` e `/api/status` dentro de `cache`; clientes rígidos que esperam exatamente os campos anteriores devem ignorar campos extras.
- O cache permanece em memória e reinicia com o processo, adequado para MVP local.

## Pendências

1. Executar `npm test` em ambiente local ou CI para validar a suíte completa.
2. Verificar checks do commit final no GitHub Actions.
3. Considerar documentação curta no README ou docs de cache se a métrica `skippedWrites` passar a ser usada por frontend.
4. Continuar pequenas melhorias em backend: controle de contexto, UX de streaming, documentação de integração local e validações offline.

## Compatibilidade com Claude Agent

Nenhum arquivo de estado, branch, issue, PR ou instrução conflitante do Claude Agent foi encontrado nesta execução. A mudança é incremental e compatível com agentes futuros porque melhora o contrato do cache sem alterar endpoints públicos.

## Próximo passo sugerido

Na próxima execução segura, priorizar uma melhoria pequena de documentação/contrato para a métrica de cache ou uma validação offline adicional em endpoints, mantendo o backend leve para Windows com 8 GB RAM e sem GPU.
