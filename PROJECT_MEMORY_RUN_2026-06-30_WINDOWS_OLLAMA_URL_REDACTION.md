# PROJECT_MEMORY_RUN_2026-06-30_WINDOWS_OLLAMA_URL_REDACTION

## Data/hora

2026-06-30 23:21 BRT

## Avaliação inicial do repositório

Antes de alterar qualquer arquivo, foram examinados os pontos principais do repositório:

- `README.md`: confirma objetivo do backend local leve para programação, Windows/Node.js 20+, 8 GB RAM, sem GPU, Ollama local, endpoints principais, testes, CI leve e documentação técnica.
- `package.json`: projeto Node.js ESM sem dependências externas, scripts `start`, `start:windows`, `dev`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: API HTTP nativa com `/health`, `/api/status`, `/api/generate`, `/api/generate-stream`, `/api/read-file` e `/api/large-code-plan`; fila conservadora, cache, rate limit, leitura segura e sugestão de geração grande em etapas.
- `src/config.js`: normalização de limites para PC fraco, modelo padrão leve, URL do Ollama com remoção de credenciais/query/hash, host local seguro e allowlist de extensões.
- `src/http.js`: respostas JSON/SSE com headers de segurança e leitura JSON com limite de payload.
- `src/large-code.js`: detecção de tarefa grande, divisão em etapas e plano incremental sem chamar Ollama.
- `test/server.test.js`, `test/http.test.js`, `test/config.test.js` e `test/content-type-contract.test.js`: cobertura offline para contrato HTTP, segurança, configuração, cache, fila e plano grande sem executar código gerado.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20, sem instalar Ollama nem baixar modelos.
- `scripts/start-windows.ps1`, `scripts/test-windows.ps1` e `scripts/smoke-windows.ps1`: scripts Windows para execução, testes offline e smoke tests.
- `PROJECT_MEMORY.md`: histórico complementar do projeto, decisões anteriores e pendências.

Também foram verificados registros externos:

- Busca de issues abertas por Claude/backend/Ollama não retornou pendências.
- Busca de PRs recentes no repositório não retornou PRs.
- A busca textual do conector não encontrou índice útil para arquivos do Claude Agent; nos arquivos examinados não havia instrução conflitante ou estado ativo dele.

## Decisão tomada

Foi escolhida uma melhoria pequena, segura e reversível no script Windows de inicialização: evitar imprimir `OLLAMA_URL` bruto no console quando o usuário definir uma URL customizada com credenciais, query string ou hash.

A URL real continua sendo usada internamente para a checagem `Invoke-RestMethod`; a alteração afeta apenas a exibição em tela e mensagens de aviso.

## Arquivos alterados/criados

### Alterado

- `scripts/start-windows.ps1`
  - Adicionada função `Get-RedactedUrl`.
  - Criada variável `$DisplayOllamaUrl` para exibição segura.
  - Troca de `Write-Host "Ollama URL: $env:OLLAMA_URL"` por exibição redigida.
  - Troca do aviso de falha do Ollama para usar a URL redigida.
  - Mantido o uso de `$env:OLLAMA_URL` real para consultar `/api/tags`.

### Criado

- `PROJECT_MEMORY_RUN_2026-06-30_WINDOWS_OLLAMA_URL_REDACTION.md`
  - Registro desta execução, análise inicial, decisão, arquivos alterados, validações, riscos e próximos passos.

## Validações executadas

- Revisão estática do PowerShell alterado.
- Conferido que a alteração não adiciona dependências.
- Conferido que não executa código gerado por usuário.
- Conferido que não altera limites de memória, concorrência, fila, cache ou contrato da API.
- Conferido que a URL real continua disponível para `Invoke-RestMethod`, preservando compatibilidade com configurações existentes.

`npm test` e o script PowerShell não foram executados neste ambiente por não haver checkout local disponível no conector GitHub.

## Riscos

- A função `Get-RedactedUrl` usa `System.UriBuilder`; em URLs inválidas ela retorna `invalid-url` apenas para exibição, sem impedir o fluxo atual. O backend Node continuará normalizando `OLLAMA_URL` em `src/config.js`.
- Se o usuário usa uma URL de Ollama remota com credenciais, a autenticação continua sendo usada na chamada de checagem, mas não aparece no console.

## Pendências

1. Executar localmente no Windows: `npm run test:windows`.
2. Executar com backend ligado: `npm run smoke:windows`.
3. Testar manualmente `scripts/start-windows.ps1` com `OLLAMA_URL` contendo usuário/senha/query para confirmar que o console não expõe segredo.
4. Considerar aplicar o mesmo padrão de exibição segura em outros scripts futuros que imprimam URLs configuráveis.

## Próximo passo sugerido

Na próxima execução segura, priorizar uma melhoria pequena em contrato de API ou documentação operacional, por exemplo validar headers de segurança no smoke test Windows ou documentar um checklist rápido de troubleshooting do Ollama em PC fraco.