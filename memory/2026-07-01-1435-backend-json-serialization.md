# Execução backend - 2026-07-01 14:35 BRT

## Avaliação inicial

- Repositório `PheidiasSoftware/TESTE` analisado antes de qualquer alteração.
- Arquivos examinados: `README.md`, `package.json`, `src/server.js`, `src/http.js`, `src/config.js`, `src/ollama.js`, `test/server.test.js`, `test/http.test.js` e `PROJECT_MEMORY.md`.
- O `README.md` confirma o objetivo de backend local leve para programação em PC fraco com Windows, 8 GB RAM e sem GPU, usando Node.js 20+ e Ollama local.
- `package.json` segue sem dependências externas, com scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js` já possui API HTTP nativa, fila de geração, cache em memória, leitura segura de arquivos, endpoint SSE, plano de geração grande, rate limit e respostas públicas sanitizadas.
- `src/config.js` mantém limites conservadores de memória/CPU e redaction de campos sensíveis.
- `src/ollama.js` já valida payload, opções conservadoras e streaming JSONL do Ollama.
- `test/http.test.js` cobria headers, SSE e parsing JSON, mas `sendJson()` ainda usava `JSON.stringify()` diretamente e poderia falhar com `BigInt` ou objeto circular.
- Não foram encontrados PRs recentes no repositório pelo conector GitHub.
- Não encontrei registros conflitantes do Claude Agent nos arquivos analisados desta execução.

## Decisão tomada

Executar uma melhoria pequena, segura e reversível no backend: tornar a serialização JSON das respostas HTTP resiliente contra valores não serializáveis sem adicionar dependências externas e sem alterar os endpoints públicos.

## Arquivos alterados/criados

- `src/http.js`
  - Criado `createSafeJsonReplacer()` compartilhado para JSON e SSE.
  - Criado `stringifyJsonPayload()` exportado.
  - `sendJson()` passou a usar `stringifyJsonPayload()` em vez de `JSON.stringify()` direto.
  - `BigInt` é convertido para string.
  - `Symbol`, `Function` e `Error` recebem representação segura.
  - Referências circulares são substituídas por `[Circular]`.

- `test/http.test.js`
  - Importado `stringifyJsonPayload()`.
  - Adicionados testes para `BigInt`, `Error` e objeto circular em payload JSON.
  - Adicionado teste garantindo que `sendJson()` conclui resposta mesmo com payload circular.
  - Ajustado teste de SSE circular para validar marcador seguro `[Circular]`.

- `memory/2026-07-01-1435-backend-json-serialization.md`
  - Registrada esta execução com avaliação inicial, decisão, arquivos alterados, validações, riscos, pendências e próximos passos.

## Validações executadas

- Revisão estática dos arquivos alterados.
- Conferido que a melhoria usa somente recursos nativos do Node.js.
- Conferido que headers críticos de segurança continuam sendo aplicados por `sendJson()` e `openEventStream()`.
- Conferido que a alteração mantém o contrato de API e não chama Ollama nos testes adicionados.
- `npm test` não foi executado nesta automação porque não houve checkout local autorizado; validação final deve ocorrer pela CI ou localmente com Node.js 20+.

## Riscos

- A representação de objeto circular em SSE mudou de fallback genérico para marcador `[Circular]`; isso é mais informativo e continua seguro, mas altera uma expectativa interna de teste.
- Payloads com referências circulares agora serão serializados em vez de falhar; clientes devem tratar `[Circular]` como marcador diagnóstico.
- Sem execução local de testes nesta rodada, a confirmação final depende da CI ou de execução manual.

## Pendências

1. Executar `npm test` localmente ou aguardar checks da CI.
2. Verificar se algum cliente espera erro ao receber payload circular; improvável, pois isso é proteção interna.
3. Continuar evoluindo testes offline de rotas HTTP e contratos de segurança.
4. Em rodada futura, avaliar `Allow`/405 e mensagens de erro para manter resposta mínima sem vazar detalhes.

## Próximo passo sugerido

Na próxima execução segura, revisar contratos de erro HTTP e cobertura dos endpoints para manter segurança e previsibilidade sem aumentar consumo de memória nem dependências.
