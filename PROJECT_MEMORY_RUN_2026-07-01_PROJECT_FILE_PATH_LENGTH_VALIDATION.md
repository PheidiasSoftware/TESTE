# PROJECT MEMORY RUN - 2026-07-01 - Project file path length validation

## Análise inicial

Repositório analisado antes da alteração:

- `README.md`: confirma backend Node.js leve para LLM/SLM local em PC fraco com Windows, 8 GB RAM e sem GPU, com Ollama local, fila, cache, streaming, leitura segura de arquivos e documentação técnica.
- `package.json`: projeto ESM, Node.js >=20, sem dependências externas pesadas, scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: rotas locais `GET /health`, `GET /api/status`, `POST /api/generate`, `POST /api/generate-stream`, `POST /api/read-file` e `POST /api/large-code-plan`; valida `Content-Type`, aplica rate limit e usa fila/cache.
- `src/project-files.js`: concentra leitura segura de arquivos, allowlist de extensão, bloqueio de travessia, `.env`, diretórios sensíveis, symlink fora da raiz e truncamento UTF-8 seguro.
- `src/http.js`, `src/config.js` e `src/ollama.js`: já contêm hardenings recentes para JSON, SSE, headers, URL local do Ollama e streaming.
- `test/project-files.test.js` e `test/http.test.js`: suíte offline com `node:test`, sem chamar Ollama nem executar código gerado.
- `scripts/start-windows.ps1` e `scripts/test-windows.ps1`: helpers conservadores para Windows.
- `.github/workflows/node-test.yml`: CI leve com Node.js 20 e `npm test`, sem Ollama.
- `docs/backend-mvp-status.md`: registra que o MVP backend está funcionalmente atendido, com validação final ainda dependente de `npm test`/CI verde.
- Issues/PRs: consulta retornou sem issues abertas e sem PRs recentes.
- Registros do Claude Agent: não foram encontrados registros claros nas buscas disponíveis.

## Decisão

Foi escolhida uma melhoria pequena, segura e reversível no backend de leitura de arquivos: rejeitar caminhos relativos acima de 500 caracteres diretamente em `validateSafeProjectFilePath`.

Motivo: `contextFiles` já rejeitava caminho longo antes de ler arquivos. Centralizar a validação no helper principal reduz risco de uso futuro incorreto e evita que chamadas internas aceitem path excessivo por engano.

## Arquivos alterados

- `src/project-files.js`
  - `validateSafeProjectFilePath` agora rejeita `requestedPath.length > MAX_CONTEXT_FILE_PATH_CHARS` com `400`.
- `test/project-files.test.js`
  - Adicionado teste offline cobrindo rejeição de caminho acima do limite antes de resolver o path.

## Validações

- Revisão estática pelo conector GitHub após alteração:
  - Confirmado o novo bloqueio em `src/project-files.js`.
  - Confirmado o novo teste em `test/project-files.test.js`.
- `npm test` não foi executado neste ambiente porque não há checkout local autorizado/disponível para rodar a suíte.
- A alteração não chama Ollama, não baixa modelos, não executa código gerado e não adiciona dependências.

## Riscos

- Baixo risco: a validação só rejeita caminhos acima de 500 caracteres, que já eram incompatíveis com o contrato de `contextFiles`.
- Observação: `POST /api/read-file` ainda deve ser revisado em execução futura para não truncar `body.path` antes de chamar `readProjectFile`; essa mudança exigirá edição segura de `src/server.js`.

## Status MVP backend

Critérios principais continuam atendidos:

- Node.js 20+ sem dependências pesadas.
- API local com health/status, geração, streaming, leitura segura de arquivos e planejamento de geração grande.
- Fila com concorrência conservadora, cache em memória, rate limit e headers de segurança.
- Contratos e helpers Windows documentados para PC fraco.
- Testes offline não dependem de Ollama/GPU.

Ainda depende de decisão/validação:

- Confirmar `npm test`, `npm run test:windows` ou CI verde após os commits recentes.
- Frontend/UX para consumo da API local.
- Decisão do usuário sobre modelo padrão final e fluxo de geração grande na interface.

## Próximos passos sugeridos

1. Revisar `POST /api/read-file` para remover truncamento silencioso de `body.path` e deixar a validação central decidir.
2. Rodar `npm test` em checkout local ou confirmar CI verde.
3. Manter próximas execuções pequenas e focadas em testes, segurança e documentação.
