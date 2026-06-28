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
6. Documentar integração futura com plugin/extensão VS Code.
7. Considerar CI leve com GitHub Actions usando Node.js 20 quando o repositório estiver pronto para validação automática.

### Próximo passo sugerido

Na próxima execução segura, priorizar cache simples por hash de prompt ou scripts Windows de inicialização, mantendo a regra de não adicionar dependências pesadas e de proteger PC com 8 GB RAM sem GPU.

## 2026-06-27 20:37 - Cache leve por hash de prompt

### Avaliação inicial

- Repositório analisado antes de qualquer alteração.
- Arquivos conferidos: `README.md`, `package.json`, `src/server.js`, `test/server.test.js`, `memory.md` e `PROJECT_MEMORY.md`.
- `README.md` documentava backend local com Ollama, fila, testes, endpoints e indicava cache como próximo passo.
- `package.json` continuava sem dependências externas, com `node --test`.
- `src/server.js` possuía servidor HTTP nativo, fila de geração, timeout, limite de payload, prompt técnico e rotas `/health`, `/api/status`, `/api/generate`.
- `test/server.test.js` já cobria prompt, fila e rotas HTTP locais sem chamar Ollama.
- `PROJECT_MEMORY.md` indicava como próximo passo seguro implementar cache simples por hash de prompt ou scripts Windows.
- Não foram encontrados registros claros de Claude Agent, branches, issues, PRs ou instruções conflitantes nos arquivos analisados nesta execução.

### Decisão tomada

Implementar cache em memória pequeno e reversível por hash SHA-256 do prompt final. A melhoria reduz chamadas repetidas ao Ollama, economizando CPU em PC fraco, sem adicionar dependências externas e sem persistir dados em disco.

### Arquivos alterados

- `src/server.js`
  - Adicionado `createPromptCache()` exportado para testes.
  - Adicionadas variáveis `ENABLE_PROMPT_CACHE` e `MAX_CACHE_ENTRIES`.
  - Criado cache em memória com política simples de remoção do item mais antigo quando passa do limite.
  - `POST /api/generate` agora verifica cache antes de entrar na fila e grava respostas bem-sucedidas após chamada ao Ollama.
  - Respostas de geração passaram a incluir `cached`, `cacheKey` e métricas de cache.
  - `GET /health` e `GET /api/status` passaram a retornar estado do cache.

- `test/server.test.js`
  - Importado `createPromptCache()`.
  - Criado teste de reaproveitamento por hash e limite de entradas.
  - Ajustados testes de `/health` e `/api/status` para validar métricas de cache.

- `README.md`
  - Documentadas as variáveis `ENABLE_PROMPT_CACHE` e `MAX_CACHE_ENTRIES`.
  - Explicado o comportamento de `cached: true` em `/api/generate`.
  - Atualizadas seções de proteção para PC fraco, decisões de arquitetura e próximos passos.

### Validações executadas

- Validação estática manual do fluxo de cache antes da fila.
- Conferido que o cache usa apenas módulos nativos do Node.js (`node:crypto`) e não adiciona dependências.
- Conferido que falhas do Ollama não são gravadas em cache.
- Conferido que o cache é limitado por número de entradas para evitar crescimento ilimitado de memória.
- Não foi possível executar `npm test` diretamente pelo conector GitHub; validação final deve ser feita localmente ou por CI futuro.

### Riscos

- O cache é em memória e reinicia junto com o processo, o que é intencional para manter o MVP simples.
- O cache considera o prompt final completo; pequenas diferenças em `task`, `language` ou `context` geram chaves diferentes.
- Como as respostas ficam em memória, o limite `MAX_CACHE_ENTRIES` deve permanecer baixo em PC com 8 GB RAM.
- Ainda não há CI automático para validar os testes após cada commit.

### Pendências atualizadas

1. Executar `npm test` localmente em Windows/Node.js 20+.
2. Adicionar endpoint de streaming em rota separada para respostas longas com melhor experiência.
3. Criar leitura segura de arquivos do projeto com allowlist, limite de tamanho e bloqueio de caminhos perigosos.
4. Criar scripts Windows para instalação/execução do Ollama e backend.
5. Documentar integração futura com plugin/extensão VS Code.
6. Considerar CI leve com GitHub Actions usando Node.js 20 quando o repositório estiver pronto para validação automática.

### Próximo passo sugerido

Na próxima execução segura, priorizar scripts Windows de inicialização ou leitura segura de arquivos do projeto, mantendo o backend leve, local e sem execução automática de código do usuário.

