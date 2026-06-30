# PROJECT MEMORY - 2026-06-30 - Prompt Language Metadata Test

## Data/hora

2026-06-30 09:34 America/Sao_Paulo.

## Avaliação inicial do repositório

O repositório `PheidiasSoftware/TESTE` foi reexaminado antes de alterações, conforme regra operacional do projeto.

Arquivos e áreas analisadas:

- `README.md`
- `package.json`
- `src/server.js`
- `src/http.js`
- `src/config.js`
- `test/http.test.js`
- `test/config.test.js`
- `test/generate-validation.test.js`
- `docs/api-contract.md`
- `docs/generate-request-validation.md`
- `PROJECT_MEMORY_RUN_2026-06-30_LANGUAGE_FOCUS_NORMALIZATION.md`
- PRs abertos via conector GitHub
- Issues abertas via conector GitHub
- busca textual por registros do Claude Agent/memória/estado

Resultado da triagem:

- Repositório acessível, público, branch padrão `main`.
- Sem PRs abertos encontrados.
- Sem issues abertas encontradas.
- Busca textual disponível não retornou registros claros do Claude Agent.
- Última memória registrada indicava como próximo passo seguro adicionar teste específico para `language` normalizado dentro de `buildCodingPrompt`, sem chamar Ollama.
- Checkout local via `git clone` continuou bloqueado por autorização neste ambiente, então a validação local completa segue indisponível.

## Decisão tomada

Foi escolhida uma melhoria pequena, segura e reversível: reforçar a cobertura de teste do prompt técnico para garantir que o campo `language`, após normalização, entra na linha `Linguagem/foco:` como metadado de uma linha só.

Motivo:

- A alteração anterior criou `normalizeLanguageFocus()`.
- Faltava uma verificação explícita de integração entre `normalizeLanguageFocus()` e `buildCodingPrompt()`.
- Esse teste não chama Ollama, não baixa modelos, não adiciona dependências e é adequado para PC fraco.

## Arquivos alterados/criados

### Alterados

- `test/generate-validation.test.js`
  - Importa `buildCodingPrompt`.
  - Adiciona teste garantindo que o foco técnico normalizado aparece no prompt como `Linguagem/foco: Flutter Dart MySQL`.
  - Garante que a linha de metadados não fica quebrada por newline.

- `docs/generate-request-validation.md`
  - Detalha a normalização de `language`: remoção de caracteres de controle, compactação de espaços, `trim()`, limite de 80 caracteres e fallback `general`.
  - Atualiza lista de testes esperados.

### Criado

- `PROJECT_MEMORY_RUN_2026-06-30_PROMPT_LANGUAGE_METADATA_TEST.md`
  - Este registro de memória/estado da execução.

## Validações executadas

- Releitura de arquivos principais via conector GitHub antes das alterações.
- Consulta de PRs e issues abertas via conector GitHub.
- Tentativa de checkout local com `git clone`, bloqueada por autorização do ambiente.

Não foi possível confirmar `npm test` localmente neste ambiente. A validação objetiva final continua pendente até execução em ambiente com checkout autorizado, Windows local ou GitHub Actions.

## Commits desta execução

- `be79fbde279701590139c6a7fb30bb547f08bb59` - teste de integração entre `normalizeLanguageFocus()` e `buildCodingPrompt()`.
- `47da302f1f32c86ec5623aa952153eb2ef7f7a4a` - atualização da documentação de validação.

## Riscos

- Como `npm test`/CI verde não foi confirmado, ainda existe risco residual de erro não detectado.
- A mudança é limitada a teste e documentação, com baixo risco operacional.
- Não houve alteração em runtime, API pública ou dependências.

## Pendências

- Confirmar `npm test`.
- Confirmar `npm run test:windows` em PC Windows com Node.js 20+.
- Confirmar CI verde no GitHub Actions quando houver workflow run registrado.
- Continuar evitando funcionalidades grandes enquanto a validação objetiva completa não estiver disponível.

## Próximos passos seguros

1. Se a próxima execução conseguir evidência de CI/testes, registrar o resultado em `docs/backend-mvp-status.md`.
2. Caso a validação continue indisponível, priorizar ajustes pequenos de documentação, contrato ou testes isolados.
3. Próxima melhoria possível: documentar um exemplo mínimo de cliente Node.js para consumir `/api/generate-stream` sem dependências externas, mantendo foco em PC fraco e integração local.