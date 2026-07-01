# PROJECT MEMORY RUN - 2026-06-30 - JSON body object validation

## Data/hora

- 2026-06-30 22:38 America/Sao_Paulo

## Avaliação inicial do repositório

Arquivos e áreas examinadas antes da alteração:

- `README.md`: confirma objetivo do backend local leve para LLM/SLM de programação em PC fraco com Windows, 8 GB RAM e sem GPU; documenta Node.js 20+, Ollama local, scripts Windows, testes offline, endpoints e limites conservadores.
- `package.json`: projeto Node.js ESM sem dependências externas pesadas; scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: backend HTTP nativo com rotas `GET /health`, `GET /api/status`, `POST /api/generate`, `POST /api/generate-stream`, `POST /api/read-file` e `POST /api/large-code-plan`; possui fila, cache, rate limit, leitura segura de arquivos, SSE e integração Ollama.
- `src/config.js`: limites conservadores para corpo, timeout, fila, cache, contexto, leitura de arquivos, geração grande e rate limit; sanitização de `OLLAMA_URL`, modelo, host e extensões permitidas.
- `src/http.js`: helpers centrais para JSON, SSE, headers de segurança e leitura limitada de corpo JSON.
- `test/http.test.js` e `test/server.test.js`: cobertura offline para helpers HTTP, rotas, validação, large-code-plan, Content-Type e contratos públicos.
- Issues/PRs abertos pesquisados: não foram encontrados registros abertos relevantes para Claude Agent, backend, Ollama ou geração grande.
- Commits recentes pesquisados: histórico recente indica evolução incremental de documentação/status do MVP backend e validação local.

## Decisão tomada

Melhoria pequena, segura e reversível: reforçar `readJsonBody` para rejeitar payload JSON válido que não seja objeto, como array, `null`, boolean, número ou string.

Motivo:

- As rotas POST esperam contratos de objeto com campos nomeados (`task`, `path`, `contextFiles`, etc.).
- Rejeitar JSON não-objeto cedo evita ambiguidade de validação, melhora mensagens de erro e mantém a API mais previsível para clientes locais.
- A alteração não executa código do usuário, não expõe segredos, não adiciona dependências e não aumenta custo de memória.

## Arquivos alterados/criados

- Alterado: `src/http.js`
  - Adicionado helper interno `isPlainJsonObject`.
  - `readJsonBody` agora valida o resultado de `JSON.parse` e retorna erro `400` com mensagem `JSON precisa ser um objeto.` quando o corpo não é objeto.
  - Corpo vazio continua sendo aceito como `{}` para preservar comportamento existente.

- Alterado: `test/http.test.js`
  - Adicionado teste cobrindo rejeição de `[]`, `null`, `true`, `123` e `"texto"`.

- Criado: `PROJECT_MEMORY_RUN_2026-06-30_JSON_BODY_OBJECT_VALIDATION.md`
  - Registro desta execução, análise inicial, decisão, alterações, validações, riscos e próximos passos.

## Validações executadas

- Revisão estática pelo conteúdo do repositório via GitHub connector.
- Não foi possível executar `npm test` neste ambiente porque não houve checkout local autorizado.

## Riscos

- Baixo: clientes que enviavam JSON array/primitivo para rotas POST passarão a receber `400`. Isso é esperado, pois o contrato documentado usa objetos JSON.
- Corpo vazio ainda é `{}`, então testes e fluxos existentes de erro por campo ausente devem continuar funcionando.

## Pendências

- Rodar `npm test` em ambiente com checkout local.
- Verificar CI do GitHub Actions após os commits.
- Se houver clientes externos, confirmar que todos enviam objeto JSON nas rotas POST.

## Próximos passos seguros

- Adicionar teste de integração em `test/server.test.js` para confirmar que uma rota POST rejeita array JSON com `400` antes de qualquer chamada ao Ollama.
- Documentar no contrato da API que corpos POST devem ser objetos JSON.
- Continuar pequenas melhorias de robustez em streaming SSE, validação de entrada e documentação Windows/8 GB.

## Compatibilidade com Claude Agent

- Nenhum registro aberto de issue/PR relacionado ao Claude Agent foi encontrado nesta execução.
- A alteração é incremental e não conflita com o objetivo do backend MVP leve.
