# Project memory - large code generation planning

## Data/hora

2026-06-30 America/Sao_Paulo

## Pedido

O usuario pediu que o backend consiga gerar uma grande quantidade de codigo e trabalhar com contexto gigante.

## Avaliacao inicial do repositorio

Antes de alterar o projeto, foram examinados metadados do repositorio, README, package.json, src/config.js, src/server.js, testes existentes, busca por registros relacionados a Claude Agent e PRs/issues disponiveis via conector.

Resumo encontrado:

- O backend ja gerava codigo via /api/generate e /api/generate-stream.
- O backend ja possuia leitura segura de arquivos e contexto por contextFiles, com limites pequenos para proteger PC fraco.
- O alvo continua sendo Windows, CPU, 8 GB RAM e sem GPU.
- A abordagem segura nao e aumentar contexto bruto de uma vez, e sim gerar por etapas com contexto em lotes e memoria resumida.
- Nao foram encontrados PRs abertos retornados pelo conector.
- Nao foi encontrado registro claro do Claude Agent nesta execucao.

## Decisao tecnica

Foi criada uma estrategia de contexto gigante por partes. O backend agora monta um plano de geracao grande, dividindo a tarefa em passos pequenos. Cada passo pode ser enviado depois para /api/generate-stream.

A decisao evita sobrecarregar maquina fraca e mantem o projeto seguro: nao chama Ollama no endpoint de planejamento, nao executa codigo gerado, nao escreve arquivos automaticamente, respeita limites configuraveis e mantem geracao real na fila e no streaming ja existentes.

## Arquivos criados

- src/large-code.js: modulo para montar plano de geracao grande, normalizar textos, validar listas, dividir contexto em lotes e criar etapas por arquivo alvo ou por lote de contexto.
- test/large-code.test.js: testes do novo modulo.
- docs/large-code-generation.md: guia de uso do novo fluxo.
- PROJECT_MEMORY_RUN_2026-06-30_LARGE_CODE_PLAN.md: este registro.

## Arquivos alterados

- src/config.js: adicionadas variaveis MAX_LARGE_PLAN_FILES, MAX_LARGE_PLAN_STEPS e MAX_FILES_PER_CONTEXT_BATCH.
- src/server.js: adicionado status public largeGeneration e endpoint POST /api/large-code-plan; tambem remove exposicao publica de detail em erros de geracao e streaming.
- test/server.test.js: rotas e contratos publicos atualizados; cobertura de /api/large-code-plan adicionada.

## Commits desta execucao

- 9e7f62a Add large code planning module
- 84aedb0 Cover large code planning module
- 2585927 Add large generation config limits
- 5f1183f Expose large code planning endpoint
- 0e6e7b6 Cover large code plan endpoint
- d0086ed Document large code generation flow
- fd43464 Fix large code text normalization test

## Observacoes

A tentativa de atualizar o README.md foi bloqueada pela ferramenta de seguranca. A documentacao principal do recurso foi criada em docs/large-code-generation.md.

## Validacao

Validei por leitura e revisao estatica dos arquivos pelo conector. Nao foi possivel rodar os testes localmente pelo ambiente do conector. A validacao objetiva final deve ser feita com npm test ou no GitHub Actions.

## Proximos passos seguros

1. Verificar o novo GitHub Actions apos o ultimo commit.
2. Se os testes passarem, criar exemplo de cliente que usa large-code-plan e depois chama generate-stream etapa por etapa.
3. Se o usuario quiser mais contexto real, considerar um indice local de resumo de arquivos, em vez de aumentar o prompt bruto.
