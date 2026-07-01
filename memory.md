# Memória do Projeto TESTE

## 2026-06-27 16:36 - Avaliação inicial e bootstrap backend

### Avaliação geral inicial

- Repositório analisado: `PheidiasSoftware/TESTE`.
- Branch padrão: `main`.
- Estado observado: repositório público, praticamente vazio, com apenas `hello.txt` encontrado via leitura direta.
- Busca por arquivos estruturais não encontrou `README.md`, `package.json`, `pyproject.toml`, `requirements.txt`, diretórios de backend, scripts, documentação, `memory.md`, `PROJECT_MEMORY.md`, arquivos de Docker ou registros de Claude Agent.
- Busca por issues/PRs abertas relacionadas a backend, LLM, Claude, memory ou Ollama não retornou resultados.
- Risco principal: não havia arquitetura existente para preservar; portanto a primeira tarefa segura foi criar uma base mínima e reversível de backend.

### Objetivo desta execução

Criar um MVP inicial de backend local leve para geração de respostas de programação usando Ollama, adequado para PC com 8 GB de RAM e sem GPU.

### Arquivos analisados

- Metadados do repositório via GitHub.
- `hello.txt`.
- Busca por `README`, `package.json`, `pyproject`, `requirements`, `memory`, `PROJECT_MEMORY`, `backend`, `server`, `ollama`, `claude`.
- Issues e PRs abertas relacionadas ao escopo.

### Arquivos criados/alterados

- Criado `package.json` com projeto Node.js sem dependências externas.
- Criado `src/server.js` com servidor HTTP nativo, rota `GET /health` e rota `POST /api/generate`.
- Criado `README.md` com objetivo, requisitos, variáveis de ambiente, endpoints e próximos passos.
- Criado `memory.md` com registro desta execução.

### Decisões tomadas

- Usar Node.js nativo no MVP, sem Express/Fastify, para reduzir consumo de memória e dependências.
- Usar Ollama como runtime local inicial por simplicidade operacional.
- Definir modelo padrão `qwen2.5-coder:1.5b-instruct`, pequeno e mais adequado para CPU/8 GB RAM do que modelos maiores.
- Limitar payload com `MAX_BODY_BYTES` e timeout com `REQUEST_TIMEOUT_MS`.
- Fixar `HOST=127.0.0.1` por padrão para evitar exposição de rede acidental.
- Não implementar execução automática de código gerado.

### Validações executadas

- Validação estática manual do fluxo do servidor e dos endpoints.
- Não foi possível executar testes locais pelo conector GitHub nesta execução.

### Riscos

- O modelo configurado precisa estar instalado no Ollama antes de usar `/api/generate`.
- Geração em CPU pode ser lenta em PC fraco.
- Ainda não existe fila para impedir múltiplas gerações simultâneas.
- Ainda não há testes automatizados.

### Pendências

1. Adicionar testes básicos com `node --test`.
2. Criar fila simples de geração para CPU fraca.
3. Adicionar endpoint de streaming opcional.
4. Implementar cache simples por hash de prompt.
5. Criar leitura segura de arquivos do projeto com limites e allowlist.
6. Criar scripts Windows para instalação/execução.
7. Documentar integração futura com plugin/extensão VS Code.

### Próximos passos sugeridos

Na próxima execução segura, priorizar testes básicos e uma fila simples de concorrência 1 para proteger PCs sem GPU.

## 2026-06-27 17:36 - Fila de geração para CPU fraca

### Avaliação inicial desta execução

- Repositório analisado novamente antes de qualquer alteração.
- Arquivos conferidos: `README.md`, `package.json`, `src/server.js` e `memory.md`.
- `README.md` indicava backend local leve com Ollama e próximos passos, incluindo fila simples.
- `package.json` continuava sem dependências externas, com scripts `start`, `dev` e `test`.
- `src/server.js` já tinha servidor HTTP nativo, `/health`, `/api/generate`, limite de payload e timeout.
- `memory.md` apontava como próximo passo prioritário a fila de concorrência 1 para proteger PC sem GPU.
- Busca no repositório não encontrou registros claros de Claude Agent, PRs ou instruções conflitantes nesta execução.

