# PROJECT MEMORY RUN - 2026-06-30 - HTTP SECURITY HEADERS

## Data/hora

2026-06-30 07:37 America/Sao_Paulo.

## Avaliação inicial do repositório

Antes de qualquer alteração, o repositório `PheidiasSoftware/TESTE` foi reexaminado via conector GitHub.

Arquivos e áreas verificados:

- `README.md`: confirma backend local Node.js para LLM/SLM leve de programação, Windows, 8 GB RAM, sem GPU, runtime local Ollama e modelo pequeno `qwen2.5-coder:1.5b-instruct`.
- `package.json`: projeto ESM sem dependências externas, scripts `start`, `start:windows`, `dev`, `test` e `test:windows`.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20, sem Ollama, sem GPU e com ambiente conservador.
- `src/server.js`: rotas HTTP locais, fila, cache, rate limit, leitura segura, status público sanitizado, logs estruturados e console de inicialização sem `PROJECT_ROOT` absoluto.
- `src/config.js`: configuração endurecida para host local, porta, URL Ollama, modelo, limites numéricos, extensões e redaction de logs.
- `src/http.js`: helpers de JSON, SSE e leitura de corpo com limite/abort.
- `src/project-files.js`: leitura segura de arquivos, allowlist, bloqueio de caminhos sensíveis e truncamento UTF-8 seguro.
- `test/http.test.js` e `test/server.test.js`: cobertura offline sem chamar Ollama.
- `docs/api-contract.md`: contrato HTTP local.
- `docs/backend-mvp-status.md`: histórico de execuções, critérios atendidos e pendência de validação objetiva por `npm test`, `npm run test:windows` ou CI verde.
- `PROJECT_MEMORY_RUN_2026-06-30_STARTUP_CONSOLE_REDACTION.md`: memória anterior e próximo passo sugerido.
- Issues/PRs: PRs recentes e issues abertas foram consultados; não houve resultados relevantes.
- Claude Agent: buscas por registros claros não retornaram evidência de branches, PRs, issues ou arquivos de estado atribuíveis ao Claude Agent nesta execução.

## Risco/lacuna encontrada

As respostas JSON já usavam `cache-control: no-store` e SSE já usava `no-store, no-transform`, mas os helpers HTTP não tinham headers simples de segurança para integração com clientes locais/browser.

Para uma API local usada por ferramentas de programação, é seguro e leve adicionar:

- `x-content-type-options: nosniff`, reduzindo risco de interpretação incorreta de conteúdo;
- `referrer-policy: no-referrer`, evitando vazamento acidental de URLs locais em navegação/integrações browser.

A mudança é pequena, não altera rotas, não adiciona dependências, não chama Ollama e não aumenta uso de memória relevante.

## Decisão tomada

Aplicar uma melhoria incremental e reversível nos helpers HTTP centrais, cobrindo JSON e SSE com headers de segurança leves.

## Arquivos alterados/criados

- Alterado `src/http.js`:
  - exporta `SECURITY_HEADERS`;
  - `sendJson()` inclui `x-content-type-options: nosniff` e `referrer-policy: no-referrer`;
  - `openEventStream()` inclui os mesmos headers para SSE.
- Alterado `test/http.test.js`:
  - adiciona teste para contrato de `SECURITY_HEADERS`;
  - atualiza teste de `sendJson()` para validar headers de segurança;
  - atualiza teste de `openEventStream()` para validar headers de segurança.
- Alterado `docs/api-contract.md`:
  - documenta que respostas JSON e SSE incluem `x-content-type-options: nosniff` e `referrer-policy: no-referrer`.
- Criado este arquivo `PROJECT_MEMORY_RUN_2026-06-30_HTTP_SECURITY_HEADERS.md`.

## Validações executadas

Validação por inspeção via conector GitHub. Não foi possível executar `npm test` localmente pelo conector.

Testes adicionados/atualizados para futura validação offline:

```bash
npm test
```

ou no Windows:

```powershell
npm run test:windows
```

## Commits gerados

- `2589b3ee5b6ccada6a9b6ab3aa760f1db1a053a8` - `src/http.js`
- `4fa0865f8bc22df1c8df2dbd572d5d64690cc4c2` - `test/http.test.js`
- `d2b6e111550aa979f42e90cf0cf590eeddae8a2a` - `docs/api-contract.md`

## Riscos

- Como não houve execução real de `npm test`, pode existir erro de sintaxe não detectado até CI/local.
- A mudança é central em `src/http.js`, mas é pequena e reversível: remover `SECURITY_HEADERS` e os asserts novos restaura o comportamento anterior.
- Headers adicionais podem ser observados por clientes HTTP, mas não devem quebrar clientes bem formados.

## Pendências

- Confirmar `npm test`, `npm run test:windows` ou CI verde no commit mais recente.
- Continuar evitando funcionalidades grandes enquanto não houver evidência objetiva de testes passando.
- Frontend/cliente visual ainda depende de decisão do usuário.
- Integração opcional direta com `llama.cpp` segue como decisão futura.

## Próximos passos sugeridos

1. Confirmar CI/checks do commit final.
2. Se CI estiver verde, revisar a saída de erro de `/api/read-file` para garantir que nenhuma mensagem de erro inesperada inclua caminho absoluto em casos de falha de sistema de arquivos.
3. Depois, manter a evolução incremental em pontos pequenos de segurança, contrato HTTP e documentação Windows.
