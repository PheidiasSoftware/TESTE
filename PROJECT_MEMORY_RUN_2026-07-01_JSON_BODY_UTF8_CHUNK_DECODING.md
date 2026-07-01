# PROJECT MEMORY RUN - JSON body UTF-8 chunk decoding

## Data

2026-07-01

## Análise inicial

Antes de alterar o repositório, foram examinados:

- `README.md`: confirma backend local leve para programação com Ollama/SLM, Windows, 8 GB RAM e sem GPU; documenta endpoints, testes, CI leve, streaming, geração grande em etapas, cache, rate limit e leitura segura de arquivos.
- `package.json`: continua sem dependências externas, usa Node.js 20+ e `node --test`.
- `src/config.js`: mantém limites conservadores, normalização de `HOST`, `OLLAMA_URL`, modelo, rate limit e allowlist de extensões.
- `src/http.js`: centraliza JSON, SSE, headers de segurança e leitura de corpo JSON com limite por bytes.
- `src/server.js`: expõe rotas locais `GET /health`, `GET /api/status`, `POST /api/generate`, `POST /api/generate-stream`, `POST /api/read-file` e `POST /api/large-code-plan`.
- `src/ollama.js`: mantém payload conservador, sanitização de opções, streaming JSONL com limite por linha e erros upstream seguros.
- `src/project-files.js`: leitura segura de arquivos com bloqueio de travessia, symlink fora da raiz, `.env`, pastas internas, extensões e tamanho.
- `src/large-code.js`: detecta tarefas grandes e cria plano incremental para simular contexto maior sem estourar memória.
- `test/http.test.js`, `test/config.test.js`, `test/ollama.test.js`, `test/project-files.test.js`: testes offline sem Ollama.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20 rodando `npm test`, sem instalar Ollama.
- PRs recentes: nenhum PR retornado pelo conector.
- Issues abertas: nenhuma issue aberta retornada pelo conector.
- Commits recentes pesquisados: sequência de hardenings pequenos em backend, documentação e memória.
- `PROJECT_MEMORY.md`: histórico inicial do projeto e decisões anteriores.
- Registros do Claude Agent: não localizados por busca disponível no repositório nesta execução.

## Decisão

Fazer uma melhoria pequena, segura, reversível e sem dependências externas: endurecer `readJsonBody()` para decodificar chunks UTF-8 com `StringDecoder` em vez de concatenar conversões por chunk.

Motivo: em HTTP real, um caractere multibyte pode chegar dividido entre chunks. Converter cada chunk isoladamente pode gerar caractere de substituição e quebrar JSON válido. `StringDecoder` é módulo nativo do Node.js, preserva bytes parciais entre chunks e mantém o backend leve para PC fraco.

## Arquivos alterados

- `src/http.js`
  - Adicionado `StringDecoder` de `node:string_decoder`.
  - Adicionado helper interno `normalizeBodyChunk()`.
  - `readJsonBody()` agora mede bytes por `Buffer`, usa `decoder.write()` nos chunks e `decoder.end()` no fim do corpo.
  - Mantidos limites de `MAX_BODY_BYTES`, rejeição por `Content-Length`, destruição opcional do stream e contrato de erro existente.

- `test/http.test.js`
  - Adicionado teste offline para JSON com emoji dividido dentro do caractere multibyte entre dois chunks.
  - O teste garante que `readJsonBody()` preserva `{ emoji: '😀' }` corretamente.

## Validações

- Revisão estática do diff via GitHub connector.
- Conferido que a alteração usa apenas módulo nativo do Node.js.
- Conferido que não executa código gerado pelo usuário, não expõe segredos e não adiciona dependências.
- Conferido que o limite por bytes continua aplicado antes de acumular o corpo.
- `npm test` não foi executado neste ambiente porque não há checkout local autorizado; deve ser validado pelo CI ou localmente com Node.js 20+.

## Riscos

- Baixo risco: `StringDecoder` é API nativa e estável do Node.js.
- O helper converte chunks não-Buffer para `Buffer.from(String(chunk))`, mantendo comportamento compatível para mocks e streams incomuns.
- Como o arquivo `src/http.js` foi alterado inteiro pelo Contents API, uma validação de CI é recomendada para confirmar formatação e testes.

## Status MVP backend

Critérios já bem atendidos para MVP backend local:

- API HTTP local com health/status/generate/generate-stream/read-file/large-code-plan.
- Padrões conservadores para Windows, 8 GB RAM e sem GPU.
- Ollama local com modelo pequeno sugerido.
- Streaming SSE com hardening de evento e payload.
- Cache em memória limitado.
- Fila com concorrência baixa.
- Rate limit local.
- Leitura segura de arquivos do projeto.
- Detecção de tarefa grande e planejamento por etapas.
- Testes offline sem Ollama e CI leve.
- Documentação técnica ampla.

Ainda depende de decisão do usuário ou frontend:

- Interface/cliente final para consumir `/api/generate-stream` e `/api/large-code-plan`.
- Escolha final dos modelos Ollama suportados por máquina real.
- Política de armazenamento de histórico/memória de conversa no frontend ou backend.
- Execução real de smoke test em Windows fraco com Ollama instalado.

## Próximos passos sugeridos

1. Executar `npm test` no CI/local.
2. Adicionar smoke test opcional para `/api/generate-stream` com mock/fetch injetável, sem Ollama real.
3. Documentar no frontend/cliente como tratar `largeCodeSuggestion` e iterar etapas.
4. Avaliar persistência leve de cache/memória somente se necessário, evitando SQLite ou dependências antes de validação do MVP.
