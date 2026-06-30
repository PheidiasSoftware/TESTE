# PROJECT MEMORY RUN - 2026-06-30 - HTTP security headers hardening 2

## Avaliação inicial

- Repositório `PheidiasSoftware/TESTE` acessível na branch padrão `main`.
- `README.md` confirma o objetivo do backend: LLM/SLM local leve para programação, com foco em Windows, 8 GB RAM e sem GPU.
- `package.json` continua simples, sem dependências externas, usando Node.js 20+ e `node --test`.
- Backend analisado em `src/server.js` e `src/http.js`: API HTTP nativa, geração via Ollama, SSE, fila, cache, leitura segura de arquivos, rate limit e logs estruturados.
- Testes analisados em `test/server.test.js` e `test/http.test.js`: cobrem rotas locais sem Ollama, headers, JSON body, SSE, cache, fila e validações.
- Workflow analisado em `.github/workflows/node-test.yml`: CI leve com Node.js 20 e `npm test`, sem instalar Ollama nem baixar modelos.
- Documentação analisada em `docs/architecture.md`: registra critérios de MVP backend e indica que o principal débito técnico atual é a concentração de responsabilidades em `src/server.js`.
- `PROJECT_MEMORY.md` e `PROJECT_MEMORY_RUN_2026-06-30_HTTP_SECURITY_HEADERS.md` analisados; já havia primeira etapa de headers com `nosniff` e `no-referrer`.
- Busca por PRs e issues abertas no repositório não retornou resultados.
- Não foram encontrados registros conflitantes do Claude Agent nos arquivos examinados nesta execução.

## Decisão tomada

Aplicar uma melhoria pequena, segura e reversível em segurança HTTP: ampliar os headers padrão emitidos por `sendJson()` e `openEventStream()` com proteções conservadoras para uso local/browser, sem adicionar dependências e sem alterar rotas.

## Arquivos alterados/criados

- `src/http.js`
  - `SECURITY_HEADERS` agora também inclui:
    - `x-frame-options: DENY` para reduzir risco de clickjacking em interfaces locais futuras;
    - `cross-origin-resource-policy: same-origin` para restringir leitura cross-origin de recursos;
    - `permissions-policy: camera=(), microphone=(), geolocation=()` para negar permissões de navegador desnecessárias ao backend local.
  - `sendJson()` e `openEventStream()` herdam os novos headers automaticamente.
  - Nenhuma dependência nova foi adicionada.

- `test/http.test.js`
  - Atualizado teste de `SECURITY_HEADERS` para travar o contrato completo dos headers de segurança.
  - Atualizados testes de `sendJson()` e `openEventStream()` para validar os novos headers.

- `PROJECT_MEMORY_RUN_2026-06-30_HTTP_SECURITY_HEADERS_HARDENING_2.md`
  - Criado este registro de execução com análise inicial, decisão, alterações, validações, riscos, pendências e próximos passos.

## Validações executadas

- Revisão estática dos arquivos alterados.
- Conferido que a alteração é restrita aos helpers HTTP e seus testes.
- Conferido que os headers são constantes e de baixo custo, adequados para PC fraco.
- Conferido que a alteração não chama Ollama, não baixa modelos, não executa código de usuário e não adiciona dependências.
- Não foi possível executar `npm test` diretamente pelo conector GitHub nesta execução; a validação final deve ser feita pela CI ou localmente com Node.js 20+.

## Commits gerados nesta execução

- `d3dd8054dc526c4c68df27cf38594d061e56c3ab` - `src/http.js`
- `22ec360dc16c154d4cffce94468b9d123971eb69` - `test/http.test.js`

## Riscos

- `x-frame-options: DENY` impede embutir respostas do backend em iframe. Isso é desejável para segurança local; se um frontend futuro precisar iframe, a decisão deverá ser revista explicitamente.
- `cross-origin-resource-policy: same-origin` é conservador. Para clientes web servidos em outra origem, pode ser necessário ajustar CORS/headers futuramente de forma controlada.
- A alteração afeta respostas JSON e SSE por herança de `SECURITY_HEADERS`; testes foram atualizados para proteger esse contrato.

## Pendências

1. Aguardar/consultar CI do GitHub Actions para confirmar `npm test` após os commits.
2. Rodar `npm test` localmente em Windows/Node.js 20+ quando possível.
3. Continuar reduzindo o débito técnico de `src/server.js`, extraindo rotas/adaptadores em etapas pequenas.
4. Documentar explicitamente política de headers/CORS caso um frontend local separado seja criado.
5. Manter o backend sem execução automática de código gerado pelo modelo.

## Próximo passo sugerido

Na próxima execução segura, priorizar uma melhoria pequena de arquitetura: extrair ou testar uma função isolada de roteamento/erro de `src/server.js`, ou documentar a política de CORS/headers para frontend local, sem mudar comportamento público nem adicionar dependências.
