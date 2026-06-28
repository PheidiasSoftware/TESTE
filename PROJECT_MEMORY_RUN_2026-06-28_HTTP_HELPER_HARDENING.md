# Execução 2026-06-28 - Reforço dos helpers HTTP

## Avaliação inicial

Antes de alterar o repositório, foram examinados `README.md`, `package.json`, `src/server.js`, `src/http.js`, `src/config.js`, `docs/architecture.md`, `test/http.test.js` e `PROJECT_MEMORY.md`. Também foram consultadas issues abertas e PRs recentes pelo conector GitHub.

Estado observado:

- Backend Node.js 20+ sem dependências externas.
- Foco mantido em LLM/SLM local de programação para Windows, 8 GB de RAM e sem GPU.
- `src/server.js` ainda concentra muitas responsabilidades.
- `src/http.js` já existe, mas ainda não foi integrado no servidor.
- Não foram encontrados issues abertas nem PRs recentes relacionados a Claude Agent nesta execução.

## Decisão tomada

Antes de integrar `src/http.js` no `src/server.js`, foi feita uma melhoria menor e segura no helper de leitura JSON para manter comportamento equivalente ao helper antigo do servidor em payloads acima do limite configurado.

## Arquivos alterados

### `src/http.js`

- `readJsonBody()` passou a controlar estado finalizado para evitar múltiplas finalizações.
- Adicionada opção `destroyOnLimit`, padrão `true`.
- Quando o corpo excede `maxBodyBytes`, o helper rejeita com `statusCode=413` e encerra a request se o método existir.
- Mantida opção `destroyOnLimit: false` para testes e adaptadores específicos.

### `test/http.test.js`

- Mock de request passou a expor método de encerramento e flag de verificação.
- Teste de payload grande agora confirma o encerramento padrão.
- Adicionado teste para `destroyOnLimit: false`.

### `README.md`

- Adicionado link para `docs/architecture.md`.
- Atualizada lista de cobertura dos testes para incluir helpers HTTP de JSON, SSE e limite de payload.

## Validações executadas

- Validação estática manual.
- Conferido que não foram adicionadas dependências externas.
- Conferido que o contrato público das rotas não foi alterado.
- Não foi possível executar `npm test` diretamente pelo conector GitHub; validar localmente ou pela CI.

## Riscos

- `src/server.js` ainda usa helpers locais duplicados.
- A integração de `src/http.js` no servidor permanece pendente.
- A CI deve confirmar que os testes seguem passando.

## Próximos passos

1. Validar `npm test` localmente ou pela GitHub Actions.
2. Integrar `src/http.js` em `src/server.js` usando o limite `MAX_BODY_BYTES`.
3. Remover as funções HTTP duplicadas de `src/server.js` após integração.
4. Continuar extração incremental de cache, fila, leitura segura e cliente Ollama.
