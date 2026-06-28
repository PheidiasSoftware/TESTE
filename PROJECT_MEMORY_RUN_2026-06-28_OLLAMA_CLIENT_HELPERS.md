# PROJECT MEMORY — Run 2026-06-28 — Ollama client helpers

## Data/hora

2026-06-28 17:38 America/Sao_Paulo.

## Avaliação inicial do repositório

Antes de alterar arquivos, foram examinados:

- metadados do repositório `PheidiasSoftware/TESTE`, branch padrão `main`, permissão de escrita disponível;
- `README.md`, incluindo requisitos, scripts, endpoints, variáveis de ambiente e guias técnicos;
- `package.json`, confirmando Node.js 20+, ESM, `npm start`, `npm test` e ausência de dependências externas;
- `src/server.js`, confirmando que cache já está integrado, rate limit está aplicado às rotas pesadas e a lógica Ollama ainda está parcialmente duplicada no servidor;
- `src/ollama.js`, confirmando helpers existentes para payload e parsing de linha JSONL;
- `test/ollama.test.js`, confirmando cobertura inicial de payload, sanitização e parsing;
- `docs/backend-mvp-status.md`, confirmando pendência explícita de integração de `src/ollama.js` no servidor;
- buscas por registros de Claude Agent/memória/estado via conector, sem retorno útil nesta execução.

## Decisão tomada

A integração direta de `src/ollama.js` no `src/server.js` exigiria alteração em arquivo crítico e grande. Para manter a execução incremental, segura e reversível, a decisão foi fortalecer primeiro `src/ollama.js` com um cliente testável e sem dependências, preparando uma integração posterior menor.

## Arquivos alterados/criados

- Alterado `src/ollama.js`:
  - adicionado `createOllamaClient()`;
  - adicionado `readOllamaStream()`;
  - mantidos `buildOllamaGeneratePayload()`, `sanitizeOllamaOptions()` e `parseOllamaStreamLine()`;
  - mantidas opções conservadoras para PC fraco sem GPU: `num_ctx=2048`, `num_predict=512`, `temperature=0.2`;
  - cliente aceita `fetchImpl` injetável para testes sem chamar Ollama real.

- Alterado `test/ollama.test.js`:
  - adicionados testes para chamada não-streaming com `fetchImpl` fake;
  - adicionado teste para mapeamento seguro de falha Ollama para `statusCode=502`;
  - adicionado teste para agregação de tokens em `readOllamaStream()`.

- Alterado `docs/backend-mvp-status.md`:
  - registrado que `src/ollama.js` agora cobre payload, parsing, cliente não-streaming e leitura de streaming;
  - mantida como próxima tarefa segura a integração gradual do módulo no `src/server.js`.

- Criado `PROJECT_MEMORY_RUN_2026-06-28_OLLAMA_CLIENT_HELPERS.md`.

## Validações executadas

- Validação estática por revisão do código via conector GitHub.
- Testes novos foram escritos para `node --test`, mas não foi possível executar `npm test` pelo conector GitHub nesta execução.

## Riscos

- `src/server.js` ainda não usa diretamente `createOllamaClient()`/`readOllamaStream()`.
- CI do último commit pode ainda não ter aparecido no momento do registro.
- Uso real ainda depende de Ollama instalado localmente e modelo leve disponível.

## Pendências

1. Integrar `src/ollama.js` no `src/server.js` em alteração pequena.
2. Integrar `src/http.js` no `src/server.js` depois da integração Ollama.
3. Executar ou verificar `npm test`/CI.
4. Avaliar extração futura de fila e leitura segura de arquivos para módulos próprios.

## Compatibilidade com Claude Agent

Não foram encontrados registros úteis do Claude Agent nesta execução via busca do conector. As alterações foram documentadas para que Claude Agent ou outra IA consiga continuar sem perder contexto.

## Próximo passo recomendado

Substituir no `src/server.js` apenas a montagem manual do payload Ollama por `buildOllamaGeneratePayload()` e o parser manual de JSONL por `readOllamaStream()`/`parseOllamaStreamLine()`, evitando mudança ampla no roteamento HTTP.