### Decisão tomada

Implementar uma melhoria pequena e segura no backend: fila simples de geração com concorrência padrão 1 e limite pequeno de espera, mantendo o projeto sem dependências externas.

### Arquivos alterados

- `src/server.js`
  - Adicionadas variáveis `MAX_QUEUE_SIZE` e `GENERATION_CONCURRENCY`.
  - Criada fila em memória para chamadas ao Ollama.
  - Adicionado bloqueio por fila cheia com erro HTTP `429`.
  - Adicionadas métricas simples: gerações ativas, pendentes, concluídas e com falha.
  - `GET /health` passou a retornar estado da fila.
  - Criado endpoint `GET /api/status`.
  - `POST /api/generate` passou a usar a fila antes de chamar o modelo.

- `README.md`
  - Documentadas as novas variáveis de fila.
  - Documentado `GET /api/status`.
  - Adicionada seção de proteção para PC fraco.
  - Atualizados próximos passos, removendo a fila da lista pendente.

- `memory.md`
  - Registrada esta execução, avaliação, decisão, alterações, validações, riscos e próximos passos.

### Validações executadas

- Validação estática manual do fluxo da fila.
- Conferido que a alteração mantém Node.js nativo sem dependências externas.
- Conferido que o padrão continua conservador para PC com 8 GB RAM e sem GPU: `GENERATION_CONCURRENCY=1`.
- Não foi possível executar `npm test` ou iniciar o servidor pelo conector GitHub nesta execução.

### Riscos e observações

- A fila é em memória e reinicia junto com o processo, o que é aceitável para MVP local.
- Requisições HTTP ficam aguardando enquanto estão na fila; isso é simples e adequado para uso local, mas no futuro pode ser substituído por jobs assíncronos.
- O cálculo de `queueWaitMs` é aproximado porque depende do tempo reportado pelo Ollama quando disponível.
- Ainda não há testes automatizados para validar a fila.

### Pendências atualizadas

1. Adicionar testes básicos com `node --test`.
2. Adicionar endpoint de streaming opcional.
3. Implementar cache simples por hash de prompt.
4. Criar leitura segura de arquivos do projeto com limites e allowlist.
5. Criar scripts Windows para instalação/execução.
6. Documentar integração futura com plugin/extensão VS Code.
7. Separar servidor e funções puras em módulos menores para facilitar testes.

### Próximos passos sugeridos

Na próxima execução segura, priorizar refatoração mínima para tornar funções testáveis e adicionar testes básicos com `node --test`, sem dependências externas.

## 2026-06-27 22:37 - Leitura segura de arquivos do projeto

### Avaliação inicial desta execução

- Repositório analisado antes de qualquer alteração.
- Arquivos conferidos: `README.md`, `package.json`, `src/server.js`, `test/server.test.js`, `scripts/start-windows.ps1`, `memory.md` e `PROJECT_MEMORY.md`.
- `README.md` documentava backend local com Ollama, fila, cache, testes, script Windows, endpoints existentes e indicava leitura segura de arquivos como próximo passo.
- `package.json` continuava sem dependências externas, com Node.js 20+ e scripts `start`, `start:windows`, `dev` e `test`.
- `src/server.js` possuía HTTP nativo, geração via Ollama, fila, cache, timeout, limite de payload e rotas `/health`, `/api/status`, `/api/generate`.
- `test/server.test.js` cobria prompt, fila, cache e rotas HTTP locais sem chamar Ollama.
- `scripts/start-windows.ps1` continha inicialização conservadora para Windows, sem instalar pacotes nem baixar modelos automaticamente.
- `PROJECT_MEMORY.md` indicava como próximo passo seguro criar leitura segura de arquivos com allowlist e limite de tamanho.
- Não foram encontrados registros claros de Claude Agent, instruções conflitantes, branches, issues ou PRs relevantes nos arquivos analisados ou na busca textual disponível.

