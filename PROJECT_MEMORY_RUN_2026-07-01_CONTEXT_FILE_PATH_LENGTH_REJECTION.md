# PROJECT MEMORY RUN - 2026-07-01 - Context file path length rejection

## Análise inicial

- Repositório `PheidiasSoftware/TESTE` examinado antes da alteração.
- Arquivos lidos nesta execução: `README.md`, `package.json`, `src/server.js`, `src/http.js`, `src/config.js`, `src/ollama.js`, `src/project-files.js`, `test/http.test.js`, `test/ollama.test.js`, `test/project-files.test.js`, `.github/workflows/node-test.yml`, `docs/security-headers.md` e `PROJECT_MEMORY.md`.
- O README confirma o objetivo do backend local leve para PC fraco com Windows, 8 GB RAM e sem GPU, usando Node.js 20+ e Ollama local.
- `package.json` continua sem dependências externas e usa `node --test`.
- O backend já possui fila conservadora, cache em memória, streaming SSE, leitura segura de arquivos, limites de contexto, rate limit local, logs com redaction e documentação técnica.
- A CI leve existe em `.github/workflows/node-test.yml` e roda `npm test` em Node.js 20 sem instalar Ollama.
- Busca de issues no repositório não retornou itens abertos/recentes pelo conector.
- Não foram encontrados registros claros de Claude Agent nos arquivos lidos nesta execução.

## Decisão

Fazer uma melhoria pequena, segura, reversível e focada em backend: rejeitar caminhos muito longos em `contextFiles` em vez de truncá-los silenciosamente.

Motivo: o código anterior usava `item.slice(0, 500)` antes de chamar `readProjectFile()`. Isso limitava tamanho, mas alterava o caminho pedido pelo cliente. Em uma API de leitura segura, é mais previsível e auditável recusar o caminho excessivo com erro `400`, sem tentar corrigir ou encurtar automaticamente.

## Arquivos alterados

- `src/project-files.js`
  - Criado `MAX_CONTEXT_FILE_PATH_CHARS = 500`.
  - `buildContextFromFiles()` agora rejeita item de `contextFiles` com mais de 500 caracteres.
  - Removido truncamento silencioso `item.slice(0, 500)`; o caminho validado é o caminho originalmente recebido.

- `test/project-files.test.js`
  - Importado `MAX_CONTEXT_FILE_PATH_CHARS`.
  - Adicionado teste offline para garantir que caminho longo em `contextFiles` retorna erro `400` em vez de ser truncado.

## Validações

- Revisão estática feita no diff aplicado.
- A alteração não executa código gerado pelo usuário.
- A alteração não adiciona dependências.
- A alteração não expõe segredos.
- A alteração é reversível: basta remover a constante e restaurar o comportamento anterior.
- `npm test` não foi executado nesta automação porque não há checkout local disponível/autorizado neste ambiente; a CI do repositório deve validar no GitHub após o push.

## Riscos

- Clientes que dependiam indiretamente do truncamento silencioso de caminhos acima de 500 caracteres agora recebem erro `400`. Esse comportamento é intencionalmente mais seguro.
- O limite de 500 caracteres é conservador para uso local e suficiente para caminhos relativos normais em projetos Node/Flutter/MySQL.

## Status MVP backend

Critérios já atendidos para MVP backend local:

- API HTTP local com rotas de saúde/status e geração.
- Integração com Ollama local.
- Streaming SSE.
- Fila conservadora para PC fraco.
- Cache em memória limitado.
- Detecção/sugestão para geração grande em etapas.
- Leitura segura de arquivos com allowlist, bloqueio de travessia, `.env`, pastas sensíveis e symlink externo.
- Rate limit local.
- Testes offline com `node --test`.
- CI leve em GitHub Actions.
- Documentação técnica básica.

Ainda depende de decisão do usuário/frontend:

- Interface visual ou extensão cliente.
- UX para geração grande por etapas.
- Escolha final dos modelos Ollama padrão por máquina.
- Política explícita de CORS caso exista frontend local em outra origem.
- Validação em Windows real com 8 GB RAM e sem GPU.

## Próximos passos sugeridos

1. Rodar `npm test` no GitHub Actions ou em Windows local.
2. Adicionar documentação curta sobre limites de `contextFiles` no contrato da API.
3. Considerar deduplicação segura de `contextFiles` repetidos para economizar leitura e contexto.
