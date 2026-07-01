# PROJECT MEMORY RUN - 2026-07-01 - SSE payload serialization hardening

## Análise inicial

Repositório examinado como backend Node.js local para LLM/SLM em PC fraco com Windows, 8 GB RAM e sem GPU.

Itens verificados nesta execução:

- `README.md`: confirma objetivo do backend leve, uso de Ollama local, Node.js 20+, scripts Windows, testes offline, CI leve, guias técnicos e variáveis conservadoras.
- `package.json`: projeto ESM sem dependências externas, scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: rotas locais de health/status/generate/generate-stream/read-file/large-code-plan, fila, cache, rate limit, leitura segura e redaction de status sensível.
- `src/http.js`: helpers de JSON, SSE, headers de segurança e leitura de corpo JSON com limite de payload.
- `src/ollama.js`: cliente Ollama com opções conservadoras, tratamento seguro de erro upstream e limite de linha JSONL no streaming.
- `src/config.js`: normalização de host, porta, Ollama URL, modelo, limites e allowlist de extensões.
- `src/rate-limit.js`: rate limit local com normalização de `clientId`.
- `test/http.test.js`: testes offline para headers, JSON body e SSE.
- `.github/workflows/node-test.yml`: CI simples em Node.js 20 rodando `npm test`, sem Ollama/modelos.
- `scripts/start-windows.ps1`: defaults conservadores e redaction de `OLLAMA_URL` exibida.
- PRs recentes via conector: nenhum PR recente retornado.
- Busca por registros Claude/memória via conector: sem resultados na busca textual; memórias anteriores existem no padrão `PROJECT_MEMORY_RUN_*` conforme histórico do projeto.

## Decisão

Escolhida uma melhoria pequena, segura e reversível no backend: endurecer a serialização de payloads SSE.

Motivo:

- `sendServerEvent()` chamava `JSON.stringify(payload)` diretamente.
- Embora os payloads internos atuais sejam simples, um valor acidental como `BigInt`, `Symbol`, função, `Error` ou objeto circular poderia quebrar o stream.
- Em PC fraco, falhas simples de serialização em streaming são ruins porque desperdiçam fila, tempo de modelo e experiência do usuário.
- A mudança não adiciona dependências, não executa código gerado pelo usuário e não altera endpoints.

## Arquivos alterados

### `src/http.js`

- Adicionado `stringifyServerEventPayload(payload)`.
- A função converte:
  - `BigInt` para string;
  - `Symbol` para `[Symbol]`;
  - função para `[Function]`;
  - `Error` para objeto `{ name, message }`.
- Para payload circular ou não serializável, retorna fallback seguro:
  - `{ "error": "Payload SSE não serializável." }`
- `sendServerEvent()` agora usa esse helper antes de escrever `data:`.

### `test/http.test.js`

- Importado `stringifyServerEventPayload`.
- Adicionados testes offline cobrindo:
  - payload com `BigInt`, `Symbol`, função e `Error`;
  - payload circular com fallback seguro;
  - `sendServerEvent()` com payload contendo `BigInt`.

## Validações

- Revisão estática feita pelo conector, sem checkout local.
- Testes adicionados usam apenas `node:test` e `node:assert/strict`.
- `npm test` não foi executado nesta automação porque o ambiente atual não autorizou checkout local.
- A CI existente deve executar `npm test` em push na `main`.

## Riscos

- Baixo risco: mudança restrita ao helper SSE.
- Payloads normais continuam serializando exatamente como antes.
- Payloads com tipos não JSON agora são convertidos para formas seguras em vez de derrubar o stream.
- Objetos circulares deixam de expor estrutura parcial e retornam erro genérico seguro no evento.

## Pendências

- Confirmar resultado da CI do commit final.
- Futuro refinamento possível: reutilizar um serializador comum entre logger e SSE para reduzir duplicação, mantendo cuidado para não expor detalhes sensíveis.
- Futuro refinamento possível: adicionar métrica simples para falhas de serialização SSE, sem registrar conteúdo sensível.

## Status MVP backend

Critérios já atendidos pelo backend para MVP técnico local, com base nos arquivos examinados:

- API local em Node.js 20+.
- Integração Ollama local.
- Streaming SSE.
- Fila e concorrência conservadora para PC fraco.
- Cache em memória pequeno.
- Planejamento de geração grande em etapas.
- Detecção de requisição grande/truncada.
- Leitura segura de arquivos do projeto.
- Rate limit local.
- Headers de segurança.
- Testes offline sem GPU/Ollama.
- CI leve.
- Documentação operacional básica.

Ainda depende de decisão do usuário/frontend:

- Interface final de uso.
- Experiência visual para geração grande em etapas.
- Escolha final de modelos Ollama por máquina.
- Política de histórico/persistência fora do cache em memória.
- Fluxo de aprovação antes de aplicar código gerado.
