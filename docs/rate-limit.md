# Rate limit local em memória

Este backend usa um rate limit simples de janela fixa em memória para proteger PCs fracos contra excesso acidental de requisições nas rotas mais custosas.

## Rotas protegidas

O limite é aplicado somente em rotas que podem consumir CPU, RAM ou leitura de disco:

- `POST /api/generate`
- `POST /api/generate-stream`
- `POST /api/read-file`

As rotas `GET /health` e `GET /api/status` continuam sem bloqueio para permitir diagnóstico mesmo quando o limite das rotas pesadas for atingido.

## Variáveis de ambiente

| Variável | Padrão | Uso |
| --- | --- | --- |
| `ENABLE_RATE_LIMIT` | `true` | Ativa ou desativa o rate limit. Use `false` somente em ambiente local controlado. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Janela fixa em milissegundos. |
| `RATE_LIMIT_MAX_REQUESTS` | `30` | Máximo de requisições por cliente dentro da janela. |
| `RATE_LIMIT_MAX_CLIENTS` | `500` | Máximo de clientes rastreados em memória. |
| `TRUST_PROXY` | `false` | Quando `true`, usa `x-forwarded-for`. Mantenha `false` no uso local padrão. |

## Comportamento quando excede

Quando o limite é excedido, a API retorna `HTTP 429` com:

- `retryAfterMs`
- `resetAt`
- `rateLimit`

Também envia o header `Retry-After` em segundos.

Exemplo de erro:

```json
{
  "error": "Muitas requisições em pouco tempo. Aguarde antes de tentar novamente.",
  "retryAfterMs": 42000,
  "resetAt": "2026-06-28T07:00:00.000Z"
}
```

## Decisão de arquitetura

A implementação fica em memória e não usa Redis, banco de dados ou dependências externas. Isso mantém o MVP leve para Windows com 8 GB de RAM e sem GPU.

A estratégia é propositalmente simples:

- janela fixa por cliente;
- identificação por socket local por padrão;
- poda de clientes expirados;
- limite de clientes ativos para evitar crescimento indefinido;
- métricas expostas em `/health` e `/api/status`.

Essa proteção não substitui autenticação, firewall ou proxy reverso em produção. O objetivo atual é reduzir travamentos e abuso acidental em uso local.
