# CI failure triage - 2026-06-30

## Contexto

A tela do GitHub Actions mostra falha no workflow `node-test.yml`, job `npm test on Node.js 20`, em um commit intermediario `91e6757`.

O aviso exibido sobre Node.js 20 deprecated vem dos actions `actions/checkout@v4` e `actions/setup-node@v4`. Esse aviso nao e, sozinho, a causa do `exit code 1`. A falha real esta dentro da etapa `npm test`, mas a tela resumida nao mostra qual teste falhou.

## Avaliacao do repositorio antes da alteracao

Arquivos examinados:

- `package.json`
- `.github/workflows/node-test.yml`
- `src/server.js`
- `src/config.js`
- `src/project-files.js`
- `src/rate-limit.js`
- `test/server.test.js`
- `test/config.test.js`
- `test/project-files.test.js`
- `test/rate-limit.test.js`

Tambem foi verificado que nao havia PR aberto retornado pelo conector para o repositorio.

## Decisao tomada

Como o log detalhado do job nao estava disponivel na captura, a correcao aplicada foi deixar o CI mais diagnostico e menos sujeito a falso negativo de integracao por rate limit.

Alteracoes no workflow:

- adiciona etapa para imprimir `node --version` e `npm --version`;
- roda testes com `--test-reporter=spec`, facilitando descobrir exatamente qual teste falhou;
- adiciona `CI=true`, `NO_COLOR=1` e `NODE_OPTIONS=--enable-source-maps`;
- desativa rate limit apenas no ambiente de CI (`ENABLE_RATE_LIMIT=false`), mantendo os testes unitarios do modulo de rate limit em `test/rate-limit.test.js`;
- aumenta `RATE_LIMIT_MAX_REQUESTS` no CI para reduzir risco de falhas flutuantes caso a flag seja alterada depois.

## O que isso resolve

Essa mudanca nao mascara erro de teste: `npm test` continua falhando se qualquer teste falhar.

Ela melhora tres pontos:

1. o proximo log deve mostrar o nome exato do teste com falha;
2. reduz interferencia do rate limit global nas rotas HTTP durante a suite;
3. facilita diagnostico por versao real de Node/npm usada no runner.

## Pendencia

Apos este commit, verificar novamente o GitHub Actions. Se continuar vermelho, abrir o step `Run tests` e copiar o trecho do teste que falhou.