### Decisão tomada

Implementar leitura segura e limitada de arquivos textuais do próprio projeto, para permitir que a API monte contexto de programação sem executar código, sem acessar caminhos fora da raiz e sem expor arquivos sensíveis como `.env`.

### Arquivos alterados

- `src/server.js`
  - Adicionados módulos nativos `node:fs/promises` e `node:path`.
  - Adicionadas variáveis `PROJECT_ROOT`, `MAX_FILE_READ_BYTES` e `ALLOWED_FILE_EXTENSIONS`.
  - Criada função `validateSafeProjectFilePath()` para bloquear caminho absoluto, travessia, `.git`, `node_modules`, artefatos gerados e `.env` real.
  - Criada função `readProjectFile()` para ler apenas arquivo textual pequeno dentro da raiz permitida.
  - Criado endpoint `POST /api/read-file`.
  - `GET /health` e `GET /api/status` passaram a retornar configuração de leitura segura.
  - Lista de rotas `404` atualizada.

- `test/server.test.js`
  - Adicionados testes para validação de caminho seguro.
  - Adicionados testes para bloqueio de travessia, `node_modules` e `.env`.
  - Adicionado teste para leitura de arquivo pequeno em diretório temporário.
  - Adicionado teste para bloqueio por tamanho máximo.
  - Adicionado teste HTTP para `POST /api/read-file` com caminho inválido.
  - Ajustado teste de caminho para funcionar em Windows e Linux.

- `README.md`
  - Documentadas variáveis de leitura segura.
  - Documentado endpoint `POST /api/read-file`.
  - Documentadas proteções aplicadas e uso recomendado apenas para contexto, sem execução de código.
  - Atualizadas decisões de arquitetura e próximos passos.

- `memory.md`
  - Registrada esta execução com avaliação inicial, decisão, arquivos alterados, validações, riscos, pendências e próximo passo.

### Validações executadas

- Validação estática manual do fluxo de leitura segura.
- Conferido que a implementação usa apenas módulos nativos do Node.js e não adiciona dependências externas.
- Conferido que a rota nova não executa arquivos, apenas lê texto limitado.
- Conferido que caminhos absolutos, travessia, `node_modules`, `.git`, artefatos gerados e `.env` são bloqueados.
- Conferido que os testes não chamam o Ollama.
- Não foi possível executar `npm test` pelo conector GitHub; validação final deve ser feita localmente ou por CI futuro.

### Riscos e observações

- A leitura segura ainda retorna o conteúdo inteiro do arquivo permitido até o limite configurado. Para arquivos maiores, a API bloqueia em vez de truncar.
- `PROJECT_ROOT` usa a pasta atual por padrão; o backend deve ser iniciado a partir da raiz do repositório ou com `PROJECT_ROOT` definido explicitamente.
- A allowlist de extensões deve permanecer restrita para evitar leitura acidental de binários ou arquivos sensíveis.
- Ainda não há CI automático para rodar `npm test` após cada commit.

### Pendências atualizadas

1. Executar `npm test` localmente em Windows/Node.js 20+.
2. Testar `npm run start:windows` em Windows real com Ollama instalado.
3. Adicionar endpoint de streaming em rota separada para respostas longas com melhor experiência.
4. Integrar leitura segura de arquivo ao fluxo de geração com contexto controlado por lista de arquivos.
5. Documentar integração futura com plugin/extensão VS Code.
6. Considerar CI leve com GitHub Actions usando Node.js 20.

## 2026-07-01 18:37 - Validação estrita de loopback do Ollama

### Avaliação inicial desta execução

