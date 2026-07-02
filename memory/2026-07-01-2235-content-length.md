# Memória da execução - 2026-07-01 22:35

## Avaliação inicial

Repositório analisado antes de alterar. Arquivos conferidos: `README.md`, `package.json`, `PROJECT_MEMORY.md`, `memory.md`, `src/http.js`, `src/server.js`, `test/http.test.js` e `docs/api-contract.md`.

O projeto segue como backend Node.js nativo, sem dependências externas, com Ollama local, fila, cache, streaming SSE, leitura segura, rate limit, scripts Windows e foco em PC com 8 GB RAM sem GPU. Não encontrei PRs ou issues abertas acionáveis, nem instruções conflitantes nos arquivos consultados.

## Decisão tomada

Endurecer `readJsonBody()` para falhar cedo quando `Content-Length` estiver presente, mas inválido ou acima do limite configurado. A melhoria é pequena, reversível e reduz leitura desnecessária de corpo inválido.

## Arquivos alterados/criados

- `src/http.js`: validação estruturada de `Content-Length`, erro `400` para valor inválido e erro `413` antecipado para valor acima do limite.
- `test/http.test.js`: testes offline para `Content-Length` malformado e acima do limite.
- `memory/2026-07-01-2235-content-length.md`: este registro.

## Validações

Revisão estática feita. A alteração usa apenas recursos nativos do Node.js e os testes não chamam Ollama. `npm test` não foi executado nesta automação por ausência de checkout local autorizado.

## Riscos e próximos passos

Baixo risco: o HTTP nativo do Node já rejeita muitos cabeçalhos inválidos, mas o helper agora também é defensivo. Próximo passo seguro: documentar melhor erros HTTP de corpo JSON ou adicionar teste de rota real quando for possível simular isso com segurança.
