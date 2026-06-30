# Project memory - fix prompt assertion CI failure

## Data/hora

2026-06-30 America/Sao_Paulo

## Contexto

O usuario enviou uma captura do GitHub Actions mostrando falha no workflow Node.js tests, job npm test on Node.js 20, no commit relacionado a cobertura da sugestao de planejamento para streaming grande.

## Avaliacao inicial do repositorio

Antes de alterar qualquer arquivo, foram examinados:

- metadados do repositorio PheidiasSoftware/TESTE;
- README.md;
- package.json;
- .github/workflows/node-test.yml;
- src/server.js;
- src/large-code.js;
- src/http.js;
- test/server.test.js;
- busca por registros de Claude Agent e memorias relacionadas.

Resumo encontrado:

- O workflow roda npm test com o runner nativo do Node.js.
- A captura indica falha no npm test, mas nao mostra o log detalhado do teste que falhou.
- A revisao estatica encontrou uma incompatibilidade provavel: buildCodingPrompt em src/server.js usa a frase "Evite inventar arquivos...", mas test/server.test.js ainda esperava a frase antiga "Não invente arquivos".
- O teste novo de streaming grande parecia coerente com o fluxo atual: /api/generate-stream retorna JSON 422 antes de abrir SSE quando buildGenerateRequestPayload detecta uma tarefa grande.
- Nao foi encontrado registro claro do Claude Agent nesta execucao.

## Decisao tomada

A menor correcao segura foi alinhar a assercao do teste ao texto atual do prompt, sem alterar comportamento de runtime.

A assercao agora aceita tanto o texto antigo quanto o texto atual:

- "Não invente arquivos";
- "Evite inventar arquivos".

Isso reduz fragilidade do teste sem remover a verificacao de que o prompt continua orientando o modelo a nao inventar arquivos.

## Arquivos alterados

- test/server.test.js
  - atualizada a assercao do teste buildCodingPrompt para aceitar a redacao atual do prompt.

## Commits desta execucao

- 5690f33 Align prompt safety assertion
- este arquivo de memoria

## Validacao

Validado por revisao estatica via conector GitHub.

Nao foi possivel executar npm test localmente pelo ambiente atual. Validacao objetiva pendente:

npm test

ou novo run do GitHub Actions.

## Riscos

- Mudanca pequena, somente em teste.
- Nao altera API, backend de runtime, Ollama, streaming, seguranca ou configuracoes.
- Nao adiciona dependencias.
- Nao executa codigo gerado.

## Proximos passos

1. Verificar novo GitHub Actions apos o commit.
2. Se ainda falhar, abrir o log detalhado do step Run tests para identificar o nome exato do teste.
3. Manter proximas melhorias pequenas e reversiveis.
