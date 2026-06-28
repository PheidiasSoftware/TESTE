# Registro de execução - CI leve Node.js

## Data/hora

2026-06-28 01:37 America/Sao_Paulo

## Avaliação inicial do repositório

Antes de qualquer alteração, o repositório `PheidiasSoftware/TESTE` foi examinado novamente.

Arquivos e áreas conferidos:

- `README.md`
- `package.json`
- `src/server.js`
- `test/server.test.js`
- `scripts/start-windows.ps1`
- `memory.md`
- `PROJECT_MEMORY.md`
- `PROJECT_MEMORY_RUN_2026-06-28_STREAMING.md`
- tentativa de leitura de `.github/workflows/node-test.yml`
- busca textual no repositório por termos de Claude Agent, memória, backend, streaming, cache e fila
- PRs recentes do usuário no repositório

Estado observado:

- O backend já estava estruturado em Node.js nativo, sem dependências externas.
- `package.json` mantinha `node --test` como script de teste e Node.js 20+ como requisito.
- `src/server.js` já continha fila conservadora, cache pequeno, leitura segura de arquivos, contexto controlado por arquivos, endpoint JSON e endpoint de streaming SSE.
- `test/server.test.js` cobria funções puras e rotas HTTP locais sem chamar Ollama.
- `README.md` documentava o backend, mas ainda indicava CI leve como próximo passo e não tinha seção própria de CI.
- `PROJECT_MEMORY_RUN_2026-06-28_STREAMING.md` indicava como próximo passo seguro priorizar CI leve com GitHub Actions ou atualizar o README com referência ao guia de streaming.
- `.github/workflows/node-test.yml` não existia.
- Não foram encontrados PRs recentes nem registros claros de Claude Agent com instruções conflitantes nesta execução.

## Decisão tomada

Executar uma melhoria incremental, segura e reversível: adicionar CI leve com GitHub Actions para rodar `npm test` em Node.js 20 e atualizar o README para documentar a CI e o guia de streaming.

Motivos:

- A pendência de validação automática aparecia em registros anteriores.
- O workflow não adiciona dependências ao runtime local.
- A CI não exige GPU, Ollama instalado ou download de modelo.
- Os testes atuais foram desenhados para não chamar o modelo local, o que torna a validação adequada para GitHub Actions.

## Arquivos criados/alterados

### `.github/workflows/node-test.yml`

Criado workflow com:

- gatilhos em push para `main`, pull request para `main` e execução manual `workflow_dispatch`;
- permissão mínima `contents: read`;
- `concurrency` para cancelar execuções antigas do mesmo ref;
- job em `ubuntu-latest` com timeout de 10 minutos;
- setup de Node.js 20;
- execução de `npm test`;
- variáveis conservadoras iguais às recomendadas para PC fraco, sem instalar Ollama.

### `README.md`

Atualizações principais:

- adicionada seção `CI leve`;
- documentado que a CI roda `npm test` em Node.js 20;
- documentado que a CI não instala Ollama, não baixa modelos e não chama geração real;
- documentado `POST /api/generate-stream` no README principal;
- adicionado link para `docs/streaming.md`;
- atualizadas decisões de arquitetura;
- removida a pendência genérica de considerar CI e substituída por próximos passos mais práticos.

### `PROJECT_MEMORY_RUN_2026-06-28_CI.md`

Criado este registro de memória/estado para preservar avaliação inicial, decisão, alterações, validações, riscos e próximos passos.

## Validações executadas

- Validação estática manual do YAML do workflow.
- Conferido que o workflow não usa `npm install` nem adiciona dependências externas, pois o projeto atualmente não possui dependências.
- Conferido que `npm test` usa somente recursos nativos do Node.js 20.
- Conferido que os testes existentes não fazem chamada válida ao Ollama nem exigem modelo instalado.
- Conferido que o README agora referencia o endpoint de streaming e o guia técnico.
- Não foi possível executar a CI imediatamente pelo conector; a primeira validação real ocorrerá no próximo push/PR/manual dispatch do GitHub Actions.

## Riscos e observações

- Como não há `package-lock.json` nem dependências, o workflow não executa `npm ci`. Se dependências forem adicionadas no futuro, será necessário criar lockfile e ajustar o workflow.
- A CI roda em Linux, enquanto o alvo principal de uso local inclui Windows. Ela valida a lógica Node multiplataforma, mas ainda não substitui teste manual do `scripts/start-windows.ps1` em Windows real.
- O workflow valida testes que não dependem de Ollama. O fluxo real de geração e streaming ainda precisa ser testado localmente com Ollama e modelo instalado.

## Pendências atualizadas

1. Verificar o resultado do GitHub Actions após a primeira execução do workflow.
2. Testar `npm run start:windows` em Windows real com Ollama instalado.
3. Testar `POST /api/generate` e `POST /api/generate-stream` com Ollama real e modelo `qwen2.5-coder:1.5b-instruct`.
4. Documentar integração futura com plugin/extensão VS Code ou cliente Flutter.
5. Considerar separação gradual de `src/server.js` em módulos menores quando o arquivo crescer mais.

## Próximo passo sugerido

Na próxima execução segura, verificar o resultado do workflow de CI ou, se ainda não houver resultado disponível, priorizar documentação de integração com cliente local simples, mantendo o backend sem execução automática de código do usuário.
