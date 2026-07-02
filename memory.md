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

## 2026-07-01 23:36 - Validação defensiva de Content-Length

### Avaliação inicial desta execução

- Repositório analisado antes de qualquer alteração.
- Arquivos conferidos: `README.md`, `package.json`, `src/http.js`, `src/config.js`, `test/http.test.js`, `docs/api-contract.md`, `PROJECT_MEMORY.md` e `memory.md`.
- `README.md` confirma backend local Node.js 20+ sem dependências externas pesadas, com Ollama local, scripts Windows, testes offline, leitura segura, streaming, rate limit e documentação técnica.
- `package.json` segue com `node --test` e sem dependências externas.
- `src/http.js` já validava `Content-Length` inválido e acima de `MAX_BODY_BYTES`, mas ainda não rejeitava explicitamente divergência entre o valor declarado e os bytes efetivamente recebidos pelo helper.
- PRs recentes e issues abertas foram consultados e não retornaram resultados.
- Não foram encontrados registros acionáveis de Claude Agent ou instruções conflitantes nos arquivos lidos nesta execução.

### Decisão tomada

Executar melhoria pequena, segura e reversível no helper de corpo JSON: quando `Content-Length` existir, rejeitar com `400` se o tamanho real do corpo recebido não corresponder ao valor declarado. Isso fortalece o contrato HTTP local sem adicionar dependências e sem alterar o fluxo de geração/Ollama.

### Arquivos alterados/criados

- `src/http.js`
  - Criado erro interno para divergência de `Content-Length`.
  - `readJsonBody()` agora compara os bytes recebidos com o valor declarado antes de parsear JSON.

- `test/http-content-length.test.js`
  - Criado teste offline para aceitar `Content-Length` exato.
  - Criados testes offline para rejeitar `Content-Length` menor e maior que o corpo real.

- `docs/api-contract.md`
  - Documentado que `Content-Length`, quando enviado, deve ser inteiro decimal válido, respeitar `MAX_BODY_BYTES` e corresponder ao corpo real.
  - Tabela de erros atualizada para incluir `Content-Length` incompatível em `400`.

- `memory.md`
  - Registrada esta execução.

### Validações executadas

- Revisão estática manual das alterações.
- Conferido que a alteração usa apenas APIs nativas do Node.js e não adiciona dependências.
- Conferido que os testes novos não chamam Ollama, não baixam modelo e não exigem GPU.
- Tentativa de checkout local para rodar `npm test` foi bloqueada pelo ambiente; a validação final ainda deve ocorrer localmente ou por CI.

### Riscos

- Clientes que enviem `Content-Length` incorreto agora recebem `400`, comportamento intencionalmente mais estrito.
- Em tráfego HTTP real, o runtime Node.js normalmente já ajuda a controlar framing; esta validação melhora o contrato do helper e os testes offline.

### Pendências atualizadas

1. Executar `npm test` localmente ou pela CI em Node.js 20+.
2. Testar `npm run test:windows` e `npm run smoke:windows` em Windows real com Ollama instalado.
3. Evitar refatorações amplas até haver evidência objetiva de testes verdes.
4. Continuar com melhorias pequenas em segurança/contrato ou revisar a prontidão final do MVP.
