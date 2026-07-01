# Memória de execução - 2026-07-01 07:37 America/Sao_Paulo

## Avaliação inicial do repositório

Repositório analisado antes de qualquer alteração, conforme regra obrigatória.

Arquivos e áreas verificados:

- `README.md`: confirma objetivo do backend local para LLM/SLM de programação em PC fraco com Windows, 8 GB RAM e sem GPU; documenta Node.js 20+, Ollama local, modelo `qwen2.5-coder:1.5b-instruct`, scripts Windows, testes, CI, endpoints, variáveis de ambiente e guias técnicos.
- `package.json`: projeto Node.js ESM sem dependências externas; scripts `start`, `start:windows`, `dev`, `test`, `test:windows` e `smoke:windows`.
- `src/server.js`: API HTTP nativa com `/health`, `/api/status`, `/api/generate`, `/api/generate-stream`, `/api/read-file` e `/api/large-code-plan`; possui fila, cache, rate limit, validação de JSON, streaming SSE, leitura segura de arquivos e sugestão para geração grande em etapas.
- `src/ollama.js`: cliente Ollama com payload conservador, sanitização de opções, tratamento seguro de erros upstream, parser JSONL de streaming e liberação do reader.
- `src/http.js`: headers de segurança, JSON/SSE e leitura de corpo JSON com rejeição de tipos inválidos.
- `src/cache.js`: cache em memória limitado e somente para respostas completas `done: true`.
- `src/config.js`: limites conservadores para corpo, fila, cache, leitura de arquivos, contexto, geração grande e rate limit; normalização de host, modelo, URL do Ollama, flags e extensões permitidas.
- `.github/workflows/node-test.yml`: CI leve em Node.js 20 com `npm test`, sem Ollama/modelo/GPU.
- `PROJECT_MEMORY.md`: memória histórica complementar até scripts Windows e próximos passos iniciais.
- PRs recentes: nenhum PR recente retornado pelo conector.
- Issues abertas pesquisadas por Claude/backend/LLM/Ollama: nenhum resultado retornado.
- Registros do Claude Agent: não foram encontrados registros ou instruções conflitantes nos arquivos lidos e buscas realizadas nesta execução.

## Decisão tomada

Foi escolhida uma melhoria pequena, segura, reversível e documental: criar um guia específico sobre segurança do Ollama local e postura recomendada para `OLLAMA_URL`.

Motivo: o backend envia prompts finais para `/api/generate` do Ollama, e esses prompts podem conter contexto de projeto. Documentar a regra de manter `OLLAMA_URL` em loopback reduz risco operacional sem alterar contrato de API, sem adicionar dependências e sem quebrar usos atuais.

## Arquivos alterados/criados

- `docs/local-ollama-security.md`
  - Criado guia de segurança para uso local do Ollama.
  - Recomenda `OLLAMA_URL=http://127.0.0.1:11434`.
  - Explica risco de endpoints externos, túneis, IPs públicos ou domínios remotos.
  - Inclui configuração PowerShell conservadora para Windows fraco.
  - Lista proteções já existentes no backend.
  - Registra decisão de MVP: ferramenta local, não expor na internet.
  - Inclui checklist antes de usar com código real.

- `PROJECT_MEMORY_RUN_20260701_0737.md`
  - Registra esta execução com análise inicial, decisão, arquivos alterados, validações, riscos, pendências e próximos passos.

## Validações executadas

- Revisão estática do novo documento.
- Conferido que a alteração não adiciona dependências.
- Conferido que a alteração não executa código gerado pelo usuário.
- Conferido que a alteração não altera API, runtime, scripts ou CI.
- Conferido que a melhoria é reversível por remoção do arquivo documental.
- `npm test` não foi executado neste ambiente porque não há checkout local disponível pelo conector usado nesta execução.

## Riscos

- O documento orienta evitar Ollama remoto, mas o código atual ainda permite configurar `OLLAMA_URL` para HTTP/HTTPS remoto após sanitização. Uma restrição de código pode ser considerada depois, mas exigiria decisão cuidadosa para não quebrar cenários avançados.
- O novo guia ainda não foi linkado no índice do `README.md`; isso pode ser feito em uma próxima melhoria pequena.

## Pendências

1. Executar `npm test` em checkout local ou pela CI.
2. Considerar linkar `docs/local-ollama-security.md` no `README.md` em próxima execução.
3. Considerar política explícita para `OLLAMA_URL` remoto, por exemplo modo local por padrão e liberação remota somente com flag consciente.
4. Manter melhorias incrementais em testes offline de segurança, streaming, cache e geração grande.

## Próximo passo sugerido

Na próxima execução segura, atualizar o `README.md` para incluir o novo guia `docs/local-ollama-security.md` na seção de guias técnicos, ou criar teste de configuração que formalize a sanitização de `OLLAMA_URL` sem bloquear usuários avançados.
