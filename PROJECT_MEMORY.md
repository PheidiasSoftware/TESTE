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
2. Expandir testes para rotas HTTP locais sem Ollama.
3. Adicionar endpoint de streaming em rota separada.
4. Implementar cache simples por hash de prompt.
5. Criar leitura segura de arquivos do projeto com limites e allowlist.
6. Criar scripts Windows para instalação/execução.
7. Documentar integração futura com plugin/extensão VS Code.

### Próximo passo sugerido

Na próxima execução segura, priorizar testes de rotas HTTP locais sem Ollama ou criar scripts Windows de inicialização, mantendo o projeto leve e sem dependências externas.

## 2026-06-27 19:35 - Testes HTTP locais sem Ollama

### Avaliação inicial

- Repositório analisado antes de qualquer alteração.
- Arquivos conferidos: `README.md`, `package.json`, `src/server.js`, `test/server.test.js`, `memory.md` e `PROJECT_MEMORY.md`.
- `README.md` já documentava backend leve com Ollama, fila, endpoints, testes básicos e próximos passos.
- `package.json` continuava sem dependências externas e com `npm test` usando `node --test`.
- `src/server.js` já exportava `server`, `buildCodingPrompt()` e `createGenerationQueue()`, permitindo testar sem iniciar o servidor por importação.
- `test/server.test.js` cobria prompt e fila, mas ainda não cobria rotas HTTP reais.
- `memory.md` e `PROJECT_MEMORY.md` indicavam como próximo passo expandir testes para rotas locais sem depender do Ollama.
- Busca no repositório não retornou resultados indexados para Claude Agent ou arquivos semelhantes; também não foram encontrados PRs recentes no repositório pelo conector.

### Decisão tomada

Executar uma melhoria pequena, segura e reversível: adicionar testes de rotas HTTP locais usando o servidor exportado e porta dinâmica, sem chamar Ollama e sem adicionar dependências externas.

### Arquivos alterados

- `test/server.test.js`
  - Importado `server` do backend.
  - Criado helper `withTestServer()` para iniciar o servidor em `127.0.0.1` com porta dinâmica e fechar ao final do teste.
  - Adicionado teste para `GET /health`.
  - Adicionado teste para `GET /api/status`.
  - Adicionado teste para `POST /api/generate` com `task` ausente, validando erro `400` antes de chamar Ollama.
  - Adicionado teste para rota desconhecida com resposta `404` e lista de rotas disponíveis.

- `README.md`
  - Atualizada seção de testes para explicar que agora há cobertura de rotas HTTP locais.
  - Atualizadas decisões de arquitetura.
  - Atualizados próximos passos para remover a pendência de testes HTTP básicos.

- `PROJECT_MEMORY.md`
  - Registrada esta execução com avaliação inicial, decisão, arquivos alterados, validações, riscos, pendências e próximo passo.

### Validações executadas

- Validação estática manual dos testes adicionados.
- Conferido que os novos testes usam somente recursos nativos do Node.js 20+: `node:test`, `assert`, `fetch` global e servidor HTTP exportado.
- Conferido que os testes novos não chamam `/api/generate` com `task` válido, evitando chamada ao Ollama.
- Conferido que a alteração não adiciona dependências externas.
- Não foi possível executar `npm test` diretamente pelo conector GitHub; validação final deve ser feita localmente ou por CI futuro.

### Riscos

- Os testes iniciam o servidor exportado em porta dinâmica e fecham após cada teste. Em ambiente de teste muito paralelo, pode ser necessário tornar os testes HTTP sequenciais explicitamente ou criar fábrica de servidor no futuro.
- Ainda não há CI configurado para validar `npm test` automaticamente.
- O backend ainda não possui streaming, cache ou leitura segura de arquivos do projeto.

### Pendências atualizadas

