# Memória do projeto - hardening de HOST local

Data/hora: 2026-06-29 19:34 BRT

## Avaliação inicial do repositório

Antes de qualquer alteração, o repositório `PheidiasSoftware/TESTE` foi reexaminado pelo conector GitHub.

Arquivos e áreas analisadas:

- `README.md`
- `package.json`
- `src/config.js`
- `src/project-files.js`
- `src/server.js`
- `test/config.test.js`
- `test/project-files.test.js`
- `docs/backend-mvp-status.md`
- PRs recentes do usuário no repositório
- issues abertas do repositório

Resumo técnico observado:

- Backend Node.js 20+ sem dependências externas pesadas.
- API local com Ollama, fila conservadora, cache, streaming SSE, leitura segura de arquivos, rate limit e logs estruturados.
- Helpers Windows e documentação já existem para start/test em PC fraco.
- `src/config.js` já possuía parsing seguro para porta, URL do Ollama, booleanos, inteiros, log level e extensões permitidas.
- `src/server.js` ainda concentra roteamento e handlers, mas refatoração maior continua arriscada sem evidência objetiva de `npm test`/CI verde.

## Claude Agent

Não foram encontrados PRs recentes, issues abertas ou registros claros de Claude Agent pelo conector disponível nesta execução. A alteração foi mantida pequena e compatível com agentes futuros.

## Decisão tomada

A próxima tarefa segura foi endurecer a configuração de `HOST`, mantendo o backend preso a interfaces locais por padrão. Como o objetivo do projeto é uma LLM/SLM local para PC fraco, sem exposição pública por padrão, valores como `0.0.0.0`, `::` ou IPs de rede agora retornam ao fallback seguro `127.0.0.1`.

Essa mudança reduz risco de exposição acidental da API local sem adicionar dependências e sem alterar endpoints.

## Arquivos alterados

- `src/config.js`
  - Criado `normalizeHost`.
  - `loadConfig` passou a usar `normalizeHost(env.HOST)`.
  - Hosts aceitos: `127.0.0.1`, `localhost`, `::1`, `[::1]`.
  - Hosts públicos ou inválidos caem para `127.0.0.1`.

- `test/config.test.js`
  - Importado `normalizeHost`.
  - Adicionados testes para hosts locais permitidos.
  - Adicionados testes para fallback quando `HOST` tenta bind público.

## Validações executadas

- Validação estática por leitura dos arquivos via conector GitHub.
- Não foi possível executar `npm test` localmente porque a tentativa de checkout local do repositório foi bloqueada pelo ambiente de execução.
- A validação objetiva ainda depende de `npm test`, `npm run test:windows` ou CI verde.

## Riscos

- A mudança é intencionalmente restritiva: quem tentar expor a API na LAN usando `HOST=0.0.0.0` não conseguirá com a configuração atual.
- Isso está alinhado ao MVP local e seguro, mas exposição em rede deve ser tratada futuramente como recurso explícito, com autenticação, documentação de risco e opt-in claro.

## Pendências

1. Confirmar `npm test` ou `npm run test:windows` em checkout limpo.
2. Confirmar CI verde no GitHub Actions para o commit mais recente.
3. Atualizar documentação de ambiente para explicar que `HOST` aceita somente loopback no MVP.
4. Só depois de validação verde considerar extração incremental de handlers/rotas de `src/server.js`.

## Próximos passos recomendados

- Prioridade imediata: validação objetiva da suíte offline.
- Próxima melhoria segura após validação: documentar formalmente a política de bind local e, se necessário, planejar um modo futuro `ALLOW_PUBLIC_BINDING=true` com autenticação obrigatória.
