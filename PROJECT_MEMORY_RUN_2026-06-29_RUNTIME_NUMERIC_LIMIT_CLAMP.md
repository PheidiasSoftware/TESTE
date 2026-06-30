# Project memory — runtime numeric limit clamp

## Data/hora

2026-06-29 22:37 BRT

## Avaliação inicial do repositório

Antes de alterar qualquer arquivo, o repositório `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub.

Arquivos e áreas verificados:

- `README.md`
- `package.json`
- `src/config.js`
- `test/config.test.js`
- `docs/backend-mvp-status.md`
- `docs/runtime-numeric-limits-review-2026-06-29.md`
- Issues abertas do repositório
- PRs recentes do repositório

Resumo da avaliação:

- O projeto continua sendo um backend Node.js sem dependências externas pesadas.
- O foco permanece uma LLM/SLM local para programação em PC fraco com Windows, 8 GB de RAM e sem GPU.
- O README documenta Node.js 20+, Ollama local, modelo pequeno `qwen2.5-coder:1.5b-instruct`, endpoints locais, scripts Windows e limites conservadores.
- `package.json` mantém scripts `start`, `start:windows`, `test` e `test:windows` usando Node nativo.
- Não foram encontrados PRs ou issues abertas pelo conector nesta execução.
- Não foram encontrados registros claros de Claude Agent via PRs/issues nesta execução.

## Decisão tomada

A próxima tarefa segura foi implementar a recomendação já registrada em `docs/runtime-numeric-limits-review-2026-06-29.md`: adicionar tetos conservadores para variáveis numéricas de runtime.

Motivo:

- O parsing de inteiros já estava endurecido contra valores inválidos/parciais.
- Ainda faltava impedir valores enormes definidos por ambiente, que poderiam pressionar CPU/RAM em PC fraco.
- A mudança é pequena, reversível e restrita a configuração/testes.

## Arquivos alterados/criados

Alterados:

- `src/config.js`
- `test/config.test.js`
- `docs/runtime-numeric-limits-review-2026-06-29.md`

Criado:

- `PROJECT_MEMORY_RUN_2026-06-29_RUNTIME_NUMERIC_LIMIT_CLAMP.md`

## Detalhes técnicos

Em `src/config.js`:

- Criado `RUNTIME_NUMERIC_LIMITS` com fallback, mínimo e máximo para:
  - `MAX_BODY_BYTES`
  - `REQUEST_TIMEOUT_MS`
  - `MAX_QUEUE_SIZE`
  - `GENERATION_CONCURRENCY`
  - `MAX_CACHE_ENTRIES`
  - `MAX_FILE_READ_BYTES`
  - `MAX_CONTEXT_FILES`
  - `MAX_CONTEXT_BYTES`
  - `RATE_LIMIT_WINDOW_MS`
  - `RATE_LIMIT_MAX_REQUESTS`
  - `RATE_LIMIT_MAX_CLIENTS`
- Criado helper exportado `parseBoundedInteger`.
- `loadConfig` passou a usar `parseBoundedInteger` nas variáveis numéricas sensíveis.
- Os padrões atuais foram preservados.

Em `test/config.test.js`:

- Adicionados testes para `parseBoundedInteger`.
- Adicionado teste para clamp de valores muito altos em todas as variáveis numéricas sensíveis.
- Mantidos testes existentes para parsing estrito, mínimos, porta, Ollama URL, modelo, flags booleanas, log level e extensões permitidas.

Em `docs/runtime-numeric-limits-review-2026-06-29.md`:

- A nota foi atualizada de recomendação futura para implementação aplicada.
- Registrados tetos aplicados, critérios de aceitação e pendência de validação por `npm test`/CI.

## Validações executadas

Executado nesta rodada:

- Releitura de `src/config.js` após commit para confirmar o conteúdo gravado.
- Releitura de `test/config.test.js` após commit para confirmar imports e testes gravados.
- Releitura/uso de documentação de revisão de limites antes de implementar.

Não executado:

- `npm test`
- `npm run test:windows`
- CI GitHub Actions

Motivo: o trabalho foi feito pelo conector GitHub; o ambiente desta execução não fornece execução local confiável dos testes do repositório.

## Riscos

- Baixo risco funcional: não altera endpoints, não adiciona dependências e não executa código de usuário.
- Risco pendente: sem validação objetiva de `npm test`/CI nesta execução.
- Atenção: se algum usuário definir valores acima dos tetos manualmente, o backend agora limita esses valores por segurança. Isso é intencional para o perfil de PC fraco.

## Pendências

- Confirmar `npm test` ou `npm run test:windows`.
- Confirmar CI verde no commit mais recente.
- Depois da validação, atualizar o status do MVP como completo/validado se os testes passarem.

## Próximos passos seguros

1. Confirmar CI verde no GitHub Actions ou rodar `npm test` localmente.
2. Se verde, registrar evidência objetiva de validação.
3. Evitar novas refatorações amplas em `src/server.js` até existir validação recente.
4. Após validação, considerar apenas uma extração pequena de roteamento/handlers se ainda houver necessidade.

## Compatibilidade com Claude Agent

Nenhum PR, issue ou registro claro do Claude Agent foi localizado nesta execução. A memória foi criada para que futuras execuções ou agentes identifiquem rapidamente a decisão tomada, os arquivos afetados e a pendência de validação.