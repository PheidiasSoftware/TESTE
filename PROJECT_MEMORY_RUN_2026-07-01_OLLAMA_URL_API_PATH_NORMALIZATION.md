# PROJECT MEMORY RUN - 2026-07-01 - OLLAMA URL API PATH NORMALIZATION

## Data/hora

2026-07-01 08:22 America/Sao_Paulo.

## Avaliação inicial do repositório

Execução feita como melhoria incremental de backend para o repositório `PheidiasSoftware/TESTE`.

Arquivos e áreas examinadas antes da alteração:

- `README.md`: confirma objetivo do backend local para LLM/SLM de programação em PC fraco com Windows, 8 GB RAM e sem GPU; documenta Node.js 20+, Ollama, endpoints, limites conservadores, Windows scripts, testes e guias técnicos.
- `package.json`: projeto Node.js ESM sem dependências externas, scripts `start`, `start:windows`, `dev`, `test`, `test:windows` e `smoke:windows`.
- `.github/workflows/node-test.yml`: CI leve com Node.js 20, `npm test`, sem Ollama/modelos e com limites conservadores.
- `src/server.js`: API local, rotas de geração, streaming SSE, leitura segura de arquivos, planejamento de geração grande, fila, cache, rate limit e logs estruturados.
- `src/ollama.js`: cliente Ollama com payload conservador, sanitização de erros upstream, streaming JSONL e limite de linha pendente.
- `src/config.js`: normalização de ambiente, limites para PC fraco, host local, modelo, URL do Ollama, flags e extensões permitidas.
- `test/config.test.js`: cobertura offline de configuração, limites, URL do Ollama, modelo, booleanos e extensões.
- Issues/PRs: não foram encontrados issues ou PRs abertos relevantes na busca do conector.
- Commits recentes: histórico mostra execuções anteriores focadas em documentação, segurança, streaming, cache, validações e status do backend.
- Claude Agent: não foram encontrados registros explícitos de Claude Agent nos resultados examinados nesta execução.

## Decisão tomada

Escolhida uma melhoria pequena, segura e reversível: tornar `OLLAMA_URL` mais tolerante quando o usuário configura por engano a URL com o caminho `/api` ou `/api/generate`.

Motivo:

- O cliente Ollama monta internamente o endpoint final adicionando `/api/generate` à URL base.
- Se o usuário definir `OLLAMA_URL=http://127.0.0.1:11434/api/generate`, o backend poderia formar um endpoint inválido duplicado.
- A correção reduz erro de configuração comum em Windows/PC fraco sem alterar arquitetura, sem dependências novas e sem executar código gerado.

## Arquivos alterados/criados

### Alterados

- `src/config.js`
  - `normalizeOllamaUrl()` agora remove os caminhos comuns `/api` e `/api/generate` da URL configurada.
  - Mantém remoção de usuário, senha, query e hash.
  - Mantém fallback seguro para protocolos inválidos ou URLs inválidas.

- `test/config.test.js`
  - Ajustado teste de URL HTTPS para base sem `/api`.
  - Adicionado teste cobrindo normalização de:
    - `http://127.0.0.1:11434/api`
    - `http://127.0.0.1:11434/api/generate`
    - `http://127.0.0.1:11434/api/generate/`

### Criado

- `PROJECT_MEMORY_RUN_2026-07-01_OLLAMA_URL_API_PATH_NORMALIZATION.md`
  - Este registro de memória/estado da execução.

## Validações executadas

- Revisão estática via leitura do repositório com GitHub connector.
- Conferência pós-alteração de `src/config.js` e `test/config.test.js` pelo conector.
- `npm test` não foi executado nesta automação porque não havia checkout local disponível neste runtime.

## Riscos

- Baixo risco: alteração restrita à normalização de configuração e teste offline.
- Se alguém usava intencionalmente `OLLAMA_URL` terminando exatamente em `/api` como base reversa, agora será normalizado para a raiz do host. Para o Ollama padrão isso é desejável, pois o backend já adiciona `/api/generate`.
- Caminhos customizados diferentes de `/api` e `/api/generate` continuam preservados.

## Pendências

- Executar `npm test` em checkout local ou pela CI para confirmar a suíte completa.
- Avaliar futuramente se a documentação deve explicitar que `OLLAMA_URL` aceita tanto a base (`http://127.0.0.1:11434`) quanto erros comuns com `/api` e `/api/generate`.

## Próximos passos sugeridos

1. Rodar `npm test` após checkout local.
2. Se aprovado, considerar uma próxima melhoria pequena em documentação ou teste para confirmar o endpoint final do cliente Ollama quando `OLLAMA_URL` vier normalizado.
3. Manter escopo incremental: backend local seguro, leve, com geração em etapas, streaming, cache, fila, limites de memória e documentação para Windows 8 GB sem GPU.

## Status MVP backend

O backend segue próximo/completo para MVP técnico conforme documentação existente: API local, integração Ollama, geração normal e streaming, fila, cache, leitura segura de arquivos, planejamento de geração grande, rate limit, logs, testes offline e scripts Windows. Ainda dependem de decisão do usuário ou frontend: experiência visual, empacotamento final para usuário leigo, escolha definitiva de modelos e validação prática em máquina Windows real com 8 GB RAM sem GPU.