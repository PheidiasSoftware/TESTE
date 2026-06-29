# Project memory - Windows start helper hardening

Data/hora: 2026-06-29 08:36 America/Sao_Paulo

## Avaliação inicial do repositório

Repositório: `PheidiasSoftware/TESTE`
Branch padrão: `main`
Permissões disponíveis pelo conector GitHub: leitura e escrita.

Antes de qualquer alteração, foram examinados:

- `README.md`
- `package.json`
- `.github/workflows/node-test.yml`
- `docs/backend-mvp-status.md`
- `docs/local-validation.md`
- `src/server.js`
- `src/config.js`
- `scripts/test-windows.ps1`
- `scripts/start-windows.ps1`
- `test/config.test.js`

Também foi consultada a lista de PRs recentes no repositório. O conector retornou lista vazia. Não foram encontrados registros claros de Claude Agent por PR, comentário ou arquivo examinado nesta execução.

## Estado técnico observado

O backend já contém os blocos principais do MVP:

- servidor HTTP nativo;
- integração com Ollama via `src/ollama.js`;
- fila conservadora em `src/generation-queue.js`;
- cache em `src/cache.js`;
- leitura segura em `src/project-files.js`;
- logs estruturados em `src/logger.js`;
- rate limit em `src/rate-limit.js`;
- testes offline via `node --test`;
- scripts PowerShell para Windows.

O arquivo `scripts/test-windows.ps1` já validava raiz do repositório e Node.js 20+, mas `scripts/start-windows.ps1` ainda não tinha as mesmas proteções antes de iniciar o backend.

## Decisão tomada

Como a validação objetiva por `npm test`/CI ainda estava pendente nas execuções recentes e o ambiente bloqueou checkout local, foi evitada qualquer refatoração ampla em `src/server.js`.

A tarefa segura escolhida foi endurecer o helper de inicialização Windows, mantendo o escopo pequeno, reversível e alinhado ao foco de PC fraco com Windows, 8 GB RAM e sem GPU.

## Arquivos alterados/criados

Alterados:

- `scripts/start-windows.ps1`
  - adicionada checagem de execução na raiz do repositório;
  - adicionada validação de Node.js 20+;
  - padrões locais agora são definidos explicitamente em variáveis de ambiente quando ausentes;
  - saída agora mostra versão do Node.js e usa as variáveis efetivas que o servidor receberá;
  - verificação do Ollama usa `$env:OLLAMA_URL` e sugestão usa `$env:MODEL`.

- `README.md`
  - documentação do helper Windows atualizada com validação de raiz, Node.js 20+ e padrões explícitos de `HOST`/`PORT`.

- `docs/local-validation.md`
  - seção de start Windows atualizada com as novas validações;
  - checklist passou a incluir `npm run start:windows`.

- `docs/backend-mvp-status.md`
  - registrada a execução atual, arquivos examinados, decisão e alteração;
  - critérios atendidos atualizados para o helper Windows endurecido.

Criado:

- `PROJECT_MEMORY_RUN_2026-06-29_WINDOWS_START_HELPER_HARDENING.md`

## Validações executadas

- Leitura e revisão estática dos arquivos pelo conector GitHub.
- Consulta de PRs recentes pelo conector GitHub.

Não foi possível executar `npm test` localmente porque o ambiente de execução bloqueou checkout/acesso local ao repositório. A alteração foi limitada a PowerShell/documentação e não altera runtime JavaScript do backend.

## Riscos

- A sintaxe PowerShell deve ser validada em Windows real ou por CI/local, pois não houve execução local nesta automação.
- Ainda falta evidência objetiva de CI verde para o commit mais recente.
- `src/server.js` continua concentrando roteamento/handlers; refatorar só depois de teste verde.

## Pendências

1. Confirmar CI verde no GitHub Actions para o commit mais recente.
2. Executar `npm run test:windows` em um checkout limpo no Windows.
3. Executar `npm run start:windows` em Windows com Node.js 20+ para validar as mensagens e o start.
4. Só depois de validação objetiva, considerar extração de roteamento/handlers de `src/server.js`.

## Próximo passo recomendado

Confirmar `npm test`, `npm run test:windows` ou CI verde. Se estiver tudo verde, registrar o backend como MVP funcional completo antes de qualquer nova refatoração estrutural.
