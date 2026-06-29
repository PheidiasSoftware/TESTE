# Project memory — local validation guide

## Data/hora

2026-06-28 23:36 America/Sao_Paulo

## Avaliação inicial do repositório

Antes de alterar arquivos, foram verificados os pontos obrigatórios desta execução:

- Repositório `PheidiasSoftware/TESTE`, branch padrão `main`, público, com permissão de escrita disponível.
- README atual descreve backend Node.js 20+ para LLM/SLM local em PC fraco com Windows, 8 GB de RAM e sem GPU.
- `package.json` mantém projeto sem dependências externas, com scripts `start`, `start:windows`, `dev` e `test` usando `node --test`.
- Busca de issues abertas por termos relacionados a Claude Agent, memória, backend e MVP não retornou pendência aberta relevante.
- Busca de branch relacionada a `claude` não retornou branch relevante.
- Arquivos analisados diretamente: `README.md`, `package.json`, `docs/backend-mvp-status.md`, `src/server.js`, `src/config.js`, `test/server.test.js` e `PROJECT_MEMORY_RUN_2026-06-28_LOGGER_MODULE.md`.
- Não foram encontrados registros explícitos novos do Claude Agent nos arquivos lidos nesta execução. A decisão seguiu o status técnico registrado no repositório.

## Decisão tomada

O status do MVP indicava que a próxima prioridade segura era validar `npm test`/CI antes de novas alterações estruturais em `src/server.js`.

Como o conector GitHub desta execução não executa testes e uma tentativa de usar ambiente local não ficou disponível, a melhoria escolhida foi criar um guia de validação local leve e objetivo, adequado para Windows/PC fraco, antes de modularizar mais o servidor.

A alteração é pequena, reversível, documental, sem dependências novas, sem execução de código de usuário e sem alteração no contrato HTTP.

## Arquivos criados

- `docs/local-validation.md`
  - Documenta validação mínima sem Ollama com `npm test`.
  - Documenta health/status via PowerShell.
  - Documenta teste de payload inválido antes de chamar modelo.
  - Documenta leitura segura de arquivo permitido e caminho bloqueado.
  - Documenta validação opcional com Ollama e modelo pequeno.
  - Documenta streaming SSE opcional com `curl.exe -N`.
  - Inclui checklist antes de novas mudanças de backend.

## Arquivos alterados

- `README.md`
  - Adiciona link para `docs/local-validation.md` na seção de guias técnicos.

- `docs/backend-mvp-status.md`
  - Registra a documentação de validação local como critério atendido.
  - Atualiza critérios parcialmente atendidos com a pendência de executar `npm test` ou confirmar CI verde.
  - Atualiza próximos passos seguros priorizando o checklist de validação antes de nova extração de handlers/roteamento.

## Validações executadas

- Validação por leitura e consistência via conector GitHub:
  - README já continha seções de testes, CI, endpoints e guias técnicos; o novo link foi adicionado sem alterar contrato de API.
  - `docs/backend-mvp-status.md` já apontava validação como pendência; o novo guia responde diretamente a essa pendência.
  - `src/server.js` foi analisado e não foi alterado nesta execução para evitar risco de regressão sem testes verdes confirmados.

## Validações pendentes

- Executar `npm test` localmente ou confirmar CI verde no GitHub Actions.
- Executar checklist de `docs/local-validation.md` em Windows fraco quando possível.

## Riscos

- Como nenhuma execução real de testes foi feita nesta etapa, ainda existe risco residual nas integrações recentes em `src/server.js`.
- O guia reduz risco operacional, mas não substitui validação real de CI/local.
- Próximas mudanças em roteamento/handlers devem aguardar confirmação de testes verdes.

## Próximos passos seguros

1. Executar ou confirmar `npm test`/CI.
2. Se a validação estiver verde, extrair roteamento/handlers de `src/server.js` em módulo dedicado e pequeno.
3. Registrar formalmente o fechamento do MVP backend quando os critérios estiverem comprovados.
