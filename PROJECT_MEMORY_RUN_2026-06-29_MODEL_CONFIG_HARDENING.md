# PROJECT MEMORY - MODEL CONFIG HARDENING

Data/hora local: 2026-06-29 20:37 BRT
Repositório: `PheidiasSoftware/TESTE`
Execução: backend LLM/SLM leve para programação em PC fraco Windows, 8 GB RAM, sem GPU.

## Avaliação inicial obrigatória

Antes de alterar o repositório, foram examinados via conector GitHub:

- `README.md`
- `package.json`
- `src/config.js`
- `src/project-files.js`
- `src/server.js`
- `src/ollama.js`
- `test/config.test.js`
- `test/ollama.test.js`
- `docs/backend-mvp-status.md`
- PRs recentes do usuário no repositório
- Issues abertas relacionadas a Claude/backend/LLM/SLM/Windows/MVP

Resultado da avaliação:

- O backend já possui API local Node.js, integração com Ollama, fila conservadora, cache, rate limit, leitura segura de arquivos, SSE, logs estruturados e documentação de MVP.
- O `package.json` permanece sem dependências externas pesadas e exige Node.js 20+.
- Não foram encontrados PRs recentes no repositório pelo conector.
- Não foram encontradas issues abertas relevantes pelo conector.
- Não foram encontrados registros claros de Claude Agent nos arquivos ou buscas disponíveis nesta execução.
- A validação objetiva por `npm test`, `npm run test:windows` ou CI verde continua pendente porque o conector GitHub usado nesta execução não executa testes.

## Decisão tomada

A próxima tarefa segura foi endurecer a configuração do nome do modelo local (`MODEL`) em `src/config.js`.

Motivo:

- `MODEL` era exposto e repassado ao cliente Ollama diretamente a partir do ambiente.
- Valores com espaços, caracteres ambíguos, query strings ou tamanho excessivo poderiam gerar configuração ruim e diagnósticos confusos.
- A mudança é pequena, reversível e compatível com o escopo do backend local.
- Não adiciona dependências, não executa código do usuário e não altera a exposição local segura do serviço.

## Arquivos alterados/criados

Alterados:

- `src/config.js`
  - Adicionado `DEFAULT_MODEL`.
  - Adicionado `MODEL_NAME_PATTERN` conservador.
  - Adicionada função exportada `normalizeModelName`.
  - `loadConfig` agora usa `normalizeModelName(env.MODEL)`.
  - O fallback seguro permanece `qwen2.5-coder:1.5b-instruct`.

- `test/config.test.js`
  - Importa `normalizeModelName`.
  - Adiciona testes para modelos Ollama comuns e leves.
  - Adiciona testes para rejeitar nomes inseguros ou ambíguos.
  - Adiciona teste de normalização de `MODEL` via `loadConfig`.

Criado:

- `PROJECT_MEMORY_RUN_2026-06-29_MODEL_CONFIG_HARDENING.md`

## Validações executadas

Validações por inspeção:

- O padrão aceita nomes comuns como `qwen2.5-coder:1.5b-instruct`, `deepseek-coder:1.3b` e `namespace/model.name:tag_1`.
- O padrão rejeita espaços, caminhos relativos iniciando com `../`, query strings e valores acima de 180 caracteres.
- O fallback mantém o modelo leve sugerido para CPU e PC fraco.

Validações automatizadas:

- Não executadas nesta rodada. O conector GitHub disponível permite editar arquivos, mas não executar `npm test`.

## Riscos

- O padrão conservador pode rejeitar algum nome de modelo exótico que o Ollama aceite. Isso é intencional para manter configuração local simples e segura no MVP.
- Ainda falta evidência objetiva de testes verdes no commit mais recente.

## Pendências

1. Confirmar `npm test`.
2. Confirmar `npm run test:windows` em Windows com Node.js 20+.
3. Confirmar CI verde quando houver execução registrada.
4. Após validação objetiva, registrar o backend como MVP estável/completo em documentação de status.

## Próximos passos seguros

- Prioridade imediata: validação objetiva por teste local ou CI.
- Sem validação verde, evitar refatorações grandes em `src/server.js`.
- Com validação verde, próxima melhoria pequena: extrair handlers/rotas de `src/server.js` para módulo dedicado, preservando contrato da API.

## Compatibilidade com Claude Agent

Nenhum arquivo, issue, PR ou registro claro do Claude Agent foi identificado nesta execução. A alteração foi mantida incremental e documentada para que outro agente consiga continuar sem conflito.
