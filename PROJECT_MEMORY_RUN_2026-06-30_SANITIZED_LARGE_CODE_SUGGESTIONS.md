# Project memory - sanitized large-code suggestions

## Data/hora

2026-06-30 13:37 America/Sao_Paulo

## Pedido

Executar uma melhoria incremental e segura no backend do repositorio `PheidiasSoftware/TESTE`, sempre revisando o estado atual antes de alterar e registrando memoria de projeto.

## Avaliacao inicial do repositorio

Arquivos e areas examinadas nesta execucao:

- `README.md`
- `package.json`
- `.github/workflows/node-test.yml`
- `src/server.js`
- `src/large-code.js`
- `src/config.js`
- `test/large-code.test.js`
- issues abertas relevantes por busca
- PRs recentes do usuario no repositorio
- arquivos de memoria recentes conhecidos do projeto

Resumo encontrado:

- O backend continua focado em LLM/SLM local para programacao em PC fraco com Windows, 8 GB de RAM e sem GPU.
- `package.json` permanece sem dependencias externas pesadas e usa `node --test`.
- Existe CI leve em GitHub Actions para `npm test` em Node.js 20.
- Nao havia PRs recentes retornados pelo conector.
- Nao foram encontradas issues abertas relevantes na busca feita.
- Nao encontrei registro claro do Claude Agent nesta execucao.
- A melhoria anterior ja fazia `/api/generate` e `/api/generate-stream` sugerirem `/api/large-code-plan` quando a tarefa parece grande.

## Decisao tecnica

Foi escolhida uma melhoria pequena e segura: sanitizar as listas `contextFiles` e `targetFiles` retornadas dentro de `largeCodeSuggestion.suggestedRequest.body`.

Motivo:

- A deteccao automatica de tarefa grande retornava a sugestao com listas vindas do corpo da requisicao.
- O fluxo principal de leitura segura ja valida caminhos antes de ler arquivos, mas a resposta sugerida podia refletir valores brutos, incluindo itens nao string, controle invisivel ou textos longos.
- A melhoria reduz ruido na resposta JSON sem mudar a semantica principal da API.

## Arquivos alterados

### `src/large-code.js`

- Criada `normalizeSuggestionStringList`.
- A funcao:
  - aceita somente arrays;
  - limita quantidade de itens;
  - normaliza texto com `normalizeLargeCodeText`;
  - remove entradas vazias;
  - corta itens longos.

### `src/server.js`

- Importa `normalizeSuggestionStringList`.
- `buildLargeCodeSuggestion` agora usa listas sanitizadas para `contextFiles` e `targetFiles`.
- Ajustada uma frase do prompt base para manter a orientacao segura com redacao mais direta.

### `test/large-code.test.js`

- Adicionado teste para `normalizeSuggestionStringList` cobrindo:
  - limpeza de controles;
  - descarte de item invalido;
  - corte de texto longo;
  - limite de quantidade;
  - entrada nao-array retornando lista vazia.

## Commits desta execucao

- `9c8a3c3` - `Sanitize large-code suggestion file lists`
- `5f797c2` - `Use sanitized file lists in large-code suggestions`
- `e789b17` - `Cover sanitized large-code suggestion lists`

## Validacao

Validacao executada:

- Revisao estatica via conector GitHub dos arquivos principais.
- Checagem de README, package, workflow, backend, config, large-code e testes.

Validacao pendente:

- `npm test`
- status final do GitHub Actions no commit mais recente

A execucao foi feita via conector GitHub, sem clone local autenticado e sem runtime do repositorio.

## Riscos

- Baixo risco: mudanca pequena, localizada e reversivel.
- Nao adiciona dependencias.
- Nao chama Ollama.
- Nao altera leitura segura real de arquivos; apenas sanitiza a sugestao de requisicao.

## Pendencias

- Confirmar CI ou rodar `npm test` localmente.
- Considerar teste de servidor especifico para garantir que `largeCodeSuggestion.suggestedRequest.body.contextFiles` saia sanitizado no JSON HTTP.
- Atualizar README/API contract posteriormente para documentar explicitamente que a sugestao retornada e normalizada.

## Proximos passos seguros

1. Adicionar teste HTTP cobrindo sanitizacao da sugestao em `/api/generate`.
2. Criar exemplo de cliente leve para percorrer `steps` do `/api/large-code-plan` usando SSE.
3. Melhorar contrato da API para resposta `422` de tarefa grande.
4. Criar mecanismo simples de resumo de arquivos para contexto incremental sem aumentar memoria.
