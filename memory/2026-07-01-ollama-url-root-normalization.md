# Execução - Normalização da raiz do OLLAMA_URL

## Data/hora

2026-07-01 19:37 - America/Sao_Paulo

## Avaliação inicial do repositório

- Repositório analisado antes de qualquer alteração: `PheidiasSoftware/TESTE`.
- Arquivos conferidos: `README.md`, `package.json`, `PROJECT_MEMORY.md`, `memory.md`, `src/config.js`, `src/server.js`, `src/http.js`, `src/ollama.js`, `test/config.test.js`, `test/server.test.js`, `test/http.test.js` e `docs/ollama-url-contract.md`.
- `README.md` confirma backend Node.js nativo, sem dependências externas, com Ollama local, scripts Windows, fila, cache, streaming SSE, leitura segura de arquivos, rate limit, smoke tests e documentação técnica.
- `package.json` mantém `node --test` e scripts Windows, sem dependências pesadas.
- `src/config.js` já restringia `OLLAMA_URL` a loopback local e removia credenciais, query e hash, mas ainda preservava caminhos arbitrários diferentes de `/api` e `/api/generate`.
- `src/ollama.js` monta internamente o endpoint final adicionando `/api/generate` ao `baseUrl`, portanto um caminho arbitrário em `OLLAMA_URL` poderia gerar URL final ambígua, por exemplo `/custom/path/api/generate`.
- PRs recentes no repositório: nenhum encontrado pelo conector.
- Não foram encontrados registros claros de Claude Agent, branches, PRs, issues ou instruções conflitantes nos arquivos consultados nesta execução.

## Decisão tomada

Executar uma melhoria pequena, segura e reversível na configuração local: normalizar qualquer caminho informado em `OLLAMA_URL` para a raiz do runtime local antes de o cliente Ollama montar `/api/generate`. Isso reduz erro operacional em Windows, evita endpoint ambíguo e mantém o MVP estritamente local.

## Arquivos alterados/criados

- `src/config.js`
  - `normalizeOllamaUrl()` agora remove sempre o `pathname`, além de remover usuário, senha, query e hash.
  - Entradas como `http://127.0.0.1:11434/api`, `http://127.0.0.1:11434/api/generate` e `http://127.0.0.1:11434/custom/proxy/path` passam a resultar em `http://127.0.0.1:11434`.

- `test/config.test.js`
  - Renomeado e ampliado o teste de paths do Ollama para validar qualquer caminho local.
  - Adicionado caso explícito para caminho arbitrário `/custom/proxy/path`.

- `docs/ollama-url-contract.md`
  - Documentado que `OLLAMA_URL` deve conter apenas a raiz do runtime.
  - Documentado que qualquer caminho local é normalizado para a raiz antes de montar `/api/generate`.
  - Adicionado checklist para evitar caminhos/endpoints prontos na variável.

- `memory/2026-07-01-ollama-url-root-normalization.md`
  - Criado este registro de execução com avaliação, decisão, alterações, validações, riscos, pendências e próximo passo.

## Validações executadas

- Revisão estática manual dos arquivos alterados.
- Conferido que a mudança não adiciona dependências externas.
- Conferido que a mudança não altera rotas HTTP, payloads públicos, streaming, fila, cache ou leitura segura de arquivos.
- Conferido que os testes adicionados são offline e usam apenas `node:test` e `node:assert/strict`.
- `npm test` não foi executado neste ambiente por ausência de checkout local autorizado; validação final deve ocorrer por CI ou em Windows/Node.js 20+.

## Riscos

- Usuários que configuraram `OLLAMA_URL` com caminho customizado para proxy local terão o caminho removido. Para o MVP local isso é intencional, pois o contrato seguro é apontar diretamente para a raiz do Ollama em loopback.
- A mudança mantém suporte a `localhost`, `::1` e IPv4 válido de loopback; não habilita runtime remoto.
- Ainda é necessário validar a suíte completa em checkout local/CI.

## Pendências atualizadas

1. Executar `npm test` em checkout local com Node.js 20+.
2. Testar scripts PowerShell em Windows real com Ollama instalado.
3. Continuar endurecimento incremental de contratos HTTP/SSE e configuração local.
4. Avaliar documentação de integração futura com cliente local/VS Code sem CORS amplo por padrão.

## Próximo passo sugerido

Na próxima execução segura, priorizar teste offline de `getStartupConsoleLines()` para garantir que a saída de console não exponha `PROJECT_ROOT`, `OLLAMA_URL` real ou caminhos sensíveis, mantendo a inicialização amigável para Windows.
