# PROJECT MEMORY RUN - 2026-07-01 - SSE fallback event name hardening

## Análise inicial

Antes de alterar qualquer arquivo, o repositório `PheidiasSoftware/TESTE` foi reexaminado com foco em backend leve para PC fraco com Windows, 8 GB RAM e sem GPU.

Arquivos e áreas conferidas nesta execução:

- `README.md`: confirma escopo de backend Node.js local, sem dependências externas, com Ollama, fila, cache, leitura segura, streaming SSE, geração grande em etapas, documentação técnica e scripts Windows.
- `package.json`: mantém `type=module`, `node --test`, scripts Windows e nenhuma dependência pesada.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20, sem instalar Ollama nem baixar modelos.
- `src/server.js`: rotas HTTP principais, fila, cache, rate limit, leitura segura, geração normal e streaming.
- `src/http.js`: helpers de JSON, headers de segurança, SSE e leitura de corpo JSON.
- `src/ollama.js`: cliente Ollama com normalização de payload, streaming JSONL e limites de linha.
- `src/config.js`: normalização de variáveis de ambiente conservadoras.
- `scripts/start-windows.ps1`: inicialização Windows com padrões conservadores e redaction de URL.
- `docs/backend-mvp-status.md`: registra que o MVP backend está funcional por implementação/documentação, mas a estabilidade depende de `npm test`, `npm run test:windows` ou CI verde.
- `PROJECT_MEMORY.md`: histórico inicial do projeto e pendências recorrentes.
- Issues/PRs: consulta por issues abertas e PRs recentes não retornou itens relevantes nesta execução.
- Commits recentes: encontrados registros recentes de execuções backend e documentação de hardening.
- Registros do Claude Agent: nenhuma evidência clara localizada pelas buscas disponíveis nesta execução.

## Decisão tomada

Foi escolhida uma melhoria pequena, segura, reversível e objetiva no backend: endurecer a normalização do fallback de nomes de eventos SSE.

Motivo técnico: `sendServerEvent()` já normalizava o nome do evento recebido, mas `normalizeServerEventName(value, fallback)` retornava o fallback diretamente quando o valor principal ficava vazio. Embora o uso atual passe fallbacks internos, a função é exportada e testada; normalizar também o fallback reduz risco futuro de injeção de linhas/eventos em SSE caso algum chamador novo forneça fallback dinâmico.

A mudança não adiciona dependências, não altera endpoints públicos e mantém compatibilidade com os eventos atuais (`metadata`, `token`, `done`, `error`).

## Arquivos alterados

### `src/http.js`

- Adicionada função interna `sanitizeServerEventName()`.
- `normalizeServerEventName()` agora:
  - sanitiza o nome principal;
  - se ficar vazio, sanitiza também o fallback;
  - se ambos ficarem vazios, retorna `message`.
- Mantido o conjunto seguro de caracteres de evento SSE: `A-Z`, `a-z`, `0-9`, `_`, `.`, `-`.

### `test/http.test.js`

- Adicionado teste para fallback inseguro com quebra de linha e pseudo-campo SSE.
- Adicionado teste garantindo fallback final para `message` quando o fallback também fica vazio.

## Validações

- Revisão estática dos arquivos alterados.
- Conferido que a alteração é isolada em helper puro e teste offline.
- Conferido que a mudança não chama Ollama, não executa código gerado por usuário, não expõe segredos e não adiciona dependências.
- `npm test` não foi executado nesta automação porque o checkout local não estava autorizado/disponível pelo ambiente de execução.

## Riscos

- Risco baixo: a alteração só afeta casos em que o nome de evento principal é vazio/inválido e um fallback é fornecido.
- Se algum consumidor externo dependia de fallback contendo caracteres fora da allowlist, esse fallback agora será normalizado. Isso é intencional para manter o contrato SSE seguro.

## Pendências e próximos passos

1. Executar `npm test` ou `npm run test:windows` em ambiente local com Node.js 20+.
2. Confirmar CI verde no GitHub Actions após os commits desta execução.
3. Continuar priorizando melhorias pequenas em robustez de streaming, segurança, cache, fila e documentação.
4. Evitar refatorações amplas em `src/server.js` até haver validação objetiva dos testes.

## Status do MVP backend

O backend continua atendendo aos critérios funcionais do MVP por implementação e documentação:

- API local Node.js 20+ sem dependências externas pesadas.
- Padrões conservadores para Windows, 8 GB RAM e sem GPU.
- Integração Ollama/SLM local.
- Geração normal e streaming SSE.
- Fila com concorrência conservadora.
- Cache em memória.
- Detecção/planejamento de geração grande em etapas.
- Leitura segura de arquivos do projeto.
- Rate limit local.
- Testes offline com `node --test`.
- CI leve configurada.

Ainda depende de decisão/validação externa:

- Confirmação de `npm test`, `npm run test:windows` ou CI verde para declarar estabilidade.
- Decisões de frontend/cliente sobre como consumir `/api/generate-stream`, `/api/large-code-plan` e contextos grandes.
