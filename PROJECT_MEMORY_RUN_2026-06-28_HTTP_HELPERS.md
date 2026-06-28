# Execução - 2026-06-28 08:36 - Módulo HTTP helpers

## Avaliação inicial do repositório

Antes de alterar qualquer arquivo, foram examinados:

- `README.md`
- `package.json`
- `src/server.js`
- `src/config.js`
- `src/rate-limit.js`
- `test/server.test.js`
- `PROJECT_MEMORY.md`
- buscas textuais por sinais de Claude Agent, arquivos de estado e pendências

Resumo encontrado:

- O backend já possui API HTTP nativa local para uma LLM/SLM de programação, com foco em PC fraco Windows, 8 GB RAM e sem GPU.
- O projeto segue sem dependências externas no `package.json` e usa `node --test`.
- O `README.md` documenta endpoints, fila, cache, streaming SSE, rate limit, leitura segura de arquivos, logs estruturados, CI e guias técnicos.
- `src/server.js` ainda concentra várias responsabilidades: servidor, helpers HTTP, prompt, fila, cache, leitura segura, integração Ollama e handlers.
- `src/config.js` já centraliza configuração.
- `src/rate-limit.js` já está modularizado e testado.
- `test/server.test.js` cobre rotas locais e funções principais sem chamar Ollama.
- A memória anterior indicava como próximo passo seguro separar gradualmente `src/server.js` em módulos menores, começando por configuração ou helpers HTTP.
- Não foram encontrados registros claros ou instruções conflitantes do Claude Agent nos arquivos/buscas analisados nesta execução.

## Decisão tomada

Executar uma refatoração incremental, segura e reversível: criar um módulo `src/http.js` com helpers HTTP reutilizáveis e testes próprios, sem ainda trocar `src/server.js` para usá-lo. Isso reduz risco, mantém o comportamento público intacto e prepara a próxima execução para integrar o módulo no servidor.

## Arquivos criados

### `src/http.js`

Criado módulo com helpers:

- `sendJson(response, statusCode, payload, headers)`
- `sendServerEvent(response, event, payload)`
- `openEventStream(response)`
- `readJsonBody(request, { maxBodyBytes })`

Características:

- usa apenas APIs nativas do Node.js;
- mantém cabeçalhos conservadores de cache;
- preserva formato JSON e SSE já usado pelo backend;
- aplica limite de payload no helper de leitura JSON;
- não executa código recebido do usuário;
- não adiciona dependências externas.

### `test/http.test.js`

Criados testes para:

- resposta JSON com `content-type` e `cache-control` corretos;
- formatação de evento SSE;
- cabeçalhos de streaming SSE;
- leitura de JSON válido;
- corpo vazio retornando `{}`;
- payload acima do limite retornando erro `413`;
- JSON inválido retornando erro `400`.

## Arquivos não alterados nesta execução

- `src/server.js` ainda mantém seus helpers internos antigos.
- `README.md` não foi alterado nesta rodada para evitar mexer em documentação pública antes da integração real do novo módulo no servidor.

## Validações executadas

- Validação estática manual dos novos helpers.
- Validação estática manual dos testes com `node:test` e `assert/strict`.
- Conferido que não há dependências externas novas.
- Conferido que os testes não chamam Ollama, não baixam modelos e não exigem GPU.
- Não foi possível executar `npm test` pelo conector GitHub nesta execução.

## Commits gerados

- `aaee742` - cria `src/http.js`
- `4b03e0c` - cria `test/http.test.js`

## Riscos

- `src/http.js` ainda está paralelo ao código existente em `src/server.js`; por isso não altera comportamento em produção nesta etapa.
- A próxima etapa deve substituir os helpers internos de `src/server.js` pelos imports do novo módulo com cuidado para preservar `MAX_BODY_BYTES`.
- O helper `readJsonBody()` do novo módulo não chama `request.destroy()` ao exceder limite; isso evita efeitos colaterais em testes simples, mas pode ser reavaliado ao integrar no servidor real.

## Pendências atualizadas

1. Integrar `src/http.js` em `src/server.js` removendo duplicação de `sendJson`, `sendServerEvent`, `openEventStream` e `readJsonBody`.
2. Ajustar `readJsonBody(request, { maxBodyBytes: MAX_BODY_BYTES })` no servidor ao integrar.
3. Executar `npm test` localmente ou aguardar CI para validar todos os testes.
4. Depois da integração HTTP, continuar separando `src/server.js` em módulos menores: cache, fila, prompt/Ollama e leitura segura de arquivos.
5. Atualizar README quando a modularização estiver integrada ao servidor.

## Próximo passo seguro

Na próxima execução, integrar o módulo `src/http.js` no `src/server.js` mantendo o contrato público dos endpoints e sem alterar comportamento de API.