- Repositório analisado antes de qualquer alteração.
- Arquivos conferidos: `README.md`, `package.json`, `PROJECT_MEMORY.md`, `memory.md`, `src/config.js`, `src/server.js`, `test/server.test.js`, `test/config.test.js` e `docs/ollama-url-contract.md`.
- `README.md` confirma backend Node.js nativo, sem dependências externas, com Ollama local, scripts Windows, testes offline, fila, cache, streaming SSE, leitura segura de arquivos, rate limit e documentação técnica.
- `package.json` mantém `node --test` e scripts Windows, sem dependências pesadas.
- `src/config.js` já restringia `HOST` e `OLLAMA_URL` para uso local, mas aceitava hosts `127.x.x.x` por regex sem validar cada octeto IPv4.
- `src/server.js` expõe status público sanitizado, não mostra `PROJECT_ROOT` nem endpoint real do Ollama e usa logs estruturados com redaction.
- `test/config.test.js` cobria OLLAMA_URL remoto, credenciais, query/hash e paths comuns, mas ainda não cobria IPv4 loopback malformado.
- PRs recentes no repositório: nenhum encontrado pelo conector.
- Não foram encontrados registros claros de Claude Agent, branches, PRs, issues ou instruções conflitantes nos arquivos consultados nesta execução.

### Decisão tomada

Executar uma melhoria pequena, segura e reversível na configuração local: aceitar apenas IPv4 loopback sintaticamente válido em `127.0.0.0/8` para `OLLAMA_URL`, evitando valores ambíguos como `127.999.999.999` que parecem locais, mas falhariam ou poderiam confundir diagnóstico no Windows.

### Arquivos alterados/criados

- `src/config.js`
  - Criado helper interno `isValidLoopbackIPv4()`.
  - `isAllowedLocalOllamaHost()` passou a aceitar `127.x.x.x` somente quando todos os octetos estão entre 0 e 255 e o primeiro octeto é exatamente `127`.

- `test/ollama-url-loopback.test.js`
  - Criado teste offline para aceitar `127.0.0.1`, `127.255.255.255` e `127.1.2.3`.
  - Criado teste offline para rejeitar `127.256.0.1`, `127.999.999.999`, IPv4 incompleto, IPv4 longo e `0127.0.0.1`.
  - Validado que `normalizeOllamaUrl()` e `loadConfig()` retornam o fallback seguro quando o loopback está malformado.

- `docs/ollama-url-contract.md`
  - Documentado que só são aceitos endereços IPv4 válidos em `127.0.0.0/8`.
  - Adicionado exemplo de formato malformado que deve ser evitado.

- `memory.md`
  - Registrada esta execução com avaliação inicial, decisão, arquivos alterados, validações, riscos, pendências e próximo passo.

### Validações executadas

- Revisão estática manual dos arquivos alterados.
- Conferido que a mudança é apenas de configuração/validação e não altera rotas, payloads, streaming, chamada ao Ollama ou leitura de arquivos.
- Conferido que os novos testes são offline e usam apenas `node:test` e `node:assert/strict`.
- Conferido que nenhuma dependência externa foi adicionada.
- `npm test` não foi executado neste ambiente por ausência de checkout local autorizado; validação final deve ocorrer por CI ou em Windows/Node.js 20+.

### Riscos

- Usuários que configuraram `OLLAMA_URL` com IPv4 inválido agora cairão silenciosamente para `http://127.0.0.1:11434`, que é o comportamento seguro do MVP.
- A validação mantém `localhost`, `::1` e IPv4 válido de loopback; não habilita acesso remoto ao Ollama.
- Ainda é necessário validar a suíte completa em ambiente local/CI.

### Pendências atualizadas

1. Executar `npm test` em checkout local com Node.js 20+.
2. Testar scripts PowerShell em Windows real com Ollama instalado.
3. Continuar endurecimento incremental de contratos HTTP/SSE e configuração local.
4. Avaliar documentação de integração futura com cliente local/VS Code sem CORS amplo por padrão.

### Próximo passo sugerido

Na próxima execução segura, priorizar teste offline de `getStartupConsoleLines()` para garantir que a saída de console não exponha `PROJECT_ROOT`, `OLLAMA_URL` real ou caminhos sensíveis, mantendo a inicialização amigável para Windows.
