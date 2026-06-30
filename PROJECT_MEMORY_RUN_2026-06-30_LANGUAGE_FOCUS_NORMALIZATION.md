# PROJECT MEMORY - 2026-06-30 - Language Focus Normalization

## Data/hora

2026-06-30 08:34 America/Sao_Paulo.

## Avaliação inicial do repositório

O repositório `PheidiasSoftware/TESTE` foi reexaminado antes de alterações, conforme regra operacional do projeto.

Arquivos e áreas analisadas:

- `README.md`
- `package.json`
- `src/server.js`
- `src/http.js`
- `src/config.js`
- `test/server.test.js`
- `test/generate-validation.test.js`
- `docs/api-contract.md`
- `docs/backend-mvp-status.md`
- PRs abertos via conector GitHub
- Issues abertas via conector GitHub
- busca textual por registros do Claude Agent/memória/estado

Resultado da triagem:

- Repositório acessível, público, branch padrão `main`.
- Sem PRs abertos encontrados.
- Sem issues abertas encontradas.
- Busca textual disponível não retornou registros claros do Claude Agent.
- O backend já possui validações importantes de Content-Type, rate limit, cache, fila, leitura segura de arquivos, sanitização de status público, redaction de logs e headers leves de segurança.

## Decisão tomada

Foi escolhida uma melhoria pequena, segura e reversível no backend: normalizar o campo `language` usado como metadado do prompt técnico.

Motivo:

- `task` deve aceitar texto livre e múltiplas linhas.
- `language`, porém, é apenas um foco técnico curto (`Node.js`, `Dart`, `Flutter`, `MySQL`).
- Antes desta execução, `language` era limitado por tamanho, mas ainda podia carregar quebras de linha ou caracteres de controle dentro da linha `Linguagem/foco:` do prompt.
- A normalização reduz risco de prompt metadata ambígua sem bloquear uso legítimo.

## Arquivos alterados/criados

### Alterados

- `src/server.js`
  - Criada e exportada `normalizeLanguageFocus(value, fallback = 'general')`.
  - A função remove caracteres de controle, compacta espaços, aplica `trim()`, limita a 80 caracteres e usa `general` quando vazio/não textual.
  - `buildGenerateRequestPayload()` agora usa essa função para montar o prompt.

- `test/generate-validation.test.js`
  - Importa `normalizeLanguageFocus`.
  - Adiciona teste para remoção de quebra de linha/tab e fallback `general`.
  - Adiciona teste para limite de 80 caracteres.

- `docs/api-contract.md`
  - Documenta a normalização de `language`.
  - Registra que `/api/generate-stream` usa a mesma normalização de `/api/generate`.

### Criado

- `PROJECT_MEMORY_RUN_2026-06-30_LANGUAGE_FOCUS_NORMALIZATION.md`
  - Este registro de memória/estado da execução.

## Validações executadas

- Releitura do trecho alterado em `src/server.js` pelo conector GitHub após commit.
- Releitura de `test/generate-validation.test.js` pelo conector GitHub após ajuste do teste.
- Consulta de status combinado do commit final `3f19b8f964b5b730309b13af55ca756b9c4d9507`: sem statuses registrados.
- Consulta de workflow runs do commit final: sem execuções retornadas pelo conector.

Não foi possível confirmar `npm test` localmente neste ambiente; em execuções anteriores o checkout local também foi bloqueado. Portanto a validação final objetiva continua pendente.

## Commits desta execução

- `bc77d5828acdac37da8387a4e85d9e3373e4ceac` - `src/server.js`
- `94960d7d0666ca90b4b1ed69ae64a5f3e1bd3caf` - primeira versão dos testes
- `38f0739e156653a31087f46306fb282bb4135947` - documentação do contrato
- `3f19b8f964b5b730309b13af55ca756b9c4d9507` - ajuste final dos testes para evitar literal de controle

## Riscos

- Como `npm test`/CI verde não foi confirmado, ainda existe risco residual de erro não detectado.
- A alteração exporta uma função nova de `src/server.js`, mas isso é compatível com a estratégia atual de testes do projeto e não adiciona dependências.
- A normalização de `language` substitui quebras de linha por espaços. Isso é intencional porque o campo é metadado curto, não contexto livre.

## Pendências

- Confirmar `npm test`.
- Confirmar `npm run test:windows` em PC Windows com Node.js 20+.
- Confirmar CI verde no GitHub Actions quando houver workflow run registrado.
- Evitar funcionalidades grandes até haver evidência objetiva de testes passando no commit mais recente.

## Próximos passos seguros

1. Se a próxima execução conseguir evidência de CI/testes, registrar o resultado em `docs/backend-mvp-status.md`.
2. Caso a validação continue indisponível, priorizar apenas ajustes pequenos de contrato, documentação ou testes isolados.
3. Próxima melhoria backend possível: adicionar teste específico para `language` normalizado dentro de `buildCodingPrompt`, sem chamar Ollama, ou documentar exemplos de cliente local Node.js/Flutter consumindo `/api/generate-stream`.