1. Executar `npm test` localmente em Windows/Node.js 20+.
2. Adicionar endpoint de streaming em rota separada para respostas longas com melhor experiência.
3. Implementar cache simples por hash de prompt para economizar CPU em perguntas repetidas.
4. Criar leitura segura de arquivos do projeto com allowlist, limite de tamanho e bloqueio de caminhos perigosos.
5. Criar scripts Windows para instalação/execução do Ollama e backend.

## 2026-07-01 20:37 - Endurecimento de OLLAMA_URL contra hosts ambíguos

### Avaliação inicial

- Repositório analisado antes de qualquer alteração.
- Arquivos conferidos: `README.md`, `package.json`, `PROJECT_MEMORY.md`, `memory.md`, `src/config.js`, `src/http.js`, `test/config.test.js` e `docs/ollama-url-contract.md`.
- `README.md` indica backend Node.js 20+ sem dependências externas, adequado para Windows, 8 GB RAM e sem GPU, com Ollama local, fila, cache, leitura segura, rate limit, streaming, smoke tests e documentação técnica.
- `package.json` segue sem dependências externas e usa `node --test`.
- `src/config.js` já normalizava `OLLAMA_URL` para loopback local, removendo credenciais, query, hash e path.
- `test/config.test.js` já cobria defaults conservadores, limites numéricos, host local, modelo, logs, flags booleanas e normalização de `OLLAMA_URL`.
- `docs/ollama-url-contract.md` documentava a política de aceitar apenas loopback local e raiz do runtime.
- Busca de PRs recentes retornou lista vazia; não havia PR ativo a considerar nesta execução.
- Não foram encontrados registros acionáveis de Claude Agent ou instruções conflitantes nos arquivos lidos nesta execução.

### Decisão tomada

Executar melhoria pequena, segura e reversível no contrato de `OLLAMA_URL`: validar também o host bruto informado pelo usuário antes do `new URL()` normalizar formatos IPv4 ambíguos. Isso evita aceitar indiretamente aliases como `127.1`, inteiro IPv4, hexadecimal ou octal, preservando o comportamento seguro de fallback para `http://127.0.0.1:11434`.

### Arquivos alterados

- `src/config.js`
  - Criado helper interno `getRawUrlHost()` para extrair o host textual original da URL antes da normalização do parser.
  - `normalizeOllamaUrl()` agora exige que o host bruto e o hostname já parseado sejam loopback permitido.
  - Mantido suporte a `localhost`, IPv4 completo em `127.0.0.0/8` e IPv6 loopback `::1`.

- `test/config.test.js`
  - Adicionado teste offline para rejeitar `http://127.1:11434`, `http://2130706433:11434`, `http://0x7f000001:11434` e `http://0177.0.0.1:11434`.
  - Teste não chama Ollama e não exige GPU/modelo.

- `docs/ollama-url-contract.md`
  - Documentado que IPv4 aceito deve estar em formato decimal completo com quatro octetos.
  - Adicionados exemplos de formatos ambíguos a evitar.
  - Checklist atualizado para preferir `127.0.0.1` e evitar IPv4 abreviado, inteiro, hexadecimal ou octal.

- `PROJECT_MEMORY.md`
  - Registrada esta execução.

### Validações executadas

- Revisão estática manual das alterações.
- Conferido que a alteração usa apenas JavaScript nativo e não adiciona dependências.
- Conferido que a alteração não executa código de usuário e não altera endpoints públicos.
- Conferido que o fallback seguro continua sendo `http://127.0.0.1:11434`.
- `npm test` não foi executado neste ambiente porque a execução foi feita pelo conector GitHub, sem checkout local.

### Riscos

- Ambientes que configuravam `OLLAMA_URL` com aliases ambíguos como `127.1` agora cairão para `127.0.0.1`, intencionalmente mais seguro para o MVP.
- O helper de host bruto é simples e voltado para URLs HTTP/HTTPS normais; entradas fora desse padrão já caem no fallback seguro.

### Pendências atualizadas

