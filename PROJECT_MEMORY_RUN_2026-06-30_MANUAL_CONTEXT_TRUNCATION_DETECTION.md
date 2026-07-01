# PROJECT MEMORY RUN - 2026-06-30 - Manual context truncation detection

## Data/hora

2026-06-30 22:20 America/Sao_Paulo

## Avaliação inicial do repositório

Arquivos e áreas examinadas antes de alterar:

- `README.md`: confirma objetivo do backend local leve para programação, Windows, 8 GB RAM, sem GPU, uso inicial com Ollama e modelo pequeno `qwen2.5-coder:1.5b-instruct`.
- `package.json`: projeto Node.js ESM sem dependências externas, scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `.github/workflows/node-test.yml`: CI leve com Node.js 20 e `npm test`, sem Ollama/modelo/GPU.
- `src/server.js`: rotas locais, fila, cache, leitura segura de arquivos, streaming SSE, detecção de tarefa grande e planejamento por etapas.
- `src/config.js`: limites conservadores para corpo, contexto, fila, cache, leitura de arquivos e rate limit.
- `src/large-code.js`: `assessLargeCodeRequest` já trata `contextTruncated` como motivo para sugerir `/api/large-code-plan`.
- `test/server.test.js`: testes offline de contrato HTTP, rotas, validação, fila, cache, large-code-plan e leitura segura.
- Issues/PRs: busca no repositório não encontrou issues abertas ou PRs recentes relevantes; também não foram encontrados registros explícitos de Claude Agent via busca disponível.

## Decisão tomada

Foi escolhida uma correção pequena e segura no backend: preservar o contexto manual completo até a função responsável por normalizar e truncar contexto (`buildContextFromFiles`). Antes, `src/server.js` fazia `body.context.slice(0, MAX_CONTEXT_BYTES)` antes da montagem do contexto. Isso limitava memória, mas impedia `buildContextFromFiles` de marcar `truncated: true` para contexto manual grande. Como `assessLargeCodeRequest` já usa `contextTruncated` para redirecionar para geração em etapas, a rota podia deixar de sugerir `/api/large-code-plan` quando o usuário enviava um contexto manual grande.

## Arquivos alterados/criados

- Alterado: `src/server.js`
  - Removido o corte antecipado de `body.context` em `buildGenerateRequestPayload`.
  - O contexto manual agora é entregue a `buildContextFromFiles`, que aplica `MAX_CONTEXT_BYTES` e preserva o sinal `contextBundle.truncated`.
- Criado: `test/manual-context-truncation.test.js`
  - Novo teste offline para `POST /api/generate` com contexto manual acima do limite.
  - Espera HTTP `422`, sugestão de `POST /api/large-code-plan`, razão `context-truncated` e `detection.contextTruncated=true`.
- Criado: `PROJECT_MEMORY_RUN_2026-06-30_MANUAL_CONTEXT_TRUNCATION_DETECTION.md`
  - Registro desta execução.

## Validações executadas

- Revisão estática via leitura do repositório pelo conector GitHub.
- Não foi possível executar `npm test` nesta execução porque não há checkout local disponível/autorizado para comandos no repositório.

## Segurança e compatibilidade

- Nenhuma dependência nova adicionada.
- Nenhuma execução de código gerado pelo usuário.
- Nenhum segredo lido ou exposto.
- A alteração mantém o limite efetivo de contexto em `buildContextFromFiles` e melhora a decisão de usar geração grande em etapas.
- Compatível com PC fraco: contexto continua limitado por `MAX_CONTEXT_BYTES` antes de montar o prompt final.

## Riscos

- O teste novo depende do valor padrão `MAX_CONTEXT_BYTES=12000`; ele usa 13.000 caracteres para passar desse limite sem exceder `MAX_BODY_BYTES`.
- Como os testes não foram executados localmente aqui, a validação final deve ocorrer no GitHub Actions ou em um clone local com Node.js 20+.

## Pendências e próximos passos

- Aguardar/consultar CI do GitHub Actions para confirmar `npm test`.
- Próxima melhoria segura sugerida: documentar no guia de geração grande que contexto manual truncado também aciona `/api/large-code-plan`, ou adicionar um teste equivalente para `POST /api/generate-stream`.

## Critério de MVP

O backend já possui rotas essenciais, fila, cache, leitura segura de arquivos, streaming, planejamento grande, rate limit, logs estruturados, scripts Windows e documentação. Ainda dependem de decisão do usuário/frontend: interface visual, UX de seleção de arquivos/contexto, histórico persistente de sessões e eventual integração alternativa com llama.cpp.
