# Project memory - automatic large context detection

## Data/hora

2026-06-30 America/Sao_Paulo

## Pedido

O usuario pediu o proximo refinamento: o backend deve perceber automaticamente quando uma chamada normal parece grande demais e sugerir o fluxo de planejamento. Tambem pediu que a continuidade das melhorias fique agendada.

## Avaliacao inicial do repositorio

Antes de alterar arquivos, foram examinados:

- metadados do repositorio PheidiasSoftware/TESTE;
- README.md;
- package.json;
- src/large-code.js;
- src/server.js;
- test/server.test.js;
- docs/large-code-generation.md.

Resumo encontrado:

- O backend ja possuia /api/generate e /api/generate-stream para geracao normal.
- O backend ja possuia /api/large-code-plan para planejamento de codigo grande em etapas.
- A lacuna era que o usuario ainda precisava escolher manualmente o endpoint correto.
- Nao foi encontrado registro claro do Claude Agent nesta execucao.

## Decisao tecnica

Foi implementada deteccao automatica para que /api/generate e /api/generate-stream nao tentem chamar o Ollama diretamente quando a tarefa aparenta ser grande demais.

Sinais usados:

- task longa;
- muitos contextFiles;
- presenca de targetFiles;
- contexto truncado;
- termos como CRUD completo, sistema completo, projeto completo, contexto gigante, muitos arquivos e grande quantidade de codigo.

Quando detecta esse caso, o backend responde HTTP 422 com largeCodeSuggestion apontando para POST /api/large-code-plan.

Tambem existe bypass explicito com forceSingleGeneration=true, para casos em que o usuario realmente quer forcar a geracao unica.

## Arquivos alterados

- src/large-code.js
  - adicionada funcao assessLargeCodeRequest;
  - adicionados padroes de deteccao de tarefa grande;
  - mantida a estrategia de planejamento em etapas.

- src/server.js
  - /api/generate e /api/generate-stream agora avaliam a tarefa antes de chamar o Ollama;
  - se for grande, retornam 422 com largeCodeSuggestion;
  - exporta assessLargeCodeRequest;
  - preserva o fluxo normal para tarefas pequenas.

- test/large-code.test.js
  - cobre deteccao positiva de tarefa grande;
  - cobre tarefa pequena sem desvio.

- test/server.test.js
  - cobre resposta 422 em /api/generate para tarefa grande;
  - valida recommendedEndpoint e suggestedRequest.

- docs/large-code-generation.md
  - documenta a deteccao automatica;
  - documenta os sinais usados;
  - documenta forceSingleGeneration.

## Commits desta execucao

- c90d5d5 Add automatic large request assessment
- aaa8220 Suggest large-code plan from generation routes
- f756afc Cover automatic large request assessment
- a837ce5 Cover automatic large generation suggestion
- 8cdc026 Document automatic large request detection

## Validacao

Validado por leitura e revisao estatica via conector GitHub. Nao foi possivel executar npm test localmente neste ambiente. Validacao objetiva pendente por GitHub Actions ou comando local:

npm test

## Riscos

- Mudanca pequena e reversivel.
- Nao adiciona dependencias.
- Nao executa codigo gerado.
- Nao escreve arquivos automaticamente.
- Pode haver falso positivo em alguma tarefa media; por isso foi criado forceSingleGeneration=true.

## Proximos passos seguros

1. Confirmar CI ou npm test.
2. Criar exemplo de cliente que chama /api/large-code-plan e depois percorre steps com /api/generate-stream.
3. Evoluir para indice local de resumo de arquivos para ampliar contexto sem aumentar muito uso de memoria.
