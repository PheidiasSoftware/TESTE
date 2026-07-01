# PROJECT MEMORY RUN - 2026-07-01 - Ollama stream line limit refinement

## Data/hora

2026-07-01 10:19:56 -03:00

## Avaliação inicial do repositório

Repositório analisado: `PheidiasSoftware/TESTE`, branch padrão `main`, com permissão de escrita pelo conector GitHub.

Arquivos e áreas examinadas antes da alteração:

- `README.md`: confirma objetivo do backend leve para LLM/SLM local em Windows, 8 GB RAM, sem GPU, com Ollama, scripts Windows, testes offline e documentação técnica.
- `package.json`: projeto Node.js 20+, sem dependências externas, scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `.github/workflows/node-test.yml`: CI leve com Node.js 20 e `npm test`, sem instalar Ollama nem baixar modelos.
- `src/server.js`: rotas locais, fila, cache, rate limit, leitura segura, SSE e status público sanitizado.
- `src/config.js`: limites conservadores, normalização de host, porta, `OLLAMA_URL`, modelo e allowlist de extensões.
- `src/ollama.js`: cliente Ollama, payload conservador, parsing JSONL de streaming, sanitização de erro upstream e limite de linha de streaming.
- `test/ollama.test.js`: suíte offline do cliente Ollama e streaming, sem chamada real ao runtime.
- `docs/backend-mvp-status.md` e `docs/api-contract.md`: critérios do MVP, pendências de validação e contrato público.
- PRs recentes: nenhum retornado pelo conector.
- Issues recentes acessíveis: nenhuma retornada pelo conector.
- Busca textual por registros claros de Claude Agent/estado: sem resultados claros pelo conector disponível.

## Decisão tomada

Foi escolhida uma melhoria pequena e segura no backend de streaming do Ollama. O código já limitava o tamanho da linha JSONL pendente para evitar crescimento indefinido de memória, mas fazia a checagem antes de separar `\n`. Isso poderia rejeitar indevidamente um chunk grande e válido contendo muitas linhas JSONL pequenas, embora nenhuma linha individual excedesse o limite seguro.

A alteração refina o comportamento para aplicar o limite por linha processada e pela linha pendente remanescente, mantendo a proteção contra linhas malformadas grandes sem penalizar chunks válidos do runtime local.

## Arquivos alterados/criados

- `src/ollama.js`
  - Substituído `assertSafeStreamBuffer()` por `assertSafeStreamLine(line)`.
  - O streaming agora divide o buffer por `\n` antes de validar o tamanho.
  - Cada linha completa e o buffer pendente são validados contra `MAX_OLLAMA_STREAM_LINE_CHARS`.
  - A validação final do buffer antes do parse final foi mantida.

- `test/ollama.test.js`
  - Adicionado teste offline `readOllamaStream accepts large chunks made of safe JSONL lines`.
  - O teste cobre um chunk grande composto por 10.000 linhas JSONL válidas pequenas e confirma que o parser agrega a resposta corretamente.
  - O teste existente de rejeição de linha malformada acima do limite foi preservado.

- `PROJECT_MEMORY_RUN_2026-07-01_OLLAMA_STREAM_LINE_LIMIT_REFINEMENT.md`
  - Registro desta execução, análise, decisão, arquivos alterados, validações, riscos, pendências e próximos passos.

## Validações executadas

- Revisão estática dos arquivos alterados pelo conector GitHub.
- Não foi executado `npm test` localmente porque o ambiente desta execução bloqueou checkout local do repositório.
- A suíte adicionada é offline e não chama Ollama, não baixa modelos e não executa código gerado pelo usuário.

## Riscos

- Risco baixo: alteração localizada em `readOllamaStream` e coberta por teste offline.
- A mudança preserva o limite de memória por linha JSONL e evita falso positivo em chunks grandes com linhas pequenas.
- Ainda depende de CI ou execução local para confirmação objetiva da suíte completa.

## Pendências

- Confirmar `npm test` ou CI verde no commit final.
- Continuar evitando refatorações grandes até haver validação objetiva recente.
- Manter atenção a proteção de memória total da resposta gerada em streaming, caso o modelo produza saída muito longa em PC de 8 GB RAM.

## Próximos passos sugeridos

1. Rodar `npm test` ou `npm run test:windows` em ambiente com checkout local.
2. Verificar status do workflow `Node.js tests` para o commit final.
3. Como melhoria futura pequena, considerar documentar explicitamente o limite de linha JSONL do streaming em `docs/streaming.md`, se ainda não estiver descrito.

## Compatibilidade com Claude Agent

Não foram encontrados registros claros de Claude Agent nesta execução. A alteração é incremental, reversível por commit e não conflita com os registros de memória existentes do projeto.
