# Memória complementar do Projeto TESTE

## 2026-06-27 18:38 - Testes básicos e refatoração mínima

### Avaliação inicial

- Repositório analisado antes de qualquer alteração.
- Arquivos conferidos: `README.md`, `package.json`, `src/server.js` e `memory.md`.
- `README.md` documentava backend local leve com Ollama, endpoints `/health`, `/api/status`, `/api/generate`, fila e próximos passos.
- `package.json` já possuía script `test` com `node --test` e seguia sem dependências externas.
- `src/server.js` concentrava servidor, prompt e fila em um único arquivo, dificultando testes sem iniciar o servidor.
- `memory.md` indicava como próximo passo refatoração mínima para funções testáveis e testes básicos.
- Não foram encontrados registros claros de Claude Agent, branches, issues, PRs ou instruções conflitantes nos arquivos analisados nesta execução.

### Decisão tomada

Executar uma melhoria incremental e reversível: exportar funções puras do backend e adicionar testes unitários básicos sem dependências externas, mantendo o contrato público dos endpoints.

### Arquivos alterados/criados

- `src/server.js`
  - Exportada `createGenerationQueue()` para testar a fila em isolamento.
  - Exportada `buildCodingPrompt()` para testar o prompt técnico.
  - Exportado `server` para permitir testes futuros de rotas HTTP.
  - Adicionado controle de entrypoint para não iniciar o servidor quando o arquivo for importado por testes.
  - Mantidos endpoints existentes e comportamento padrão para `npm start`.

- `test/server.test.js`
  - Criado teste de montagem de prompt sem chamar Ollama.
  - Criado teste de fila cheia com erro `statusCode=429`.
  - Criado teste de concorrência 1 garantindo execução sequencial para PC fraco.

- `README.md`
  - Adicionada seção `Testes` com comando `npm test`.
  - Documentado que os testes não dependem do Ollama.
  - Atualizadas decisões de arquitetura e próximos passos.

### Validações executadas

- Validação estática manual da refatoração para garantir que `npm start` ainda inicia o servidor.
- Conferido que os testes importam apenas funções exportadas e não chamam Ollama.
- Conferido que o projeto permanece sem dependências externas.
- Não foi possível executar `npm test` pelo conector GitHub; validação final deve ser feita localmente com Node.js 20+.

### Riscos

- O controle de entrypoint usa `fileURLToPath(import.meta.url) === process.argv[1]`; em execução normal via `node src/server.js`, o servidor deve iniciar corretamente.
- Os testes ainda não cobrem rotas HTTP reais.
- A fila continua em memória, adequada para MVP local.

### Pendências atualizadas

1. Executar `npm test` localmente em Windows/Node.js 20+.
2. Expandir testes para rotas HTTP locais sem depender do Ollama.
3. Adicionar endpoint de streaming em rota separada.
4. Implementar cache simples por hash de prompt.
5. Criar leitura segura de arquivos do projeto com limites e allowlist.
6. Criar scripts Windows para instalação/execução.
7. Documentar integração futura com plugin/extensão VS Code.

### Próximo passo sugerido

Na próxima execução segura, priorizar testes de rotas HTTP locais sem Ollama ou criar scripts Windows de inicialização, mantendo o projeto leve e sem dependências externas.
