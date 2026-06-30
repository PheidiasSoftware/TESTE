# Validação de requisições de geração

Registro técnico do contrato de validação aplicado às rotas de geração textual do backend local.

## Escopo

Aplica-se a:

- `POST /api/generate`
- `POST /api/generate-stream`

As rotas continuam aceitando apenas JSON com `Content-Type: application/json` ou media type compatível `+json`.

## Campo `task`

`task` é obrigatório e precisa ser uma string não vazia após `trim()`.

Entradas rejeitadas com `HTTP 400` antes de chamar Ollama:

```json
{ "task": "" }
```

```json
{ "task": "      " }
```

```json
{ "language": "Node.js" }
```

Motivo: uma tarefa vazia não deve ocupar fila, cache ou runtime local em máquina fraca.

## Campo `language`

`language` continua opcional.

Comportamento:

- string com texto: remove caracteres de controle, compacta espaços, aplica `trim()` e limita a 80 caracteres antes de entrar no prompt;
- string vazia ou somente espaços: usa `general`;
- tipo não textual: usa `general`.

Motivo: `language` é metadado curto do prompt, não um campo livre de contexto. A normalização evita quebrar a linha `Linguagem/foco:` com quebras de linha, tabulações ou caracteres de controle.

## Campo `context`

`context` continua opcional e serve somente para trechos pequenos e controlados do projeto.

Comportamento:

- string: normaliza CRLF/CR para LF, remove caracteres de controle não textuais e limita por `MAX_CONTEXT_BYTES` sem dividir caracteres UTF-8;
- tipo não textual: ignora o valor e usa contexto vazio;
- quebras de linha LF são preservadas porque contexto técnico costuma depender de formatação legível.

Motivo: manter o contexto manual útil para leitura de código, mas impedir NUL e outros caracteres de controle que podem poluir prompts, logs indiretos, testes ou clientes locais.

## Segurança e performance

Esta validação é executada antes da chamada ao modelo local. Ela não executa código do usuário, não baixa modelos e não adiciona dependências externas.

## Testes esperados

Cobertura em `test/generate-validation.test.js`:

- `normalizeLanguageFocus()` remove quebras de linha, tabulações e aplica fallback `general`;
- `normalizeLanguageFocus()` limita o foco técnico a 80 caracteres;
- `buildCodingPrompt()` recebe o foco técnico normalizado em uma única linha de metadados;
- `/api/generate` rejeita `task` só com espaços, quebra de linha e tabulação;
- `/api/generate-stream` rejeita `task` vazia antes de abrir SSE.

Cobertura em `test/project-files.test.js`:

- `normalizeManualContext()` remove controles não textuais, preserva quebras de linha úteis e ignora valores não textuais;
- `normalizeManualContext()` reaproveita o corte seguro por UTF-8;
- `buildContextFromFiles()` continua limitando o contexto manual sem quebrar UTF-8.

A validação final objetiva ainda deve ser confirmada com:

```bash
npm test
```

ou no Windows:

```powershell
npm run test:windows
```
