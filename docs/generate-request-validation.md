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

- string com texto: o valor é normalizado com `trim()` e limitado antes de entrar no prompt;
- string vazia ou somente espaços: usa `general`;
- tipo não textual: usa `general`.

## Segurança e performance

Esta validação é executada antes da chamada ao modelo local. Ela não executa código do usuário, não baixa modelos e não adiciona dependências externas.

## Testes esperados

Cobertura adicionada em `test/generate-validation.test.js`:

- `/api/generate` rejeita `task` só com espaços, quebra de linha e tabulação;
- `/api/generate-stream` rejeita `task` vazia antes de abrir SSE.

A validação final objetiva ainda deve ser confirmada com:

```bash
npm test
```

ou no Windows:

```powershell
npm run test:windows
```
