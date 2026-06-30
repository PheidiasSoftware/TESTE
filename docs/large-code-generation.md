# Geração grande de código com contexto em lotes

## Objetivo

O backend precisa ajudar a gerar muito código, mas o alvo continua sendo PC fraco com 8 GB de RAM e sem GPU. Por isso, a abordagem segura não é enviar um contexto gigante de uma vez para o modelo local. A abordagem correta é gerar por etapas, com contexto em lotes e memória resumida entre chamadas.

## Novo endpoint

```http
POST /api/large-code-plan
```

Esse endpoint não chama o Ollama. Ele cria um plano de execução para uma tarefa grande, dividindo o trabalho em etapas pequenas. Cada etapa pode ser enviada depois para `POST /api/generate-stream`.

## Por que não mandar tudo de uma vez?

Modelos pequenos como `qwen2.5-coder:1.5b-instruct` são adequados para PC fraco, mas não suportam contexto realmente gigante como modelos grandes em nuvem. Para manter o app leve e funcional, o backend simula um contexto grande com:

- lotes de arquivos;
- uma etapa por arquivo ou grupo pequeno;
- memória resumida da etapa anterior;
- geração por streaming;
- revisão final de integração.

## Corpo da requisição

```json
{
  "language": "Node.js",
  "task": "Criar um CRUD completo de clientes com rotas, service, validação e testes.",
  "contextFiles": [
    "src/server.js",
    "src/config.js",
    "src/http.js"
  ],
  "targetFiles": [
    "src/modules/customers/routes.js",
    "src/modules/customers/service.js",
    "test/customers.test.js"
  ],
  "previousStepMemory": "Resumo curto do que já foi decidido nas etapas anteriores.",
  "maxFilesPerStep": 2,
  "maxSteps": 12
}
```

## Resposta esperada

A resposta contém:

- `mode`: modo de geração grande;
- `strategy`: estratégia usada;
- `limits`: limites efetivos;
- `totals`: contagem de arquivos, lotes e etapas;
- `steps`: lista de tarefas pequenas;
- `clientFlow`: como o cliente deve executar as etapas.

Cada item de `steps` traz uma `task` pronta para enviar ao endpoint de geração.

## Fluxo recomendado

1. Chamar `/api/large-code-plan` com a tarefa grande.
2. Pegar `steps[0].task` e enviar para `/api/generate-stream`.
3. Salvar um resumo curto do resultado.
4. Enviar a próxima etapa para `/api/generate-stream`, usando o resumo como `previousStepMemory` em uma nova chamada de planejamento, ou incluindo o resumo no campo `context`.
5. Repetir até a etapa final de revisão.

## Exemplo PowerShell

```powershell
$body = @{
  language = "Node.js"
  task = "Criar CRUD completo de clientes com validação e testes"
  contextFiles = @("src/server.js", "src/config.js", "src/http.js")
  targetFiles = @("src/modules/customers/routes.js", "src/modules/customers/service.js", "test/customers.test.js")
  maxFilesPerStep = 2
  maxSteps = 10
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Uri "http://127.0.0.1:3131/api/large-code-plan" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

Depois use a `task` de cada etapa:

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:3131/api/generate-stream" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    language = "Node.js"
    task = $step.task
    contextFiles = $step.contextFiles
  } | ConvertTo-Json -Depth 5)
```

## Variáveis relacionadas

| Variável | Padrão | Uso |
| --- | --- | --- |
| `MAX_LARGE_PLAN_FILES` | `50` | Máximo de arquivos aceitos em `contextFiles` ou `targetFiles` no planejamento grande |
| `MAX_LARGE_PLAN_STEPS` | `20` | Máximo de etapas do plano |
| `MAX_FILES_PER_CONTEXT_BATCH` | `4` | Quantidade de arquivos de contexto por etapa |

## Segurança

- O endpoint de plano não executa código.
- O endpoint de plano não chama o Ollama.
- O backend continua sem escrever arquivos automaticamente.
- A geração real continua passando pela fila e pelo streaming.
- O contexto por etapa continua limitado para proteger memória.

## Limitação importante

Esse recurso não transforma um modelo pequeno em um modelo de contexto infinito. Ele cria um fluxo prático para trabalhar com projetos grandes em partes pequenas e controladas.
