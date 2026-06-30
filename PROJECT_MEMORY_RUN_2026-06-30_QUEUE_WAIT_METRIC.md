# PROJECT MEMORY RUN - queueWaitMs não negativo

## Data/hora

2026-06-30 17:38 America/Sao_Paulo

## Avaliação inicial do repositório

Antes de alterar arquivos, o repositório `PheidiasSoftware/TESTE` foi reexaminado via conector GitHub.

Arquivos e áreas analisadas:

- `README.md`
- `package.json`
- `.github/workflows/node-test.yml`
- `src/server.js`
- `src/config.js`
- `scripts/start-windows.ps1`
- `scripts/test-windows.ps1`
- `docs/api-contract.md`
- `docs/backend-mvp-status.md`
- `docs/local-validation.md`
- `test/server.test.js`
- PRs recentes e issues abertas via conector
- commits recentes relacionados a API, memória, contrato e correção de teste
- buscas por registros claros de Claude Agent, arquivos de memória/estado e pendências

Resumo do estado encontrado:

- O backend continua adequado ao objetivo de MVP local: Node.js 20+, HTTP nativo, sem dependências externas pesadas, Ollama local, cache, fila, SSE, rate limit, leitura segura de arquivos e geração grande em etapas.
- O README e os documentos de validação mantêm foco explícito em Windows, PC fraco, 8 GB de RAM e sem GPU.
- Não foram encontrados PRs recentes nem issues abertas relevantes pelo conector.
- A busca disponível não retornou registro claro de Claude Agent nesta rodada.
- O status do MVP ainda recomenda evitar mudanças grandes enquanto não houver evidência objetiva de `npm test`, `npm run test:windows` ou CI verde no commit mais recente.

## Decisão tomada

Foi escolhida uma melhoria pequena, segura, reversível e objetiva no backend: impedir que `queueWaitMs` retorne valor negativo em `POST /api/generate`.

Motivação:

- A métrica anterior era calculada como tempo de parede desde a entrada na fila menos `result.total_duration` reportado pelo Ollama.
- Em runtimes locais, arredondamentos, diferenças de origem de tempo ou valores reportados pelo runtime podem fazer o tempo do modelo parecer maior que o tempo de parede medido pelo Node.
- Um `queueWaitMs` negativo prejudica observabilidade e contrato de cliente.
- A correção não muda fluxo de geração, não chama Ollama, não executa código do usuário e não adiciona dependências.

## Arquivos alterados

- `src/server.js`
  - Adicionada função exportada `estimateQueueWaitMs`.
  - A métrica agora calcula tempo de parede e tempo reportado pelo modelo de forma defensiva.
  - O retorno é sempre `>= 0`.
  - `handleGenerate` passou a capturar `completedAt` uma única vez e usar a função helper.

- `test/server.test.js`
  - Importa `estimateQueueWaitMs`.
  - Adiciona teste unitário garantindo:
    - cálculo normal positivo;
    - retorno `0` quando o tempo reportado pelo runtime excede o tempo de parede;
    - retorno `0` quando os tempos de entrada forem inconsistentes.

- `PROJECT_MEMORY_RUN_2026-06-30_QUEUE_WAIT_METRIC.md`
  - Registra análise inicial, decisão, arquivos alterados, validação, riscos e próximos passos.

## Commits desta execução

- `a1d276a` - `Clamp generation queue wait metric`
- `cebd49e` - `Test non-negative queue wait metric`
- este arquivo de memória

## Validações executadas

Validação feita por revisão estática via conector GitHub:

- Conferido `src/server.js` após alteração, incluindo `estimateQueueWaitMs` e uso em `handleGenerate`.
- Conferido `test/server.test.js` após alteração, incluindo import e teste novo.

Não foi possível executar `npm test` localmente neste ambiente.

Validação objetiva pendente:

```bash
npm test
```

ou, no Windows:

```powershell
npm run test:windows
```

ou confirmação de CI verde no GitHub Actions.

## Riscos

- Baixo risco: alteração pequena e isolada na métrica de resposta JSON de `/api/generate`.
- Não altera endpoint, payload de entrada, chamada ao Ollama, streaming, cache, fila ou leitura de arquivos.
- Não adiciona dependências.
- Não executa código gerado pelo usuário.
- Exportar `estimateQueueWaitMs` amplia a superfície pública de teste, mas é uma função pura pequena e sem efeito colateral.

## Pendências

- Confirmar `npm test`, `npm run test:windows` ou CI verde.
- Se a CI falhar, abrir log detalhado do step `Run tests` antes de nova mudança.
- Evitar refatorações grandes em `src/server.js` até haver evidência objetiva de testes passando.

## Próximos passos seguros

1. Confirmar status do GitHub Actions no commit mais recente.
2. Se passar, considerar pequenas melhorias adicionais em documentação ou testes isolados.
3. Se falhar, priorizar apenas correção pontual do teste/erro reportado.
4. Manter backend MVP estável e deixar frontend/cliente visual como decisão separada do usuário.
