# Project memory - large-code planning config tests

## Data/hora

2026-06-30 16:21 America/Sao_Paulo

## Pedido

Executar uma melhoria pequena, segura, reversivel e objetiva no backend do repositorio `PheidiasSoftware/TESTE`, sempre examinando o estado atual antes de alterar qualquer arquivo. O foco continua sendo uma LLM/SLM local leve para programacao em PC fraco com Windows, 8 GB de RAM e sem GPU.

## Avaliacao inicial do repositorio

Arquivos e areas examinadas antes da decisao:

- `README.md`
- `package.json`
- `src/config.js`
- `test/config.test.js`
- `.github/workflows/node-test.yml`
- `scripts/test-windows.ps1`
- `docs/backend-mvp-status.md`
- commits recentes relacionados a geracao grande e validacao local
- issues abertas relacionadas a backend, Claude/Agent e geracao grande
- busca textual por registros claros de Claude Agent

Observacoes:

- O backend ja possui configuracao centralizada em `src/config.js` para limites de runtime.
- Os limites `MAX_LARGE_PLAN_FILES`, `MAX_LARGE_PLAN_STEPS` e `MAX_FILES_PER_CONTEXT_BATCH` ja existem no codigo e foram alinhados em README, scripts Windows e CI.
- `test/config.test.js` ja cobre muitos limites gerais, mas a cobertura especifica dos limites de planejamento grande estava diluida/incompleta.
- A busca por issues abertas nao retornou pendencias relevantes.
- A busca por registros claros do Claude Agent nao retornou resultados.
- `docs/backend-mvp-status.md` continua registrando que a recomendacao e evitar refatoracoes amplas ate haver confirmacao objetiva de `npm test`, `npm run test:windows` ou CI verde.

## Decisao tomada

A melhoria segura desta execucao foi criar um teste pequeno e isolado para os limites de configuracao do planejamento de geracao grande.

Motivo:

- Nao altera comportamento em producao.
- Nao adiciona dependencias.
- Nao chama Ollama.
- Nao executa codigo gerado por usuario.
- Aumenta garantia sobre limites conservadores importantes para PC fraco.
- Mantem reversibilidade simples: remover um unico arquivo de teste.

## Arquivos criados/alterados

### Criado

- `test/large-plan-config.test.js`

Cobertura adicionada:

- defaults conservadores:
  - `MAX_LARGE_PLAN_FILES = 50`
  - `MAX_LARGE_PLAN_STEPS = 20`
  - `MAX_FILES_PER_CONTEXT_BATCH = 4`
- clamp para maximos seguros definidos em `RUNTIME_NUMERIC_LIMITS`
- clamp para minimos seguros definidos em `RUNTIME_NUMERIC_LIMITS`
- fallback para valores invalidos como `50x`, `20.5` e `1e3`

### Criado

- `PROJECT_MEMORY_RUN_2026-06-30_LARGE_PLAN_CONFIG_TESTS.md`

## Validacoes executadas

Validacao feita por revisao estatica via conector GitHub.

Nao foi executado `npm test` localmente neste ambiente.

Validacao recomendada:

```bash
npm test
```

No Windows:

```powershell
npm run test:windows
```

## Riscos

Baixo risco.

A alteracao adiciona apenas teste offline e nao muda codigo de runtime. Possivel risco residual: se algum default de `src/config.js` for alterado intencionalmente no futuro, este teste precisara ser atualizado junto.

## Compatibilidade com Claude Agent

Nao foram encontrados registros claros de Claude Agent nesta execucao. A mudanca nao conflita com o fluxo anterior porque e apenas cobertura de configuracao.

## Pendencias

- Confirmar suite com `npm test`, `npm run test:windows` ou CI verde.
- Continuar evitando refatoracoes amplas ate haver validacao objetiva.

## Proximos passos seguros

1. Verificar checks do commit final, se o GitHub Actions registrar execucao.
2. Quando houver CI verde, atualizar `docs/backend-mvp-status.md` para registrar a confirmacao.
3. Se ainda nao houver CI/checks, continuar com melhorias pequenas de testes/documentacao, sem alterar o comportamento central.
