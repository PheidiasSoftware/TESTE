# PROJECT_MEMORY_RUN_2026-07-01_PROJECT_FILE_PATH_EDGE_WHITESPACE

## Análise inicial

Repositório `PheidiasSoftware/TESTE` reexaminado antes de alterar qualquer arquivo.

Arquivos e áreas consultadas nesta execução:

- `README.md`: confirma backend Node.js leve para LLM/SLM local, Windows, 8 GB RAM, sem GPU, Ollama, fila, cache, streaming, leitura segura e geração grande em etapas.
- `package.json`: projeto Node.js ESM sem dependências pesadas e scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: rotas HTTP, rate limit, leitura de arquivo, geração normal/streaming, sugestão de geração grande e contrato público sanitizado.
- `src/project-files.js`: validação de caminhos relativos, bloqueio de travessia, `.env`, pastas sensíveis, symlink externo, allowlist de extensões e limite de contexto.
- `src/http.js`: headers de segurança, JSON/SSE seguro e leitura de corpo com limite.
- `test/project-files.test.js` e `test/server.test.js`: suíte offline baseada no test runner nativo do Node.js.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20 sem Ollama.
- `scripts/start-windows.ps1`: helper Windows conservador para PC fraco.
- `docs/backend-mvp-status.md`: histórico e critérios do MVP backend.
- PRs recentes: consulta pelo conector retornou lista vazia.
- Busca textual por registros claros do Claude Agent: não retornou resultado útil nesta execução.

## Decisão

Foi escolhida uma melhoria pequena, segura e reversível em backend: rejeitar caminhos de arquivos com espaço no início ou no fim.

Motivo: caminhos com whitespace nas bordas normalmente são erro de cópia/entrada, podem gerar diagnósticos confusos e não devem ser normalizados silenciosamente em uma API local que lê arquivos do projeto. A validação explícita melhora previsibilidade e segurança sem adicionar dependências ou alterar fluxo de Ollama.

## Arquivos alterados

- `src/project-files.js`
  - `validateSafeProjectFilePath()` agora retorna `400` quando `requestedPath.trim() !== requestedPath`.
  - A alteração ocorre antes de checar NUL, caminho absoluto, travessia e allowlist.

- `test/project-files.test.js`
  - Adicionado teste offline cobrindo caminho com espaço no início e no fim.

## Validações

- Revisão estática feita nos trechos alterados.
- Teste novo é offline e usa apenas `node:test`/`assert`, sem chamar Ollama, sem baixar modelo e sem executar código gerado por usuário.
- `npm test` não foi executado nesta automação porque não há checkout local autorizado no ambiente disponível.
- CI/checks do commit final ainda precisam ser observados no GitHub.

## Riscos

- Baixo risco: arquivos reais com nomes iniciando ou terminando com espaço deixam de ser acessíveis pela API. Isso é intencional e desejável para o contrato seguro do backend.
- Não altera comportamento de geração, streaming, cache, fila, rate limit ou integração Ollama.

## Pendências e próximos passos

- Confirmar `npm test` localmente ou CI verde no GitHub.
- Considerar, em execução futura pequena, alinhar `POST /api/read-file` para rejeitar caminhos maiores que 500 caracteres sem truncamento silencioso, mantendo consistência com `contextFiles`.
- Continuar priorizando melhorias pequenas de segurança, contrato HTTP, consumo de memória e documentação operacional para Windows/8 GB RAM/sem GPU.

## Status MVP backend

Critérios já atendidos por implementação/documentação observada:

- Node.js 20+ sem dependências externas pesadas.
- Backend HTTP local com `GET /health`, `GET /api/status`, `POST /api/generate`, `POST /api/generate-stream`, `POST /api/read-file` e `POST /api/large-code-plan`.
- Integração Ollama local com modelo pequeno sugerido.
- Fila de geração com concorrência conservadora para PC fraco.
- Cache em memória limitado.
- Geração grande orientada por planejamento em etapas.
- Leitura segura de arquivos com raiz de projeto, allowlist, limite de tamanho, bloqueio de `.env`, pastas sensíveis e symlink externo.
- Streaming SSE com serialização segura e nomes de eventos normalizados.
- Testes offline sem dependência de Ollama.

Ainda depende de validação externa:

- Execução objetiva de `npm test`, `npm run test:windows` ou CI verde após esta alteração.
- Decisões de frontend/UX e experiência final de geração assistida fora do escopo direto desta execução.