## 2026-06-27 21:36 - Script Windows de inicialização conservadora

### Avaliação inicial

- Repositório analisado antes de qualquer alteração.
- Arquivos conferidos: `README.md`, `package.json`, `src/server.js`, `test/server.test.js`, `memory.md` e `PROJECT_MEMORY.md`.
- `README.md` documentava backend local com Ollama, fila, cache, testes, endpoints e indicava scripts Windows como próximo passo.
- `package.json` continuava sem dependências externas e com scripts `start`, `dev` e `test`.
- `src/server.js` já possuía HTTP nativo, fila conservadora, cache em memória, limite de payload, timeout, rotas de saúde/status e geração via Ollama.
- `test/server.test.js` cobria prompt, fila, cache e rotas HTTP locais sem chamar Ollama.
- `memory.md` contém o histórico inicial e `PROJECT_MEMORY.md` contém o histórico complementar das últimas execuções.
- Busca textual no repositório não retornou índice útil para Claude Agent; nos arquivos lidos não havia instruções, estado ou conflitos do Claude Agent.
- Busca de issues abertas para backend/LLM/Ollama/Claude/memory não retornou resultados.
- Busca de PRs recentes no repositório não retornou resultados.

### Decisão tomada

Executar uma melhoria pequena, segura e reversível: adicionar um script PowerShell para Windows que inicializa o backend com padrões conservadores para 8 GB RAM sem GPU e verifica se o Ollama está respondendo antes do uso efetivo de `/api/generate`.

### Arquivos alterados/criados

- `scripts/start-windows.ps1`
  - Criado helper PowerShell para rodar a partir da raiz do repositório.
  - Define padrões seguros apenas quando variáveis não foram informadas: `GENERATION_CONCURRENCY=1`, `MAX_QUEUE_SIZE=4`, `ENABLE_PROMPT_CACHE=true`, `MAX_CACHE_ENTRIES=20`.
  - Exibe configuração efetiva de host, porta, Ollama, modelo, fila e cache.
  - Verifica `OLLAMA_URL/api/tags` com timeout curto e orienta `ollama pull` se o Ollama não responder.
  - Inicia `node src/server.js` sem executar código gerado pelo modelo.

- `package.json`
  - Adicionado script `start:windows` para chamar o helper PowerShell.
  - Mantido projeto sem dependências externas.

- `README.md`
  - Adicionada seção `Como rodar no Windows`.
  - Documentado uso de `npm run start:windows` e execução direta do script.
  - Atualizadas decisões de arquitetura e próximos passos.

- `PROJECT_MEMORY.md`
  - Registrada esta execução com avaliação inicial, decisão, arquivos alterados, validações, riscos e pendências.

### Validações executadas

- Validação estática manual do script PowerShell.
- Conferido que o script não instala pacotes, não baixa modelos automaticamente e não executa código de usuário.
- Conferido que as configurações conservadoras só são aplicadas quando variáveis de ambiente não existem, preservando customização do usuário.
- Conferido que `package.json` permanece sem dependências externas.
- Não foi possível executar `npm test` ou o PowerShell pelo conector GitHub; validação final deve ser feita localmente no Windows com Node.js 20+.

### Riscos

- A execução via `npm run start:windows` depende de PowerShell disponível no Windows.
- `ExecutionPolicy Bypass` é usado somente para este processo, para facilitar execução local do script do próprio repositório.
- A checagem do Ollama é apenas informativa; o backend ainda inicia mesmo se o Ollama não estiver respondendo, permitindo usar `/health` e `/api/status`.
- Ainda não há CI automático para validar os testes após cada commit.

### Pendências atualizadas

1. Executar `npm test` localmente em Windows/Node.js 20+.
2. Testar `npm run start:windows` em Windows real com Ollama instalado.
3. Adicionar endpoint de streaming em rota separada para respostas longas com melhor experiência.
4. Criar leitura segura de arquivos do projeto com allowlist, limite de tamanho e bloqueio de caminhos perigosos.
5. Documentar integração futura com plugin/extensão VS Code.
6. Considerar CI leve com GitHub Actions usando Node.js 20 quando o repositório estiver pronto para validação automática.

### Próximo passo sugerido

Na próxima execução segura, priorizar leitura segura de arquivos do projeto com allowlist e limite de tamanho, pois isso aproxima o backend de um assistente útil para programação sem permitir execução automática insegura de código.
