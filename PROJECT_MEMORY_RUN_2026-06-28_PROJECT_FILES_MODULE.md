# PROJECT MEMORY - Run 2026-06-28 - Project files module

## Data/hora

2026-06-28 21:37 America/Sao_Paulo.

## Avaliação inicial obrigatória

Arquivos e áreas examinadas antes de alterar:

- `README.md`: confirma backend Node.js 20+ para LLM/SLM local em PC fraco, Windows, 8 GB RAM, sem GPU; endpoints, variáveis e guias técnicos documentados.
- `package.json`: projeto ESM, sem dependências externas, scripts `start`, `start:windows`, `dev` e `test` com `node --test`.
- `src/server.js`: servidor já integrado com `src/cache.js`, `src/config.js`, `src/generation-queue.js`, `src/http.js`, `src/ollama.js` e `src/rate-limit.js`, mas ainda concentrava leitura segura de arquivos e montagem de contexto.
- `src/config.js`: contém defaults conservadores de arquivos, contexto, cache, fila, rate limit e Ollama.
- `test/server.test.js`: ainda importa helpers de leitura segura pelo `src/server.js`, então a mudança precisava preservar reexports para compatibilidade.
- `docs/backend-mvp-status.md`: registrava como próximo passo seguro extrair leitura segura para `src/project-files.js`.
- Issues/PRs: não foram encontrados PRs recentes nem issues abertas relevantes pelo conector GitHub.
- Claude Agent: não foram encontrados registros explícitos acessíveis por busca do conector nesta execução. Mantida compatibilidade com os arquivos de estado anteriores do projeto.

## Decisão tomada

A tarefa segura e objetiva escolhida foi extrair a leitura segura de arquivos e a montagem de contexto do `src/server.js` para um módulo dedicado `src/project-files.js`.

Motivos:

- reduz responsabilidade do servidor sem alterar contrato de API;
- melhora testabilidade isolada;
- mantém foco em backend, segurança e baixo consumo;
- segue o próximo passo registrado em `docs/backend-mvp-status.md`;
- é incremental e reversível.

## Arquivos criados

- `src/project-files.js`
  - `validateSafeProjectFilePath()`
  - `readProjectFile()`
  - `buildContextFromFiles()`
- `test/project-files.test.js`
  - cobre caminhos permitidos;
  - bloqueio de travessia, `node_modules` e `.env`;
  - leitura de arquivo pequeno;
  - bloqueio por tamanho;
  - montagem de contexto com arquivo textual;
  - limite de quantidade e tipos inválidos em `contextFiles`.
- `PROJECT_MEMORY_RUN_2026-06-28_PROJECT_FILES_MODULE.md`

## Arquivos alterados

- `src/server.js`
  - removeu imports diretos de `node:fs/promises` e `node:path`;
  - passou a importar `buildContextFromFiles`, `readProjectFile` e `validateSafeProjectFilePath` de `src/project-files.js`;
  - manteve reexports desses helpers para compatibilidade com os testes existentes;
  - passou a fornecer explicitamente `PROJECT_ROOT`, `MAX_FILE_READ_BYTES`, `MAX_CONTEXT_FILES`, `MAX_CONTEXT_BYTES` e `ALLOWED_FILE_EXTENSIONS` ao módulo.
- `docs/backend-mvp-status.md`
  - registrou `src/project-files.js` como critério atendido;
  - atualizou riscos/parciais;
  - registrou próximo passo recomendado: validar `npm test`/CI e extrair logging para `src/logger.js`.

## Commits desta execução

- `253daefd1c0afbb0c2f501203917888fa4d1a670` - criação de `src/project-files.js`.
- `8211d8f003be0f5eb8bde067e54307f5ccfadd3a` - criação de `test/project-files.test.js`.
- `d55fb57221771a58bbcb3e7015f4e92a5ee733fc` - integração do servidor com `src/project-files.js`.
- `76c3b7a491f57cde8f5e89e14e8d7122781dd75d` - atualização do status do MVP backend.

## Validações executadas

- Revisão estática pelo conector GitHub dos arquivos principais antes da alteração.
- Checagem de compatibilidade por leitura do `test/server.test.js`: os reexports antigos foram preservados.

Limitação: o conector GitHub disponível nesta execução não executa `npm test`; a validação final depende de CI ou execução local.

## Riscos

- `src/server.js` ainda concentra handlers HTTP, roteamento, logger e composição de respostas.
- Possível regressão só deve ser descartada após `npm test`/CI.
- Uso real continua dependendo de Ollama instalado, modelo leve baixado e limites conservadores em PC fraco.

## Pendências

1. Validar `npm test`/CI após esta extração.
2. Extrair logging/redaction para `src/logger.js` mantendo formato JSON Lines e reexport pelo servidor.
3. Revisar se a documentação do contrato da API precisa mencionar explicitamente o novo módulo interno.
4. Quando validações passarem, registrar formalmente se o backend já atende ao MVP funcional.

## Próximo passo recomendado

Executar validação local/CI. Se não houver falhas, extrair logging para `src/logger.js` em mudança pequena e reversível.
