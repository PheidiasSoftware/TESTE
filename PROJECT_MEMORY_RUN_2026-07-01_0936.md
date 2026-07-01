# PROJECT_MEMORY_RUN_2026-07-01_0936

## Data/hora

2026-07-01 09:36 America/Sao_Paulo

## Avaliação inicial do repositório

- Repositório `PheidiasSoftware/TESTE` acessível pelo conector GitHub com permissão de escrita.
- Branch padrão verificada: `main`.
- `README.md` analisado: documenta backend local leve para programação em PC fraco Windows/Linux, Node.js 20+, 8 GB RAM, sem GPU obrigatória, Ollama local, scripts Windows, testes offline, CI leve, endpoints e variáveis de ambiente conservadoras.
- `package.json` analisado: projeto ESM sem dependências externas, scripts `start`, `start:windows`, `dev`, `test`, `test:windows` e `smoke:windows`.
- Backend analisado em `src/server.js` e `src/ollama.js`: API HTTP nativa, fila com concorrência conservadora, cache em memória, leitura segura de arquivos, rate limit, streaming SSE e cliente Ollama com payload sanitizado.
- Testes analisados em `test/ollama.test.js`: cobrem payload conservador, saneamento de erro upstream, formatos inválidos, streaming sem corpo, linha JSONL final sem newline, limite de linha e liberação do reader.
- `PROJECT_MEMORY.md` analisado parcialmente: contém histórico incremental do projeto e pendências recorrentes de validar `npm test` localmente/CI.
- Issues abertas: busca no repositório não retornou issues abertas relevantes.
- Commits recentes consultados por busca: histórico indica evoluções recentes em cache e segurança de streaming.
- Registros do Claude Agent: não encontrei arquivos ou instruções conflitantes do Claude Agent nos arquivos/buscas analisados nesta execução.

## Decisão tomada

Executar uma melhoria pequena, segura e reversível no backend de streaming: tratar stream do Ollama encerrado sem marcador `done:true` como falha upstream segura `502`, em vez de permitir sucesso parcial. Isso evita que clientes e cache tratem geração incompleta como finalizada em PCs lentos, queda do runtime local ou interrupção do stream.

## Arquivos alterados/criados

- `src/ollama.js`
  - `readOllamaStream()` agora lança `createSafeUpstreamError('Streaming do Ollama terminou sem confirmação de conclusão.')` quando o stream termina sem evento final `done:true`.
  - Mantida liberação do reader com `releaseLock()` no `finally`.
  - Mantido limite de linha segura e tratamento de erro upstream sem exposição de detalhes internos.

- `test/ollama-stream-incomplete.test.js`
  - Novo teste offline com `ReadableStream` nativo.
  - Verifica que stream parcial com `done:false` e encerramento físico é rejeitado com `statusCode=502`, `exposeDetail=false` e sem `upstreamErrorDetail`.
  - Não chama Ollama, não executa código de usuário e não adiciona dependências.

- `PROJECT_MEMORY_RUN_2026-07-01_0936.md`
  - Registro desta execução.

## Validações executadas

- Revisão estática da alteração em `src/ollama.js`.
- Revisão estática do teste novo, usando apenas `node:test`, `assert` e `ReadableStream` nativos do Node.js 20+.
- Conferido que a mudança permanece sem dependências externas e não executa código gerado pelo usuário.
- Não foi possível executar `npm test` neste ambiente por ausência de checkout local autorizado; validar via GitHub Actions ou localmente com Node.js 20+.

## Riscos

- Clientes SSE podem receber tokens parciais antes do evento `error` quando o stream cair sem `done:true`. Isso é esperado para streaming, mas agora fica explícito como falha e não como conclusão.
- Caso algum runtime compatível com Ollama encerre stream sem `done:true`, a integração passará a falhar de forma segura. O contrato esperado do Ollama JSONL inclui conclusão explícita.

## Pendências

1. Executar `npm test` em ambiente local ou CI para confirmar toda a suíte.
2. Considerar teste HTTP/SSE de ponta a ponta para stream incompleto, mantendo mock local e sem Ollama real.
3. Continuar melhorias pequenas em observabilidade e documentação de streaming para frontend/cliente local.

## Próximos passos sugeridos

Na próxima execução segura, priorizar teste HTTP/SSE do contrato de erro em streaming ou documentação curta para clientes tratarem evento `error` após tokens parciais, sem adicionar dependências pesadas.