1. Executar `npm test` localmente ou pela CI em Node.js 20+.
2. Testar `npm run smoke:windows` em Windows real com Ollama instalado.
3. Continuar melhorando testes de segurança e documentação sem adicionar dependências pesadas.
4. Em uma execução futura, revisar se o MVP backend já atende aos critérios mínimos e registrar status final em `docs/backend-mvp-status.md`.

### Próximo passo sugerido

Na próxima execução segura, priorizar uma revisão de prontidão do MVP ou um teste offline pequeno que ainda reduza risco de configuração, mantendo o backend leve e compatível com PC fraco.

## 2026-07-01 21:36 - Limite defensivo para nomes de eventos SSE

### Avaliação inicial

- Repositório analisado antes de qualquer alteração.
- Arquivos conferidos: `README.md`, `package.json`, `PROJECT_MEMORY.md`, `docs/backend-mvp-status.md`, `docs/streaming.md`, `src/http.js`, `test/http.test.js` e `test/config.test.js`.
- `README.md` documenta backend Node.js 20+ sem dependências externas, com Ollama local, fila conservadora, cache, leitura segura, rate limit, streaming SSE, scripts Windows e testes offline.
- `package.json` continua sem dependências externas e usa `node --test`.
- `src/http.js` já possuía normalização de nomes de eventos SSE contra caracteres de controle e injeção de linhas, mas não limitava comprimento máximo do nome.
- `test/http.test.js` já cobria headers de segurança, serialização segura, SSE, UTF-8, payload grande, JSON inválido e cliente abortado.
- PRs recentes e issues abertas foram consultados e não retornaram resultados.
- Não foram encontrados registros acionáveis de Claude Agent ou instruções conflitantes nos arquivos lidos nesta execução.

### Decisão tomada

Executar melhoria pequena, segura e reversível no helper HTTP/SSE: limitar nomes de eventos SSE a 64 caracteres após sanitização. Isso mantém a saída do stream previsível, reduz risco de eventos anômalos e não altera os eventos reais usados pela API (`metadata`, `token`, `done`, `error`).

### Arquivos alterados

- `src/http.js`
  - Adicionada constante `MAX_SERVER_EVENT_NAME_LENGTH = 64`.
  - `sanitizeServerEventName()` agora corta nomes de eventos sanitizados para 64 caracteres.

- `test/http.test.js`
  - Adicionados testes offline para validar limite em `normalizeServerEventName()`.
  - Adicionado teste offline para validar que `sendServerEvent()` escreve o nome já limitado no stream.

- `docs/streaming.md`
  - Documentado que nomes SSE são normalizados e limitados a 64 caracteres.

- `PROJECT_MEMORY.md`
  - Registrada esta execução.

### Validações executadas

- Revisão estática manual das alterações.
- Conferido que a alteração usa apenas JavaScript nativo e não adiciona dependências.
- Conferido que os eventos reais da API são curtos e não são afetados pelo limite.
- Conferido que os novos testes não chamam Ollama, não baixam modelos e não exigem GPU.
- `npm test` não foi executado neste ambiente porque a execução foi feita pelo conector GitHub, sem checkout local.

### Riscos

- Clientes que dependessem de nomes SSE customizados acima de 64 caracteres receberiam nomes truncados. O backend do MVP usa apenas nomes fixos curtos, então o risco prático é baixo.
- Como não houve checkout local, a validação final ainda depende de `npm test`, `npm run test:windows` ou CI verde.

### Pendências atualizadas

1. Executar `npm test` localmente ou pela CI em Node.js 20+.
2. Testar `npm run smoke:windows` em Windows real com Ollama instalado.
3. Evitar funcionalidades grandes até haver evidência objetiva de testes passando no commit mais recente.
4. Revisar e registrar critérios finais do MVP backend quando houver validação objetiva dos testes.

### Próximo passo sugerido

Na próxima execução segura, priorizar confirmação de checks/CI ou revisão final de prontidão do MVP, sem adicionar dependências pesadas nem refatorações grandes.
