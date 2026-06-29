# PROJECT MEMORY - 2026-06-29 - Windows offline test helper

## Avaliação inicial do repositório

Antes de qualquer alteração, o repositório `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub.

Arquivos e áreas verificados:

- `README.md`
- `package.json`
- `.github/workflows/node-test.yml`
- `docs/backend-mvp-status.md`
- `docs/local-validation.md`
- `src/server.js`
- `src/config.js`
- `test/server.test.js`
- `scripts/start-windows.ps1`
- PRs recentes pelo conector GitHub

Resultado da avaliação:

- O backend já está modularizado em cache, fila, HTTP helpers, cliente Ollama, leitura segura de arquivos, rate limit e logger.
- `src/server.js` ainda concentra roteamento e handlers, mas novas refatorações nele devem aguardar validação objetiva por `npm test` ou CI verde.
- O workflow `.github/workflows/node-test.yml` existe e roda `npm test` com Node.js 20.
- O pacote não tinha um comando Windows explícito para rodar a validação offline com padrões conservadores.
- Não foram encontrados PRs recentes pelo conector.
- Não foi encontrado registro claro de Claude Agent nos arquivos analisados nesta execução.

## Decisão tomada

A tarefa segura desta execução foi adicionar um helper Windows offline para facilitar a validação mínima em PC fraco, sem mexer no servidor e sem adicionar dependências.

Motivo:

- O projeto está funcionalmente próximo de MVP completo.
- A pendência principal é validação objetiva.
- Um comando Windows dedicado reduz atrito para o usuário rodar a suíte offline em máquina fraca.
- A alteração é pequena, reversível e não altera comportamento da API.

## Arquivos criados

- `scripts/test-windows.ps1`
- `PROJECT_MEMORY_RUN_2026-06-29_WINDOWS_OFFLINE_TEST_HELPER.md`

## Arquivos alterados

- `package.json`
  - adicionado script `test:windows`.
- `docs/local-validation.md`
  - documentado `npm run test:windows` como alternativa conservadora para validação offline no Windows.
- `docs/backend-mvp-status.md`
  - registrado o novo helper e a decisão operacional desta execução.

## Validações executadas

- Leitura e revisão dos arquivos principais pelo conector GitHub.
- Verificação de PRs recentes pelo conector GitHub.

Não foi executado `npm test` localmente porque esta execução operou pelo conector GitHub, sem checkout local validado disponível para rodar comandos de teste.

## Segurança e limites

O script `scripts/test-windows.ps1`:

- define padrões locais conservadores;
- mantém `GENERATION_CONCURRENCY=1`;
- mantém fila pequena;
- usa `LOG_LEVEL=silent` para reduzir ruído em validação offline;
- roda somente `npm test`;
- não chama Ollama;
- não baixa modelos;
- não executa código gerado por usuário;
- não abre a API publicamente.

## Riscos

- Ainda falta evidência objetiva de `npm test`, `npm run test:windows` ou CI verde no commit mais recente.
- `src/server.js` ainda tem responsabilidade alta, então refatorações adicionais devem aguardar validação.
- Uso real do endpoint `/api/generate` continua dependendo de Ollama instalado e modelo leve disponível.

## Próximos passos

1. Confirmar CI verde ou executar `npm run test:windows` em checkout limpo.
2. Se a validação passar, registrar o backend como MVP funcional completo.
3. Depois disso, iniciar extração pequena de roteamento/handlers de `src/server.js`, mantendo testes de contrato público.
4. Continuar evitando dependências pesadas, execução automática de código e qualquer premissa de GPU.

## Compatibilidade com Claude Agent

Nenhum arquivo de estado, comentário, branch ou PR claramente atribuído ao Claude Agent foi encontrado nesta execução. O registro foi mantido para orientar agentes futuros.
