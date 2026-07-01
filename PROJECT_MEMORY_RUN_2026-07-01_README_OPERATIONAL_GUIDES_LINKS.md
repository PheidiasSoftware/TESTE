# PROJECT MEMORY RUN - README operational backend guides links

Data/hora local: 2026-07-01 02:19 -03:00

## Avaliação inicial

Arquivos e áreas examinadas antes da alteração:

- `README.md`: confirma objetivo do backend local para LLM/SLM de programação em Windows, 8 GB RAM e sem GPU; lista scripts Windows, testes offline, variáveis de ambiente e endpoints.
- `package.json`: projeto Node.js ESM sem dependências externas, com scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: API local com `/health`, `/api/status`, `/api/generate`, `/api/generate-stream`, `/api/read-file` e `/api/large-code-plan`; mantém Ollama redigido nos status públicos, fila, cache, rate limit e leitura segura.
- `src/http.js`: helpers HTTP com headers de segurança, JSON, SSE e leitura JSON com limite de payload.
- `test/http.test.js` e `test/content-type-contract.test.js`: testes offline para headers, JSON, SSE, limite de payload e contrato de Content-Type.
- `docs/api-contract.md`, `docs/ollama-runtime-tuning.md` e `docs/api-smoke-tests.md`: documentação operacional e de contrato já existente.
- Issues/PRs: não foram encontrados PRs recentes nem issues abertas relevantes via conector GitHub.
- Histórico recente: há commits recorrentes de evolução do backend e documentação de estado/MVP; não foi identificado registro acionável do Claude Agent nesta execução.

## Decisão tomada

A melhoria segura escolhida foi aumentar a descobribilidade dos guias operacionais já existentes no README. O projeto já tinha documentação útil para PC fraco, validação offline e headers de segurança, mas esses documentos não estavam todos ligados na seção principal de guias técnicos.

Essa mudança é pequena, reversível, não altera runtime, não adiciona dependências, não executa código gerado e não expõe segredos.

## Arquivos alterados/criados

- Alterado: `README.md`
  - Adicionados links para:
    - `docs/ollama-runtime-tuning.md`
    - `docs/api-smoke-tests.md`
    - `docs/security-headers.md`
- Criado: `PROJECT_MEMORY_RUN_2026-07-01_README_OPERATIONAL_GUIDES_LINKS.md`

## Validações executadas

- Revisão estática do conteúdo alterado.
- Conferência por leitura dos documentos referenciados disponíveis no repositório.
- `npm test` não foi executado nesta automação porque não há checkout local disponível nesta sessão.

## Riscos

- Risco baixo: alteração apenas documental.
- Se algum arquivo for renomeado futuramente, os links do README precisarão ser ajustados.

## Pendências e próximos passos

- Em uma próxima execução, validar se o README deve também resumir `smoke:windows` na seção de testes.
- Continuar preferindo melhorias pequenas de contrato, testes offline, segurança e documentação para Windows/CPU/8 GB RAM.
- Quando houver checkout local, rodar `npm test` e `npm run smoke:windows` em ambiente Windows.
