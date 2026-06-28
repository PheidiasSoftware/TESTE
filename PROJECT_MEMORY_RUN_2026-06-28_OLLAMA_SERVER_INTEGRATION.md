# Project memory — Ollama server integration

Data/hora local: 2026-06-28 18:36 BRT

## Avaliação inicial do repositório

Arquivos e áreas examinadas antes de alterar:

- `README.md`: confirma objetivo do backend local leve para PC fraco com Windows, 8 GB de RAM e sem GPU; documenta endpoints, variáveis, testes, CI e guias técnicos.
- `package.json`: confirma projeto Node.js 20+, ESM, sem dependências externas e script `npm test` com `node --test`.
- `src/server.js`: concentra servidor HTTP, fila, cache, leitura segura, rate limit, logging e chamadas Ollama.
- `src/ollama.js`: já possuía cliente Ollama testável, payload seguro, parser de streaming JSONL e leitura de stream.
- `src/http.js`: existe, mas ainda não está integrado ao servidor.
- `docs/backend-mvp-status.md`: registrava como próxima tarefa segura integrar `src/ollama.js` no `src/server.js`.
- `test/server.test.js`: valida rotas sem chamar Ollama e depende dos exports públicos de `src/server.js`.
- Busca de issues/branches relacionadas a Claude Agent: não foram encontrados registros abertos ou branches `claude` no conector durante esta execução.
- Histórico recente consultado por busca de commits: últimos commits relevantes registravam criação e cobertura dos helpers Ollama.

## Decisão tomada

A próxima tarefa segura era integrar `src/ollama.js` ao `src/server.js` em alteração pequena e reversível, porque o servidor ainda duplicava montagem de payload e leitura de streaming Ollama, enquanto o módulo dedicado já estava pronto e testado isoladamente.

## Arquivos alterados/criados

- Alterado `src/server.js`:
  - importado `createOllamaClient` de `src/ollama.js`;
  - criado `ollamaClient` com `OLLAMA_URL` e `MODEL` atuais;
  - substituídas as implementações diretas de `callOllamaGenerate` e `callOllamaGenerateStream` por delegação ao cliente Ollama;
  - mantido contrato das rotas, cache, fila, rate limit e respostas HTTP/SSE.
- Alterado `docs/backend-mvp-status.md`:
  - registrado que `src/server.js` agora usa `src/ollama.js`;
  - atualizada lista de critérios parcialmente atendidos;
  - próxima prioridade passa a ser validação de CI/local e depois integração de `src/http.js`.
- Criado este arquivo `PROJECT_MEMORY_RUN_2026-06-28_OLLAMA_SERVER_INTEGRATION.md`.

## Validações executadas

- Validação por inspeção do código via GitHub connector.
- Conferido que `src/server.js` atualizado mantém importações, exports públicos usados por testes e rotas documentadas.
- Não foi possível executar `npm test` diretamente pelo conector GitHub nesta execução.
- CI ainda precisa ser observada após os commits desta execução.

## Riscos

- Como `src/server.js` é arquivo crítico e ainda concentra muitas responsabilidades, qualquer reescrita tem risco de regressão.
- A mudança deveria ser validada com `npm test` local ou CI assim que possível.
- Uso real continua dependendo do Ollama local instalado, em execução e com modelo leve disponível.

## Compatibilidade com Claude Agent

Nenhum arquivo, issue, branch ou PR explicitamente atribuído ao Claude Agent foi encontrado nesta execução. A memória foi escrita em arquivo próprio para manter continuidade com outros agentes.

## Próximos passos seguros

1. Verificar status da CI ou rodar `npm test` localmente.
2. Integrar `src/http.js` no `src/server.js` em alteração menor que preserve `MAX_BODY_BYTES`.
3. Extrair `createGenerationQueue` para `src/generation-queue.js` com testes próprios.
4. Extrair leitura segura de arquivos para `src/project-files.js` com testes próprios.
5. Revisar formalmente critérios de MVP depois da modularização principal.
