# Headers de segurança HTTP

Este documento registra o contrato prático dos headers de segurança enviados pelo backend local nas respostas JSON e SSE.

## Objetivo

Manter o backend seguro por padrão para uso local em PC fraco com Windows, 8 GB de RAM e sem GPU, sem adicionar dependências externas e sem depender de proxy, CDN ou servidor web adicional.

## Headers enviados

O helper HTTP central aplica os headers abaixo em respostas JSON e em streams SSE:

| Header | Valor | Motivo |
| --- | --- | --- |
| `content-security-policy` | `default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'` | Mantém respostas da API sem carregamento de recursos, sem incorporação por páginas externas, sem base URL e sem envio de formulários. |
| `x-content-type-options` | `nosniff` | Evita interpretação automática de tipo de conteúdo pelo navegador. |
| `x-frame-options` | `DENY` | Evita carregamento em iframe por páginas externas. |
| `referrer-policy` | `no-referrer` | Evita envio de URL local como referência. |
| `x-robots-tag` | `noindex, nofollow, noarchive` | Reduz risco de indexação ou arquivamento se a API local for exposta por engano por túnel, proxy ou configuração incorreta. |
| `cross-origin-resource-policy` | `same-origin` | Reduz exposição de recursos para outras origens. |
| `cross-origin-opener-policy` | `same-origin` | Isola o contexto de navegação contra interações cross-origin indesejadas quando respostas forem abertas por navegador local. |
| `x-permitted-cross-domain-policies` | `none` | Bloqueia políticas cross-domain legadas, mantendo o backend textual restrito ao uso local esperado. |
| `permissions-policy` | `camera=(), microphone=(), geolocation=()` | Desativa permissões de navegador que o backend textual não precisa. |

## Rotas cobertas

As respostas JSON usam `content-type: application/json; charset=utf-8` e `cache-control: no-store`.

As respostas SSE usam `content-type: text/event-stream; charset=utf-8`, `cache-control: no-store, no-transform`, `connection: keep-alive` e `x-accel-buffering: no`.

Rotas atuais cobertas pelo helper central:

- `GET /health`
- `GET /api/status`
- `POST /api/generate`
- `POST /api/generate-stream`
- `POST /api/read-file`
- `POST /api/large-code-plan`

## Observações para clientes locais

- Clientes web locais devem tratar esses headers como parte do comportamento esperado.
- O backend não habilita CORS amplo por padrão.
- A política CSP é restritiva porque a API retorna JSON e SSE, não HTML executável.
- A API foi pensada para uso em `127.0.0.1`, não para exposição direta na internet.
- `x-robots-tag` é uma defesa auxiliar; não substitui manter `HOST=127.0.0.1`, firewall local e ausência de túnel público.
- Se um frontend local precisar rodar em outra origem, a liberação deve ser uma decisão explícita e documentada, não um padrão aberto.

## Arquivo de referência

A implementação fica centralizada em `src/http.js`, no objeto `SECURITY_HEADERS`, para evitar divergência entre rotas.
