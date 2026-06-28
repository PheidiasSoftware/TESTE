# Memória de execução - Integração de clientes locais

## Data/hora

2026-06-28 06:35 America/Sao_Paulo

## Avaliação inicial do repositório

Antes de qualquer alteração, o repositório `PheidiasSoftware/TESTE` foi examinado conforme regra obrigatória.

Áreas conferidas:

- Metadados do repositório
  - Repositório público, branch padrão `main`.
  - Permissão de escrita disponível.

- Issues e PRs
  - Busca por issues abertas não retornou pendências abertas.
  - Busca por PRs recentes não retornou PRs ativos ou discussões recentes.

- `README.md`
  - Documentava objetivo do backend local leve para programação em PC fraco com Windows, 8 GB RAM e sem GPU.
  - Documentava execução, testes, CI, endpoints, streaming, leitura segura, logs e proteção para PC fraco.
  - Ainda não linkava `docs/model-selection.md`, apesar de esse guia já existir.
  - Ainda não possuía guia direto para integração com cliente VS Code/Flutter.
  - A tabela de variáveis ainda não listava explicitamente variáveis de rate limit, embora o backend já as suportasse.

- `package.json`
  - Projeto Node.js ESM sem dependências externas.
  - Scripts: `start`, `start:windows`, `dev` e `test`.

- `src/server.js`
  - Backend HTTP nativo.
  - Integração com Ollama.
  - Fila conservadora de geração.
  - Cache por prompt.
  - Leitura segura de arquivos.
  - Contexto por arquivos.
  - Streaming SSE.
  - Logs estruturados com redaction.
  - Rate limit nas rotas pesadas.

- `src/rate-limit.js`
  - Rate limiter de janela fixa em memória, sem dependências externas.
  - Limite de clientes ativos para evitar crescimento indefinido.

- `scripts/start-windows.ps1`
  - Script Windows com defaults conservadores, verificação do Ollama e exibição de rate limit/logging.

- `docs/model-selection.md`
  - Guia já criado para seleção de modelos leves.
  - Pendente apenas linkagem no README.

- `PROJECT_MEMORY_RUN_2026-06-28_MODEL_SELECTION.md`
  - Indicava como próximo passo linkar o guia de modelos no README e/ou documentar integração futura com cliente VS Code/Flutter.

## Decisão tomada

A melhoria segura desta execução foi focar em documentação de integração de clientes locais e atualização do README.

Motivos:

- O backend já possui recursos principais do MVP local.
- A próxima etapa natural é permitir que um cliente local use a API com segurança.
- A mudança é incremental, reversível e não altera comportamento de runtime.
- Não adiciona dependências nem assume hardware acima de 8 GB RAM sem GPU.
- Evita execução automática insegura de código gerado.

## Arquivos criados/alterados

### Criado: `docs/client-integration.md`

Conteúdo principal:

- Princípios de integração local.
- Fluxo recomendado para cliente.
- Uso de `GET /health`.
- Uso de `POST /api/generate`.
- Uso de `POST /api/generate-stream` via SSE.
- Exemplo JavaScript de consumo de streaming.
- Recomendações para Flutter/Dart.
- Recomendações para extensão VS Code.
- Tratamento de `429` e `Retry-After`.
- Segurança de arquivos e bloqueio de segredos.
- Tarefas adequadas e inadequadas para cliente local.
- Critério de aceite para cliente MVP.

### Alterado: `README.md`

Melhorias:

- Criada seção `Guias técnicos` com links para:
  - `docs/streaming.md`
  - `docs/rate-limit.md`
  - `docs/model-selection.md`
  - `docs/client-integration.md`
- Adicionadas variáveis de ambiente já suportadas pelo backend:
  - `ENABLE_RATE_LIMIT`
  - `RATE_LIMIT_WINDOW_MS`
  - `RATE_LIMIT_MAX_REQUESTS`
  - `RATE_LIMIT_MAX_CLIENTS`
  - `TRUST_PROXY`
- Atualizada seção de proteção para PC fraco com rate limit recomendado.
- Atualizadas decisões de arquitetura para citar rate limit.
- Atualizados próximos passos para validar integração inicial com cliente VS Code ou Flutter.

## Validações executadas

- Validação estática manual da documentação criada.
- Conferido que o guia não recomenda execução automática de código gerado.
- Conferido que o guia orienta respeito a `429` e `Retry-After`.
- Conferido que o guia mantém conexão local em `127.0.0.1` como padrão.
- Conferido que o README agora linka `docs/model-selection.md`, resolvendo pendência anterior.
- Conferido que as variáveis de rate limit documentadas já existem em `src/server.js` e `scripts/start-windows.ps1`.
- Não foi possível executar `npm test` pelo conector GitHub nesta execução; nenhuma alteração de runtime foi feita.

## Riscos

- O exemplo de streaming em JavaScript é documentação de referência e deve ser testado em cliente real futuramente.
- Ainda falta validação prática em Windows real com Ollama instalado.
- Ainda falta escolher se o primeiro cliente será extensão VS Code, app Flutter ou interface web local simples.

## Pendências

1. Executar `npm test` localmente ou validar pela CI.
2. Testar `npm run start:windows` em Windows real com Ollama instalado.
3. Testar `/api/generate-stream` com modelo real.
4. Escolher primeiro cliente MVP: VS Code, Flutter desktop ou web local.
5. Considerar separação gradual de `src/server.js` em módulos menores.
6. Se a próxima execução focar backend puro, extrair configuração ou helpers de resposta HTTP para módulos pequenos e testáveis.

## Compatibilidade com Claude Agent

Nenhum arquivo de estado, branch, PR, issue ou instrução conflitante do Claude Agent foi encontrado nesta execução. As alterações foram limitadas a documentação e memória de execução, reduzindo risco de conflito.

## Próximo passo sugerido

Na próxima execução segura, priorizar uma refatoração pequena de backend: extrair configuração ou helpers HTTP de `src/server.js` para módulos menores, mantendo todos os contratos públicos e sem adicionar dependências.
