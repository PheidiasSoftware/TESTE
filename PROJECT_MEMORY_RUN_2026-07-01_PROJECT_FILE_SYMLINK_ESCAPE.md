# PROJECT_MEMORY_RUN_2026-07-01_PROJECT_FILE_SYMLINK_ESCAPE

## Data/hora

2026-07-01 11:18 America/Sao_Paulo

## Avaliação inicial do repositório

Antes de alterar qualquer arquivo, foram examinados:

- `README.md`: confirma objetivo de backend local leve para programação com Ollama/SLM, Windows, 8 GB RAM e sem GPU; documenta endpoints, scripts Windows, testes offline, CI leve e guias técnicos.
- `package.json`: projeto Node.js ESM, sem dependências externas, com scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- `src/config.js`: limites conservadores de payload, fila, contexto, cache, leitura de arquivos, rate limit e normalização segura de `OLLAMA_URL`.
- `src/ollama.js`: payload conservador, sanitização de opções, tratamento seguro de erro upstream, streaming JSONL com limite por linha.
- `src/http.js`: headers de segurança, JSON, SSE e limite de payload.
- `src/server.js`: rotas locais, fila, cache, geração normal/streaming, leitura de arquivos, planejamento de geração grande, rate limit e startup sem expor raiz/URL real.
- `src/project-files.js`: leitura segura com validação lexical de caminho, bloqueio de travessia, `.env`, pastas sensíveis, extensões e limite de tamanho.
- `test/project-files.test.js`: testes existentes para travessia, `.env`, limite de arquivo, truncamento UTF-8 e montagem de contexto.
- `PROJECT_MEMORY.md` e execuções recentes: indicam evolução incremental já feita para API, Ollama, streaming, cache, segurança, testes e documentação.
- PRs recentes: nenhum PR retornado pelo conector.
- Commits recentes pesquisados: últimas execuções focaram refinamentos do streaming Ollama e contrato seguro de `OLLAMA_URL`.

Não foram encontrados arquivos ou instruções conflitantes do Claude Agent nos arquivos lidos nesta execução.

## Decisão tomada

Aplicar uma melhoria pequena, segura e reversível na leitura de arquivos do projeto: impedir que um link simbólico dentro da raiz autorizada resolva para um arquivo fora do projeto.

Motivo: a validação anterior bloqueava travessia lexical (`../`) e caminhos absolutos, mas `stat/readFile` seguem symlinks. Um symlink interno poderia apontar para arquivo externo e contornar a intenção de isolamento por `PROJECT_ROOT`.

## Arquivos alterados/criados

- `src/project-files.js`
  - Adicionado uso de `realpath` para resolver a raiz real do projeto e o caminho real do arquivo antes de ler.
  - Criada validação `isPathInsideRoot()` para confirmar que o caminho real do arquivo continua dentro da raiz real.
  - Criada função interna `resolveRealFileInsideProjectRoot()`.
  - `readProjectFile()` agora lê e executa `stat` sobre o caminho real validado, mantendo a resposta com o caminho relativo original seguro.
  - Mantidos os bloqueios existentes de caminho absoluto, travessia, `.env`, pastas sensíveis, extensões e tamanho.

- `test/project-files.test.js`
  - Adicionado teste de bloqueio para symlink que aponta para fora da raiz do projeto.
  - O teste pula de forma segura quando o sistema operacional não permite criar symlinks no ambiente local, comum em Windows sem privilégio adequado.

- `PROJECT_MEMORY_RUN_2026-07-01_PROJECT_FILE_SYMLINK_ESCAPE.md`
  - Criado este registro de execução.

## Validações executadas

- Revisão estática manual das alterações.
- Conferido que não foram adicionadas dependências externas.
- Conferido que a melhoria usa apenas módulos nativos do Node.js (`node:fs/promises` e `node:path`).
- Conferido que não executa código gerado pelo usuário.
- Conferido que a API mantém comportamento esperado para arquivos pequenos válidos.
- `npm test` não foi executado nesta automação por ausência de checkout local autorizado.

## Riscos

- Em alguns ambientes Windows, criação de symlink exige permissão especial; por isso o teste novo usa `t.skip()` quando `symlink()` falha por permissão ou suporte.
- `realpath(projectRoot)` exige que a raiz configurada exista. Isso é esperado para uso normal do backend, pois `PROJECT_ROOT` deve apontar para uma pasta real do projeto.
- Se futuramente houver suporte intencional a symlinks internos válidos, eles continuam permitidos desde que resolvam para dentro da raiz real do projeto.

## Pendências

1. Executar `npm test` em checkout local com Node.js 20+.
2. Confirmar CI/checks do commit final quando disponíveis.
3. Continuar melhorias pequenas em documentação operacional, testes offline e endurecimento de API.
4. Considerar teste adicional para symlink interno permitido, se isso virar requisito explícito.

## Próximos passos sugeridos

Na próxima execução segura, priorizar uma validação pequena e reversível em testes/documentação, como documentar a regra de symlinks em `docs/security-headers.md` ou criar teste adicional para leitura segura em contexto com symlink interno permitido.

## Critérios de MVP backend observados

Atendidos para backend MVP local:

- API HTTP local com rotas de saúde/status, geração, streaming, leitura segura de arquivo e planejamento de geração grande.
- Integração com Ollama local e modelo pequeno sugerido.
- Fila conservadora e cache em memória para PC fraco.
- Limites de payload, contexto, arquivos, cache, fila e rate limit.
- Logs estruturados com redaction de campos sensíveis.
- Testes offline com `node --test` sem exigir GPU nem Ollama.
- Documentação para Windows, Ollama, API, streaming, geração grande e validação local.

Ainda depende de decisão do usuário ou frontend:

- Interface/cliente final para uso contínuo.
- Escolha final de modelo local por máquina.
- Política de armazenamento persistente, se houver necessidade futura.
- Estratégia de distribuição/instalação para usuários não técnicos.
