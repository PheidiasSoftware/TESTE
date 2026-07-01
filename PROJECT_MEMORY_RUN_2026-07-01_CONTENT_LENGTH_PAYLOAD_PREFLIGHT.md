# PROJECT MEMORY RUN - 2026-07-01 - CONTENT LENGTH PAYLOAD PREFLIGHT

## Análise inicial

Repositório examinado como backend Node.js local para LLM/SLM em PC fraco com Windows, 8 GB de RAM e sem GPU.

Arquivos e áreas consultadas antes da alteração:

- `README.md`: confirma objetivo do backend leve, comandos Windows, testes offline, endpoints, guias técnicos e variáveis conservadoras.
- `package.json`: confirma Node.js 20+, scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`, sem dependências pesadas.
- `.github/workflows/node-test.yml`: CI leve com Node.js 20, `npm test`, sem Ollama/modelo externo.
- `scripts/start-windows.ps1`: helper Windows com padrões conservadores e checagem de Ollama.
- `scripts/test-windows.ps1`: helper de teste offline sem iniciar Ollama nem executar código gerado.
- `docs/backend-mvp-status.md`: histórico mostra MVP funcional, mas validação final ainda depende de `npm test` local/CI verde após alterações recentes.
- `src/server.js`: rotas de geração, streaming, leitura segura, fila, cache, rate limit, status público sanitizado e planejamento grande.
- `src/config.js`: parsing conservador de ambiente, host local, `OLLAMA_URL`, limites numéricos e allowlist de arquivos.
- `src/ollama.js`: cliente Ollama com payload conservador, erro upstream seguro e limite de linha JSONL em streaming.
- `src/http.js`: helpers HTTP centralizados para JSON, SSE, headers de segurança e leitura de corpo JSON.
- `test/http.test.js` e `test/ollama.test.js`: cobertura offline relevante para HTTP/SSE/Ollama sem chamar modelo.
- Issues e PRs: consulta pelo conector não retornou issues abertas nem PRs recentes.
- Commits recentes: encontrados commits focados em endurecimento de Ollama/streaming e documentação operacional.
- Registros Claude Agent: busca textual disponível não retornou registro claro de Claude Agent.

## Decisão

Escolhida uma melhoria pequena, segura, reversível e objetiva no backend HTTP:

- rejeitar payload JSON pelo header `Content-Length` quando o tamanho declarado excede `MAX_BODY_BYTES`, antes de acumular chunks em memória.

Motivo:

- melhora segurança e previsibilidade em PC fraco;
- reduz trabalho desnecessário em requisições claramente grandes demais;
- mantém a validação existente por tamanho real do corpo quando `Content-Length` está ausente ou inválido;
- não adiciona dependências;
- não executa código do usuário;
- não muda contrato de sucesso das rotas.

## Arquivos alterados

- `src/http.js`
  - Criado helper interno `createPayloadTooLargeError()` para reutilizar erro 413.
  - Criado helper interno `parseContentLengthHeader()` para aceitar apenas inteiros decimais seguros.
  - `readJsonBody()` agora verifica `request.headers?.['content-length']` antes de registrar leitura de dados.
  - Se o tamanho declarado for maior que `maxBodyBytes`, retorna erro 413 e chama `request.destroy()` quando `destroyOnLimit=true`.
  - `Content-Length` inválido é ignorado e a proteção por tamanho real do corpo continua ativa.

- `test/http.test.js`
  - `createMockRequest()` passou a aceitar `headers` para simular requisições reais.
  - `createAbortedMockRequest()` agora também fornece `headers` vazio.
  - Adicionado teste para rejeição antecipada por `Content-Length` grande.
  - Adicionado teste para ignorar `Content-Length` inválido e validar pelo corpo real.

## Validações

- Revisão estática feita sobre a alteração.
- Não foram adicionadas dependências.
- A alteração é coberta por testes offline no `node:test`.
- `npm test` não foi executado neste ambiente porque não há checkout local disponível nesta execução via conector.
- Status/checks do commit final consultados pelo conector: sem checks registrados no momento da verificação.

## Riscos

- Baixo risco: a mudança só antecipa erro 413 para cliente que declara tamanho maior que o limite aceito.
- Clientes que enviam `Content-Length` inválido continuam tratados pelo limite real de bytes acumulados, mantendo compatibilidade.
- Caso algum proxy informe `Content-Length` incorreto maior que o corpo real, a API rejeitará com 413; isso é aceitável para uma API local conservadora.

## Status MVP backend

Critérios já atendidos por implementação/documentação observada:

- Node.js 20+ sem dependências pesadas.
- API HTTP local com health/status, geração, streaming, leitura segura e planejamento grande.
- Fila, cache e rate limit conservadores.
- Integração Ollama local com modelo pequeno sugerido.
- Streaming SSE protegido.
- Leitura segura de arquivos com allowlist e limites.
- Helpers Windows para start/test offline.
- CI leve configurada para `npm test` sem Ollama.

Ainda depende de validação externa/decisão:

- Confirmar `npm test`, `npm run test:windows` ou CI verde após este commit.
- Decisão do usuário/frontend sobre interface final, UX e consumo dos endpoints.
- Decisão operacional sobre modelo padrão final conforme desempenho real em Windows 8 GB sem GPU.

## Próximos passos sugeridos

1. Rodar `npm test` ou `npm run test:windows` em checkout local.
2. Se CI/checks aparecerem no GitHub, confirmar resultado do commit final.
3. Próxima melhoria pequena possível: documentar explicitamente no contrato HTTP que payload acima de `MAX_BODY_BYTES` pode ser rejeitado por tamanho declarado ou medido.
