# PROJECT MEMORY - 2026-06-30 - Windows Smoke Script

## Data/hora

2026-06-30 20:34 America/Sao_Paulo.

## Avaliação inicial do repositório

O repositório `PheidiasSoftware/TESTE` foi reexaminado antes de alterações.

Arquivos e áreas analisadas:

- `README.md`
- `package.json`
- `src/server.js`
- `src/config.js`
- `src/http.js`
- `test/server.test.js`
- `test/config.test.js`
- `test/generate-validation.test.js`
- `.github/workflows/node-test.yml`
- `scripts/start-windows.ps1`
- `scripts/test-windows.ps1`
- `docs/api-smoke-tests.md`
- `docs/client-integration.md`
- commits recentes e arquivo de memória mais recente
- busca por issues abertas
- busca por branches com referência a Claude
- busca por commits/memórias com referência a Claude Agent/estado

Resultado da triagem:

- Backend Node.js sem dependências externas, com foco em PC fraco, 8 GB RAM e sem GPU.
- `README.md` já documenta Ollama local, modelo pequeno, fila, cache, leitura segura, geração grande em etapas, rate limit, scripts Windows e endpoints.
- `package.json` tinha scripts para start, dev, test e test Windows.
- Backend já possui rotas `GET /health`, `GET /api/status`, `POST /api/generate`, `POST /api/generate-stream`, `POST /api/read-file` e `POST /api/large-code-plan`.
- Workflows GitHub Actions executam `npm test` em Node.js 20 sem Ollama.
- Documentação de smoke tests HTTP existia, mas ainda não havia script Windows automatizado para executar esses checks contra backend já iniciado.
- Não foram encontrados issues abertas, branches do Claude Agent ou registros claros do Claude Agent nesta execução.
- Última memória sugeria como próximo passo seguro documentar/fortalecer integração local sem dependências externas.

## Decisão tomada

Foi escolhida uma melhoria pequena, segura e reversível: adicionar um script PowerShell de smoke test HTTP offline para Windows, reaproveitável via `npm run smoke:windows`.

Motivos:

- Ajuda usuários leigos a validar a API local sem copiar vários comandos manuais.
- Não chama Ollama, não baixa modelo e não executa código gerado.
- Valida contrato crítico: status sanitizado, rejeição de `Content-Type` incorreto, task ausente, sugestão de geração grande em etapas, bloqueio de path traversal, 405 e 404.
- Mantém foco em backend/API e em PC Windows fraco.

## Arquivos alterados/criados

### Criado

- `scripts/smoke-windows.ps1`
  - Executa smoke tests HTTP contra backend já iniciado.
  - Usa `HOST` e `PORT` do ambiente ou padrões `127.0.0.1:3131`.
  - Valida respostas esperadas sem chamar `/api/generate` com tarefa pequena válida, evitando chamada ao Ollama.
  - Falha com erro explícito quando contrato sanitizado ou status HTTP esperado não bate.

### Alterado

- `package.json`
  - Adicionado script `smoke:windows` apontando para `scripts/smoke-windows.ps1`.

### Criado nesta etapa

- `PROJECT_MEMORY_RUN_2026-06-30_WINDOWS_SMOKE_SCRIPT.md`
  - Este registro de memória/estado da execução.

## Validações executadas

- Releitura dos arquivos principais via conector GitHub antes das alterações.
- Consulta de issues abertas via conector GitHub.
- Busca de branch/registro do Claude Agent via conector GitHub.
- Revisão estática do novo `scripts/smoke-windows.ps1` após criação.
- Releitura de `package.json` após atualização para confirmar o script `smoke:windows`.
- Consulta de status do commit `286ce9dcb4769253c2fa03ba524916dd422a3970`; ainda sem checks/status registrados no momento da consulta.

Não foi possível executar `npm test` ou `npm run smoke:windows` localmente neste ambiente porque o checkout local via `git clone` permanece bloqueado por autorização. O smoke test também depende de um backend já iniciado em uma máquina Windows/local.

## Commits desta execução

- `2a092a6d2bb750c7fff2484f08dc801af042770b` - criação de `scripts/smoke-windows.ps1`.
- `286ce9dcb4769253c2fa03ba524916dd422a3970` - adição do script `smoke:windows` no `package.json`.

## Riscos

- O script PowerShell foi revisado estaticamente, mas ainda precisa ser executado em Windows para validar compatibilidade real de `Invoke-WebRequest`/PowerShell.
- Como não houve `npm test` local nem CI confirmado, ainda existe risco residual de erro não detectado.
- A alteração não muda runtime da API, não adiciona dependências e é fácil de reverter removendo o script e a entrada em `package.json`.

## Pendências

- Rodar `npm test`.
- Rodar `npm run test:windows` em Windows com Node.js 20+.
- Iniciar o backend com `npm run start:windows` e executar `npm run smoke:windows`.
- Confirmar CI verde no GitHub Actions quando houver workflow run/status para o commit mais recente.

## Próximos passos seguros

1. Documentar no `README.md` o uso de `npm run smoke:windows`, caso o script seja confirmado em Windows.
2. Se o CI/testes forem confirmados, atualizar `docs/backend-mvp-status.md` com evidência objetiva.
3. Continuar com melhorias pequenas em testes/documentação enquanto não houver validação local completa.
