# Execucao - Ollama helpers

## Data/hora

2026-06-28 11:36 America/Sao_Paulo

## Avaliacao inicial

Arquivos examinados antes da alteracao:

- `README.md`
- `package.json`
- `src/server.js`
- `src/http.js`
- `src/config.js`
- `scripts/start-windows.ps1`
- `memory.md`
- `PROJECT_MEMORY.md`

Estado observado:

- Backend em Node.js nativo, sem dependencias externas.
- API local ja possui Ollama, fila, cache, streaming SSE, leitura segura de arquivos, rate limit, logs estruturados, script Windows, CI leve e documentacao tecnica.
- `src/http.js` existe e esta testado, mas ainda nao foi integrado em `src/server.js`.
- `src/server.js` ainda concentra montagem de payload Ollama e parser de streaming.
- O conector nao retornou PRs recentes.
- Nao foram encontrados arquivos de estado ou instrucoes conflitantes de outro agente nesta execucao.

## Decisao tomada

A proxima tarefa segura foi isolar parte da integracao Ollama em modulo pequeno e testavel, sem alterar o contrato publico da API e sem reescrever `src/server.js`.

## Arquivos criados

- `src/ollama.js`
  - `buildOllamaGeneratePayload()` para montar payload conservador.
  - `sanitizeOllamaOptions()` para limitar `num_ctx`, `num_predict` e `temperature`.
  - `parseOllamaStreamLine()` para interpretar linhas JSONL do streaming.

- `test/ollama.test.js`
  - Testa payload conservador.
  - Testa limite das opcoes.
  - Testa rejeicao de modelo ou prompt ausente.
  - Testa parser de linhas JSONL.

## Validacoes executadas

- Validacao estatica manual dos arquivos criados.
- Conferido que nao foram adicionadas dependencias externas.
- Conferido que os testes nao chamam Ollama nem baixam modelos.
- Conferido que o servidor ainda nao importa o novo modulo, mantendo o contrato HTTP atual.
- Nao foi possivel executar `npm test` pelo conector GitHub.

## Riscos

- Existe duplicacao temporaria: `src/server.js` ainda contem logica equivalente.
- A integracao futura deve preservar streaming, cache, fila, timeout e logs.
- Os limites do modulo sao conservadores; futuramente podem virar configuracao de ambiente.

## Pendencias

1. Verificar `npm test` por CI ou localmente com Node.js 20+.
2. Integrar `src/ollama.js` em `src/server.js`.
3. Integrar `src/http.js` em `src/server.js`.
4. Continuar separando `src/server.js` em modulos menores.
5. Revisar criterios de MVP backend completo apos a modularizacao.
