# PROJECT MEMORY RUN - 2026-07-01 23:20 BRT

## Análise inicial

- Repositório `PheidiasSoftware/TESTE` examinado antes da alteração.
- Arquivos revisados nesta execução: `README.md`, `package.json`, `src/config.js`, `src/server.js`, `src/project-files.js`, `test/server.test.js`, `.github/workflows/node-test.yml` e memórias/commits recentes encontrados via GitHub.
- `README.md` confirma o objetivo do backend local leve para programação em PC fraco com Windows, 8 GB RAM e sem GPU, usando Node.js 20+ e Ollama local.
- `package.json` permanece sem dependências externas e usa `node --test`, adequado para validação offline em máquina fraca.
- `src/server.js` já possui API local, fila conservadora, cache, rate limit, streaming SSE, leitura segura de arquivos e planejamento de geração grande em etapas.
- `src/project-files.js` já protegia contra caminho absoluto, travessia, `.env`, pastas sensíveis, extensões fora da allowlist, arquivos grandes, symlink real fora da raiz, espaços nas bordas e caminhos longos.
- `.github/workflows/node-test.yml` executa `npm test` com Node.js 20, sem instalar Ollama e sem GPU.
- Busca de PRs recentes retornou vazia; busca de issues abertas não retornou itens relevantes.
- Commits/memórias recentes mostram evolução incremental em segurança, headers, streaming, limites e compatibilidade Windows.

## Decisão

Aplicar uma melhoria pequena, segura e reversível em backend/leitura segura de arquivos: bloquear nomes reservados do Windows em qualquer segmento do caminho (`CON`, `PRN`, `AUX`, `NUL`, `COM1`-`COM9`, `LPT1`-`LPT9`), inclusive quando usados com extensão, como `CON.txt`.

Motivo: em Windows esses nomes são dispositivos especiais e podem gerar comportamento inesperado. O projeto é explicitamente pensado para Windows/PC fraco, então esse bloqueio reduz risco sem adicionar dependências, sem executar código de usuário e sem custo relevante de memória/CPU.

## Arquivos alterados/criados

- `src/project-files.js`
  - Criado conjunto `WINDOWS_RESERVED_DEVICE_NAMES`.
  - Criado helper `isWindowsReservedPathSegment()`.
  - `validateSafeProjectFilePath()` agora rejeita qualquer segmento do caminho que use nome reservado do Windows, mesmo com extensão.

- `test/project-files-windows.test.js`
  - Novo teste offline usando `node:test`.
  - Valida rejeição de `CON.txt`, `src/NUL.md`, `docs/com1.js` e `notes/LPT9.txt`.

- `PROJECT_MEMORY_RUN_2026-07-01_WINDOWS_RESERVED_PATH_NAMES.md`
  - Registro desta execução com análise, decisão, alterações, validações, riscos, pendências e próximos passos.

## Validações

- Revisão estática dos arquivos alterados.
- Teste criado é offline, não chama Ollama, não baixa modelos e não executa código gerado por usuário.
- Nenhuma dependência externa foi adicionada.
- Alteração fica limitada à validação de caminhos da API de leitura/contexto.
- `npm test` não foi executado nesta execução porque não havia checkout local autorizado no ambiente da automação; a CI do repositório deve validar em Node.js 20.

## Riscos

- Baixo risco: arquivos reais com nomes como `CON.txt` ou diretórios `NUL` passam a ser rejeitados. No Windows esses nomes já são problemáticos, então o bloqueio é desejável.
- Em Linux seria tecnicamente possível criar esses nomes, mas o projeto prioriza compatibilidade segura com Windows.

## Pendências

1. Verificar resultado da CI no commit final.
2. Executar `npm test` localmente em Windows/Node.js 20+ quando houver checkout disponível.
3. Revisar se `/api/read-file` deve parar de truncar `body.path` antes de chamar `readProjectFile`, para aproveitar integralmente a validação de caminho longo já existente.
4. Continuar incrementos pequenos em segurança, streaming, cache, fila, contexto grande e documentação para ambiente Windows 8 GB sem GPU.

## Status MVP backend

O backend aparenta estar próximo de um MVP técnico: já há API local, health/status, geração via Ollama, streaming SSE, fila, cache, rate limit, leitura segura de arquivos, planejamento de geração grande e testes offline. Ainda depende de validação completa da CI/local, decisão de frontend/UX e testes reais com Ollama em máquina Windows fraca.
