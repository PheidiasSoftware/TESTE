# Revisão de limites numéricos de runtime — 2026-06-29

Esta nota registra uma revisão pequena e segura da configuração numérica do backend local.

## Contexto

O backend já possui padrões conservadores para PC fraco com Windows, 8 GB de RAM e sem GPU. A configuração atual também valida inteiros completos e aplica valores mínimos em limites operacionais como fila, contexto, payload, leitura de arquivos e rate limit.

## Lacuna identificada

A configuração atual reduzia risco de valores baixos demais, inválidos ou ambíguos, mas ainda permitia valores muito altos em algumas variáveis numéricas quando definidos manualmente por ambiente. Em um PC fraco, valores muito altos podem aumentar uso de memória, latência, pressão sobre o runtime local e risco de travamento por prompts ou payloads grandes.

Variáveis sensíveis para essa análise:

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

## Implementação aplicada

Foi introduzido `RUNTIME_NUMERIC_LIMITS` em `src/config.js` com fallback, mínimo e máximo por variável numérica sensível. O helper `parseBoundedInteger` reaproveita o parsing estrito de inteiros e aplica clamp conservador para evitar valores extremos.

Tetos aplicados para o MVP local:

| Variável | Teto aplicado | Motivo |
| --- | ---: | --- |
| `MAX_BODY_BYTES` | `262144` | Evita payloads grandes demais sem bloquear casos locais um pouco maiores. |
| `REQUEST_TIMEOUT_MS` | `300000` | Evita chamadas presas por muito tempo ao modelo local. |
| `MAX_QUEUE_SIZE` | `20` | Evita acúmulo excessivo de pedidos em memória. |
| `GENERATION_CONCURRENCY` | `2` | Mantém CPU/RAM sob controle; padrão continua `1`. |
| `MAX_CACHE_ENTRIES` | `100` | Evita crescimento excessivo de cache em memória. |
| `MAX_FILE_READ_BYTES` | `131072` | Mantém leitura de contexto pequena. |
| `MAX_CONTEXT_FILES` | `12` | Evita prompts com muitos arquivos. |
| `MAX_CONTEXT_BYTES` | `32768` | Mantém contexto compatível com modelos pequenos. |
| `RATE_LIMIT_WINDOW_MS` | `300000` | Evita janelas excessivamente longas. |
| `RATE_LIMIT_MAX_REQUESTS` | `300` | Evita rate limit acidentalmente permissivo demais. |
| `RATE_LIMIT_MAX_CLIENTS` | `2000` | Evita crescimento excessivo do mapa em memória. |

## Critérios de aceitação

- `loadConfig({ MAX_CONTEXT_BYTES: '999999999' })` retorna o teto conservador, não o valor enorme.
- Valores abaixo do mínimo continuam sendo elevados ao mínimo já esperado.
- Valores inválidos, parciais, decimais ou em notação científica continuam caindo para fallback seguro.
- Os padrões documentados no README permanecem inalterados.
- `test/config.test.js` cobre o helper `parseBoundedInteger` e o clamp dos limites numéricos.

## Validação

A alteração foi feita pelo conector GitHub e os arquivos foram relidos após commit para conferir o conteúdo gravado. O conector não executa `npm test`; portanto, a validação objetiva por `npm test`, `npm run test:windows` ou CI verde continua pendente.

## Risco

Baixo. A mudança é incremental, não adiciona dependências, não altera endpoints, não chama Ollama, não executa código de usuário e preserva os padrões conservadores existentes. O impacto fica restrito a configurações extremas definidas por ambiente.