# PROJECT MEMORY RUN - 2026-06-29 - Ollama URL config hardening

## Data/hora

2026-06-29 15:34 America/Sao_Paulo.

## Avaliação inicial do repositório

Antes de alterar qualquer arquivo, o repositório `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub.

Arquivos e áreas analisadas:

- `README.md`
- `package.json`
- `.github/workflows/node-test.yml`
- `docs/backend-mvp-status.md`
- `src/server.js`
- `src/config.js`
- `src/ollama.js`
- `test/config.test.js`
- `scripts/start-windows.ps1`

Também foi consultada a lista de PRs recentes pelo conector GitHub; não havia PRs retornados. A busca textual disponível não encontrou registros claros de Claude Agent, arquivos de estado dele ou mudanças atribuíveis diretamente a ele nesta execução.

## Decisão tomada

Como o backend já possui API local, streaming, fila, cache, leitura segura, rate limit, logs estruturados, CI leve e helpers Windows, e como ainda falta evidência objetiva de `npm test`/CI verde no commit mais recente, foi evitada qualquer refatoração ampla de `src/server.js`.

A melhoria incremental escolhida foi endurecer a configuração de `OLLAMA_URL`, mantendo compatibilidade com o objetivo local do MVP e reduzindo risco de endpoint inválido ou acidentalmente contaminado por query/hash.

## Arquivos alterados/criados

Alterados:

- `src/config.js`
  - Adicionado `DEFAULT_OLLAMA_URL`.
  - Adicionada função `normalizeOllamaUrl`.
  - `OLLAMA_URL` agora é normalizada por `loadConfig`.
  - Apenas protocolos `http:` e `https:` são aceitos.
  - Query string, hash e barras finais são removidos.
  - Valores vazios, inválidos ou não HTTP voltam para `http://127.0.0.1:11434`.

- `test/config.test.js`
  - Importa `normalizeOllamaUrl`.
  - Cobre URL padrão do Ollama.
  - Cobre URLs `http`/`https` válidas.
  - Cobre fallback para URL inválida ou protocolo não permitido.
  - Cobre remoção de query/hash antes de expor configuração.

- `docs/backend-mvp-status.md`
  - Registrada a execução.
  - Critérios atendidos atualizados com hardening de `OLLAMA_URL`.
  - Critério parcial de configuração atualizado.

Criado:

- `PROJECT_MEMORY_RUN_2026-06-29_OLLAMA_URL_CONFIG_HARDENING.md`

## Validações executadas

- Reexame via conector GitHub dos arquivos principais antes das alterações.
- Revisão estática das alterações em `src/config.js` e `test/config.test.js`.
- Tentativa de clonar e rodar `npm test` em ambiente local foi bloqueada por autorização do ambiente (`UnauthorizedError`).

## Riscos

- Ainda não há evidência objetiva de `npm test`, `npm run test:windows` ou CI verde para o commit mais recente.
- `src/server.js` continua concentrando roteamento e composição de resposta, então refatorações grandes devem aguardar validação verde.
- A normalização de `OLLAMA_URL` remove query/hash intencionalmente; isso é adequado para uso local com Ollama, mas qualquer integração futura que dependa de query string precisará ser tratada explicitamente e documentada.

## Pendências

1. Confirmar `npm test` ou `npm run test:windows` em checkout limpo.
2. Confirmar CI verde no GitHub Actions para o commit mais recente.
3. Após validação verde, registrar o backend como MVP funcional completo.
4. Só depois considerar extração pequena de roteamento/handlers de `src/server.js`.

## Compatibilidade com Claude Agent

Não foram encontrados registros claros do Claude Agent nesta execução. A alteração foi pequena, documentada e reversível para facilitar convivência com execuções futuras de outros agentes.