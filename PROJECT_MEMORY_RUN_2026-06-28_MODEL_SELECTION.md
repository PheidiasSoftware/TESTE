# Memória de execução - Seleção de modelos leves

## Data/hora

2026-06-28 05:35 America/Sao_Paulo

## Avaliação inicial do repositório

Antes de qualquer alteração, o repositório `PheidiasSoftware/TESTE` foi examinado conforme regra obrigatória.

Arquivos e áreas conferidos:

- `README.md`
  - Confirma objetivo do backend local leve para programação em PC fraco com Windows, 8 GB RAM e sem GPU.
  - Documenta endpoints `/health`, `/api/status`, `/api/generate`, `/api/generate-stream` e `/api/read-file`.
  - Documenta fila, cache, leitura segura, logs estruturados e CI leve.
  - Próximos passos ainda incluem validação em Windows real, streaming com Ollama real e documentação futura de integração.

- `package.json`
  - Projeto Node.js ESM, sem dependências externas.
  - Scripts existentes: `start`, `start:windows`, `dev` e `test`.
  - Testes via `node --test`.

- `src/server.js`
  - Backend HTTP nativo.
  - Integração com Ollama.
  - Fila conservadora de geração.
  - Cache em memória por prompt.
  - Leitura segura de arquivos do projeto.
  - Contexto por arquivos.
  - Streaming SSE.
  - Logs estruturados com redaction.
  - Rate limit integrado nas rotas pesadas.

- `src/rate-limit.js`
  - Rate limiter de janela fixa em memória.
  - Sem dependências externas.
  - Limite de clientes ativos para evitar crescimento indefinido.

- `docs/rate-limit.md`
  - Documentação específica do rate limit local.

- `scripts/start-windows.ps1`
  - Script Windows já existente com padrões conservadores para geração, fila, cache e contexto.
  - Ainda não exibia defaults de rate limit e logging.

- `PROJECT_MEMORY.md`
  - Histórico complementar do projeto encontrado.
  - Não havia conflito com Claude Agent nos trechos analisados.

## Decisão tomada

A próxima tarefa segura e objetiva foi melhorar a documentação técnica de seleção/configuração de modelos leves e alinhar o script Windows com os recursos já adicionados de rate limit e logging.

Motivos:

- O backend já tem recursos principais do MVP local.
- Seleção de modelo é crítica para uso real em PC com 8 GB RAM sem GPU.
- A mudança é incremental, reversível e não adiciona dependências.
- O script Windows precisava mostrar os limites de rate limit/log para o usuário entender a configuração ativa.

## Arquivos criados/alterados

### Criado: `docs/model-selection.md`

Conteúdo adicionado:

- Princípios para escolher modelos pequenos e quantizados.
- Modelo padrão recomendado: `qwen2.5-coder:1.5b-instruct`.
- Alternativas leves para testes.
- Configuração conservadora para Windows.
- Reduções recomendadas para máquina com pouca memória.
- Sinais de modelo pesado demais.
- Tarefas adequadas e inadequadas para o MVP.
- Relação com segurança.
- Critérios para trocar o modelo padrão.

### Alterado: `scripts/start-windows.ps1`

Melhorias:

- Adicionados defaults conservadores quando não definidos:
  - `ENABLE_RATE_LIMIT=true`
  - `RATE_LIMIT_WINDOW_MS=60000`
  - `RATE_LIMIT_MAX_REQUESTS=30`
  - `RATE_LIMIT_MAX_CLIENTS=500`
  - `TRUST_PROXY=false`
  - `LOG_LEVEL=info`
- Exibição no terminal das configurações ativas de rate limit, proxy e logging.
- Mantido comportamento seguro: apenas verifica Ollama e inicia o backend; não executa código gerado pelo modelo.

## Validações executadas

- Validação estática manual do documento novo.
- Conferido que a documentação não recomenda modelo grande como padrão.
- Conferido que as configurações sugeridas mantêm `GENERATION_CONCURRENCY=1`.
- Conferido que o script não adiciona instalações automáticas, comandos destrutivos ou dependências pesadas.
- Conferido que as novas variáveis já existem no backend (`src/server.js`) e não quebram contrato.
- Não foi possível executar `npm test` pelo conector GitHub nesta execução.

## Riscos

- A disponibilidade exata de alguns modelos alternativos pode variar conforme instalação local do Ollama.
- O desempenho real depende do Windows, memória livre, processos abertos e quantização do modelo.
- A documentação de seleção de modelos ainda não está linkada no `README.md`; pode ser linkada em uma próxima execução segura.
- Ainda falta teste real em Windows com Ollama instalado.

## Pendências

1. Executar `npm test` localmente ou validar pela CI.
2. Testar `npm run start:windows` em Windows real com Ollama instalado.
3. Testar `/api/generate-stream` com modelo real.
4. Linkar `docs/model-selection.md` no `README.md`.
5. Documentar integração futura com plugin/extensão VS Code ou cliente Flutter.
6. Considerar separação gradual de `src/server.js` em módulos menores.

## Compatibilidade com Claude Agent

Nenhum arquivo de estado, branch, PR, issue ou instrução conflitante do Claude Agent foi encontrado nos arquivos analisados nesta execução. As alterações foram feitas como documentação e ajuste conservador de script, minimizando risco de conflito.

## Próximo passo sugerido

Na próxima execução segura, priorizar linkar `docs/model-selection.md` no `README.md` e/ou iniciar a separação gradual de `src/server.js` em módulos menores, começando por configuração ou helpers puros, sem alterar comportamento externo.
