# Memória do projeto — 2026-06-29 — UTF-8 context truncation hardening

## Avaliação inicial do repositório

Antes de alterar arquivos, o repositório `PheidiasSoftware/TESTE` foi reexaminado com foco no backend local para LLM/SLM leve em PC fraco com Windows, 8 GB de RAM e sem GPU.

Arquivos e áreas avaliadas nesta execução:

- `README.md`: confirma objetivo do backend local, Node.js 20+, Ollama local, modelo `qwen2.5-coder:1.5b-instruct`, endpoints, limites conservadores, scripts Windows e documentação técnica.
- `package.json`: projeto Node ESM sem dependências externas, scripts `start`, `start:windows`, `dev`, `test` e `test:windows`, engine Node `>=20`.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20, sem Ollama, com variáveis conservadoras alinhadas ao helper Windows.
- `src/config.js`: configuração já endurecida para porta, URL do Ollama, inteiros estritos, flags booleanas, log level e extensões permitidas.
- `src/server.js`: mantém API local com health/status, geração, streaming, leitura segura, fila, cache, rate limit e logs estruturados.
- `src/project-files.js`: módulo de validação/leitura segura de arquivos e montagem de contexto para `/api/generate`.
- `test/project-files.test.js`: cobertura da leitura segura e montagem de contexto.
- `docs/backend-mvp-status.md`: status indica MVP funcionalmente pronto, com pendência principal de validação objetiva por `npm test`, `npm run test:windows` ou CI verde.
- PRs recentes: consulta retornou lista vazia.
- Issues abertas relevantes: consulta por Claude Agent/memória/backend/MVP não retornou resultados.

Não foram encontrados registros claros de Claude Agent, branches, PRs, issues ou comentários que exigissem compatibilização nesta execução.

## Decisão tomada

A próxima tarefa segura escolhida foi melhorar a montagem de contexto textual para evitar que cortes por limite de bytes quebrem caracteres UTF-8 multibyte, como acentos e emojis. Essa é uma melhoria pequena, reversível, focada em robustez de backend e útil para prompts com arquivos/comentários em português ou código contendo caracteres Unicode.

A alteração foi mantida em módulo isolado, sem dependências novas, sem execução de código do usuário, sem mudança no contrato HTTP e sem assumir hardware acima de CPU/8 GB RAM.

## Arquivos alterados/criados

- `src/project-files.js`
  - Adicionado `truncateUtf8ToBytes(value, maxBytes)`.
  - A montagem de contexto manual e de arquivos agora corta por bytes sem dividir caracteres multibyte.
  - Preservado comportamento anterior quando não há limite explícito.

- `test/project-files.test.js`
  - Adicionados testes para `truncateUtf8ToBytes`.
  - Adicionado teste para truncamento de contexto manual sem quebra de UTF-8.

- `PROJECT_MEMORY_RUN_2026-06-29_UTF8_CONTEXT_TRUNCATION.md`
  - Registro desta execução, avaliação inicial, decisão, alterações, riscos, validações e próximos passos.

## Validações executadas

Validação estática por leitura via conector GitHub:

- Conferida a estrutura e intenção do backend pelos arquivos principais.
- Conferido que a alteração não adiciona dependências.
- Conferido que a alteração fica restrita a truncamento de texto em `src/project-files.js` e testes relacionados.

Não foi possível executar `npm test` ou `npm run test:windows` pelo conector GitHub nesta execução. A validação objetiva continua pendente até execução local ou CI verde.

## Riscos

- A lógica de truncamento UTF-8 é pequena, mas ainda precisa de confirmação por `npm test`/CI.
- `src/server.js` continua concentrando handlers e roteamento; evitar refatorações grandes até validação verde.
- Uso real ainda depende de Ollama instalado e modelo leve disponível no PC do usuário.

## Pendências

- Confirmar `npm test` localmente.
- Confirmar `npm run test:windows` em Windows com Node.js 20+.
- Confirmar CI verde no commit mais recente.

## Próximos passos seguros

1. Verificar status de CI/checks do commit mais recente.
2. Se CI ou testes locais estiverem verdes, registrar o backend como MVP funcional completo.
3. Só depois considerar pequena extração de roteamento/handlers de `src/server.js`, mantendo compatibilidade com os testes existentes.
4. Manter novas melhorias como hardening pós-MVP, priorizando alterações pequenas e reversíveis.

## Compatibilidade com Claude Agent

Nenhum registro claro do Claude Agent foi encontrado nesta execução. O arquivo de memória foi criado em formato explícito para facilitar leitura por agentes futuros.