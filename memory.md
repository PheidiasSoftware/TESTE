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
