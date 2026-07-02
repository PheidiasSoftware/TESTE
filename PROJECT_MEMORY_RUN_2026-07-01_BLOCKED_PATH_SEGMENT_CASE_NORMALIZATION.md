# PROJECT MEMORY RUN - Blocked Path Segment Case Normalization

## Data

2026-07-01

## Análise inicial

Antes de alterar o repositório, foram examinados os pontos principais disponíveis pelo conector:

- `README.md`: confirma o objetivo de backend Node.js leve para LLM/SLM local, Windows, 8 GB RAM, sem GPU, com Ollama, fila, cache, streaming, leitura segura de arquivos, geração grande em etapas e documentação operacional.
- `package.json`: projeto ESM, Node.js 20+, sem dependências externas pesadas, usando `node --test`.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20, sem Ollama e sem baixar modelos.
- `src/server.js`: rotas locais `GET /health`, `GET /api/status`, `POST /api/generate`, `POST /api/generate-stream`, `POST /api/read-file` e `POST /api/large-code-plan`, com Content-Type JSON, rate limit, fila, cache e status público sanitizado.
- `src/project-files.js`: leitura segura por allowlist, bloqueio de travessia, `.env`, pastas sensíveis, arquivos grandes e symlink real fora da raiz.
- `src/http.js`: headers de segurança, JSON/SSE seguro, limite de corpo, `StringDecoder` UTF-8 e erro 499 para cliente encerrado.
- `src/config.js`: defaults conservadores, normalização de host, porta, Ollama local, modelo, limites e flags.
- `test/project-files.test.js` e `test/http.test.js`: cobertura offline para as proteções atuais.
- `docs/backend-mvp-status.md`: registra que o backend atende ao MVP funcional por implementação/documentação, com validação final ainda dependente de `npm test`, `npm run test:windows` ou CI verde.

Também foi consultada a lista de PRs recentes via conector GitHub e não havia PRs retornados. A busca textual disponível não retornou resultados claros para registros do Claude Agent.

## Decisão

Foi escolhida uma melhoria pequena, segura e reversível em `src/project-files.js`: normalizar segmentos de caminho para minúsculas antes de comparar com a lista de pastas bloqueadas (`.git`, `node_modules`, `dist`, `build`, `.next`, `.cache`).

Motivo: o projeto é voltado para Windows, onde o sistema de arquivos normalmente é case-insensitive. Sem essa normalização, caminhos como `Node_Modules/lib/index.js`, `BUILD/app.js` ou `.Git/config.md` poderiam não ser bloqueados pela comparação textual mesmo representando pastas internas/dependências/artefatos.

## Arquivos alterados

- `src/project-files.js`
  - `relativePath.split(/[\\/]+/)` agora aplica `.map(segment => segment.toLowerCase())` antes da comparação com `blockedSegments`.

- `test/project-files.test.js`
  - Adicionado teste offline garantindo bloqueio de segmentos sensíveis com casing diferente: `Node_Modules`, `BUILD`, `.Git` e `.Cache`.

## Validações

- Revisão estática feita nos arquivos alterados pelo conector.
- Não foi executado código gerado pelo usuário.
- Não foram expostos segredos.
- Não foram adicionadas dependências.
- Não foram feitas ações destrutivas.
- `npm test` não foi executado nesta execução porque não havia checkout local autorizado no ambiente da automação.

## Riscos

Baixo risco. A mudança só torna a regra de bloqueio mais restritiva para pastas já consideradas proibidas. Pode bloquear caminhos que antes passavam apenas por diferença de maiúsculas/minúsculas, o que é desejado para Windows e consistente com o contrato de segurança.

## Pendências

- Confirmar `npm test` ou `npm run test:windows` em ambiente local/CI.
- Verificar checks do commit final quando o GitHub Actions registrar execução.
- Continuar priorizando melhorias pequenas em segurança, streaming, fila, cache, geração grande em etapas e documentação.

## Status MVP backend

O backend permanece compatível com o MVP funcional já descrito em `docs/backend-mvp-status.md`:

- API local Node.js 20+ sem dependências pesadas.
- Ollama local configurável com defaults conservadores.
- Fila de geração e cache em memória.
- Streaming SSE.
- Leitura segura de arquivos textuais pequenos.
- Planejamento de geração grande em etapas.
- Testes offline sem Ollama.

A estabilidade final ainda depende de validação objetiva por `npm test`, `npm run test:windows` ou CI verde e de decisões futuras do usuário/frontend sobre interface e integração.