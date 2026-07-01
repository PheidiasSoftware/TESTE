# PROJECT_MEMORY_RUN_20260701_0637

## Data/hora

2026-07-01 06:37 America/Sao_Paulo

## Avaliação inicial do repositório

- Repositório `PheidiasSoftware/TESTE` acessível com permissão de escrita.
- Branch padrão: `main`.
- `README.md` descreve backend local leve para LLM/SLM de programação, focado em Windows, Node.js 20+, 8 GB RAM, sem GPU e Ollama local.
- `package.json` continua sem dependências externas e usa `node --test`.
- Estrutura principal examinada: `src/server.js`, `src/config.js`, `src/http.js`, `src/ollama.js`, `src/project-files.js`, `src/large-code.js`, `scripts/start-windows.ps1`, `.github/workflows/node-test.yml`, testes e `PROJECT_MEMORY.md`.
- Backend atual já possui API HTTP nativa, fila de geração, cache em memória, streaming SSE, leitura segura de arquivos, rate limit, logs estruturados, headers de segurança e planejamento de geração grande em etapas.
- Workflow GitHub Actions `node-test.yml` roda `npm test` em Node.js 20 sem instalar Ollama.
- Busca por issues abertas relacionadas a Claude Agent/backend/Ollama/LLM/SLM não retornou resultados.
- Busca de PRs recentes no repositório não retornou resultados.
- Histórico recente encontrado: melhorias no limite de buffer do streaming Ollama, limpeza de reader e cache apenas para gerações completas.
- Não encontrei registros claros de Claude Agent conflitantes nesta execução.

## Decisão tomada

Adicionar uma melhoria pequena, segura e reversível na suíte de testes: cobrir explicitamente que o payload enviado ao Ollama mantém opções conservadoras e ignora opções pesadas/acidentais, como `num_gpu`, `main_gpu`, `low_vram`, `use_mmap` e `keep_alive`.

Motivo: em PC fraco com Windows, 8 GB RAM e sem GPU, é importante garantir que futuras alterações não permitam passar opções de runtime pesadas ou ambíguas para o Ollama sem validação. A melhoria não muda comportamento em produção, não adiciona dependências e não chama o Ollama.

## Arquivos alterados/criados

- `test/ollama-options-safety.test.js`
  - Novo teste para `sanitizeOllamaOptions()` ignorar chaves não suportadas/pesadas.
  - Novo teste para `buildOllamaGeneratePayload()` manter defaults conservadores quando opções são omitidas.
  - Novo teste para garantir clamp de `num_ctx`, `num_predict` e `temperature`, sem aceitar `num_gpu`.

- `PROJECT_MEMORY_RUN_20260701_0637.md`
  - Memória desta execução com análise inicial, decisão, alteração, validações, riscos, pendências e próximos passos.

## Validações executadas

- Revisão estática do novo teste.
- Conferido que o teste importa apenas funções puras de `src/ollama.js`.
- Conferido que o teste não chama rede, não chama Ollama, não executa código gerado e não adiciona dependências.
- `npm test` não foi executado neste ambiente por falta de checkout local disponível; a validação final deve ocorrer via GitHub Actions ou localmente com Node.js 20+.

## Riscos

- Risco baixo: alteração apenas em teste offline.
- O teste reforça o contrato atual; se no futuro for necessário suportar novas opções Ollama, será preciso alterar conscientemente `sanitizeOllamaOptions()` e atualizar este teste.

## Pendências

1. Executar `npm test` via CI ou localmente em Windows/Node.js 20+.
2. Testar `npm run start:windows` em Windows real com Ollama instalado.
3. Avaliar se vale expor opções Ollama controladas por variáveis de ambiente, mantendo limites rígidos para 8 GB RAM sem GPU.
4. Documentar integração futura com plugin/extensão VS Code ou cliente local simples.
5. Continuar fortalecendo testes de contrato sem depender de runtime externo.

## Próximo passo sugerido

Na próxima execução segura, considerar uma melhoria pequena no status da API ou documentação de configuração do Ollama, especialmente se for decidido permitir ajuste controlado de `num_ctx`, `num_predict` e `temperature` por ambiente.
