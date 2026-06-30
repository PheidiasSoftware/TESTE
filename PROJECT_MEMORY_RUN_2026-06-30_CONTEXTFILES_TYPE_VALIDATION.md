# PROJECT MEMORY - ContextFiles type validation

## Data/hora

2026-06-30 01:38 America/Sao_Paulo

## Avaliação inicial do repositório

Antes de alterar arquivos, o repositório `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub.

Arquivos e áreas verificados:

- `README.md`
- `package.json`
- `src/config.js`
- `src/server.js`
- `src/project-files.js`
- `test/server.test.js`
- `test/project-files.test.js`
- `docs/api-contract.md`
- `docs/backend-mvp-status.md`
- issues abertas
- PRs recentes
- busca textual por registros claros de Claude Agent

Resultado da verificação:

- O projeto continua sendo um backend Node.js 20+ sem dependências externas pesadas.
- O escopo segue adequado para PC fraco com Windows, 8 GB de RAM e sem GPU.
- Não foram encontrados PRs ou issues abertos pelo conector.
- Não foram encontrados registros claros de Claude Agent pela busca disponível.
- A pendência recorrente continua sendo confirmar `npm test`, `npm run test:windows` ou CI verde no commit mais recente.

## Decisão tomada

A próxima alteração segura e incremental foi corrigir a validação de `contextFiles` em `src/project-files.js`.

Motivo: antes, um cliente que enviasse `contextFiles` como string poderia cair primeiro na checagem de quantidade por causa de `.length`, recebendo uma mensagem menos precisa. Agora o backend valida tipo não-array antes de verificar quantidade, retornando erro `400` claro: `contextFiles precisa ser uma lista de caminhos relativos.`

## Arquivos alterados/criados

Alterados:

- `src/project-files.js`
  - separa explicitamente os casos `undefined/null`, não-array e array vazio;
  - rejeita não-array antes de qualquer checagem de quantidade;
  - preserva o comportamento existente para contexto manual, limite de arquivos, limite de bytes e leitura segura.

- `test/project-files.test.js`
  - adiciona teste para `contextFiles` como string solta;
  - garante que o erro seja `400` e mencione lista de caminhos relativos.

- `docs/api-contract.md`
  - documenta que `contextFiles` deve ser sempre `string[]`;
  - esclarece que uma string solta é inválida;
  - atualiza a tabela de erros `400`.

Criado:

- `PROJECT_MEMORY_RUN_2026-06-30_CONTEXTFILES_TYPE_VALIDATION.md`

## Validações executadas

Validação remota por leitura do conector:

- `src/project-files.js` foi relido após a alteração e confirmou que `Array.isArray(contextFiles)` ocorre antes da checagem de `contextFiles.length > maxFiles`.
- `test/project-files.test.js` foi relido após a alteração e confirmou a existência do teste novo.

Não foi possível executar `npm test` diretamente pelo conector GitHub. A validação final objetiva segue pendente até haver `npm test`, `npm run test:windows` ou CI verde.

## Riscos

Baixo risco. A alteração é restrita à ordem de validação e à mensagem de erro para entrada inválida. Não altera integração com Ollama, fila, streaming, cache, leitura de arquivos válidos, rate limit ou dependências.

## Pendências

- Confirmar `npm test` ou `npm run test:windows`.
- Confirmar CI verde no commit mais recente.
- Evitar refatorações grandes em `src/server.js` até os testes estarem confirmados.

## Próximos passos seguros

- Adicionar cobertura HTTP para `contextFiles` não-array em `/api/generate` e `/api/generate-stream`, se ainda não houver CI verde.
- Revisar mensagens de erro de validação para manter contrato simples para clientes Node.js, Flutter/Dart e scripts Windows.
- Avaliar integração opcional futura com llama.cpp apenas após estabilidade do MVP e decisão explícita do usuário.

## Compatibilidade com Claude Agent

Nenhum registro claro do Claude Agent foi encontrado nesta execução. A alteração foi registrada em arquivo de memória independente para facilitar coordenação futura com outros agentes.
