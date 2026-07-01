# 2026-07-01 17:34 - Bloqueio de OLLAMA_URL remoto no MVP

## Avaliação inicial

- Repositório analisado antes de qualquer alteração.
- Arquivos conferidos: `README.md`, `package.json`, `src/server.js`, `src/config.js`, `src/http.js`, `src/ollama.js`, `test/server.test.js`, `test/config.test.js`, `docs/ollama-url-contract.md`, `docs/local-ollama-security.md`, `memory.md` e `PROJECT_MEMORY.md`.
- O backend já possuía fila, cache, rate limit, leitura segura de arquivos, streaming SSE, planejamento de geração grande e headers de segurança.
- `HOST` já era limitado a loopback, mas `normalizeOllamaUrl()` ainda aceitava host remoto.
- A documentação de segurança já recomendava uso local do Ollama para reduzir risco de vazamento de prompts e contexto de código.
- Buscas por issues, PRs e commits relacionados a Claude Agent, backend, Ollama, memory, LLM e SLM não retornaram registros acionáveis nesta execução.

## Decisão tomada

Aplicar uma melhoria pequena e reversível: fazer `OLLAMA_URL` aceitar somente hosts de loopback por padrão no MVP, alinhando comportamento real e documentação de segurança.

## Arquivos alterados/criados

- `src/config.js`
  - Criada função `isAllowedLocalOllamaHost()`.
  - `normalizeOllamaUrl()` agora rejeita hosts fora de `localhost`, `127.x.x.x` e `::1`, retornando ao padrão seguro `http://127.0.0.1:11434`.
  - Mantida a limpeza de credenciais, query string, hash e caminhos comuns da API do Ollama.

- `test/config.test.js`
  - Adicionados testes para hosts locais aceitos e hosts remotos rejeitados.
  - Atualizados testes de normalização de `OLLAMA_URL` para cobrir IP de rede e domínio externo.

- `docs/ollama-url-contract.md`
  - Documentado contrato local-only do MVP.
  - Incluídos exemplos aceitos e rejeitados.

- `docs/local-ollama-security.md`
  - Documentado que o backend bloqueia `OLLAMA_URL` remoto por padrão.

- `memory/2026-07-01-ollama-url-local-only.md`
  - Criada memória desta execução.

## Validações executadas

- Revisão estática manual das alterações.
- Conferido que não foram adicionadas dependências externas.
- Conferido que a alteração não executa código de usuário e apenas endurece normalização de configuração.
- `npm test` não foi executado aqui por ausência de checkout local nesta execução.

## Riscos

- Quem apontava `OLLAMA_URL` para outro computador da rede passará a usar o padrão local. Isso é intencional para o MVP seguro.
- Suporte a Ollama remoto deve ser decisão explícita futura, com autenticação externa, rede confiável e revisão de privacidade.

## Próximos passos

1. Executar `npm test` em checkout local com Node.js 20+.
2. Testar `npm run start:windows` em Windows real com Ollama instalado.
3. Avaliar no futuro se deve existir uma flag explícita para Ollama remoto, mantendo padrão local-only.
4. Continuar expandindo testes offline de segurança e contratos de API.
