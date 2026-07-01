# Memória da execução - Structured Logger Non-JSON

## Data/hora

2026-07-01 01:20 America/Sao_Paulo

## Avaliação inicial do repositório

- Repositório analisado antes de qualquer alteração: `PheidiasSoftware/TESTE`, branch padrão `main`.
- `README.md` confirma objetivo do backend: LLM/SLM local focada em programação para Windows/PC fraco, 8 GB RAM e sem GPU, usando Node.js 20+ e Ollama local.
- `package.json` continua leve, sem dependências externas, com scripts `start`, `start:windows`, `test`, `test:windows` e `smoke:windows`.
- Backend atual em `src/server.js` possui HTTP nativo, fila conservadora, cache, leitura segura de arquivos, geração normal, streaming SSE, rate limit, detecção de tarefa grande e plano incremental.
- `src/config.js` define limites conservadores, allowlist de extensões e padrão de redaction para logs.
- `src/logger.js` já fazia redaction de campos sensíveis, limitação de strings longas e arrays grandes.
- `test/logger.test.js`, `test/http.test.js`, `test/large-code.test.js` e demais testes offline cobrem partes importantes sem chamar Ollama nem executar código gerado.
- Workflow `.github/workflows/node-test.yml` executa `npm test` em Node.js 20 sem instalar Ollama.
- `memory.md` e `PROJECT_MEMORY.md` registram a evolução incremental do projeto.
- Não havia PRs abertas, issues abertas ou branches com `claude` encontrados nesta execução. A busca textual disponível também não indicou registros conflitantes do Claude Agent.

## Decisão tomada

Aplicar uma melhoria pequena, segura e reversível no backend: endurecer o logger estruturado para serializar detalhes não-JSON (`BigInt`, `Symbol`, funções e `Error`) sem quebrar `JSON.stringify`.

Motivo: logs estruturados são parte do backend e podem receber métricas ou erros vindos de integrações locais. Em PC fraco, o logger deve falhar o mínimo possível e nunca derrubar o servidor por um detalhe de diagnóstico não serializável.

## Arquivos alterados/criados

- `src/logger.js`
  - Adicionado tratamento seguro para `BigInt`, `Symbol` e funções.
  - Adicionado tratamento explícito para `Error`, preservando apenas `name`, `message`, `code`, `statusCode` e `cause` redigida quando existir.
  - Mantida redaction por chave sensível, limite de profundidade, limite de string e limite de arrays.

- `test/logger.test.js`
  - Adicionado teste para `redactForLog()` com valores não-JSON.
  - Adicionado teste para `createStructuredLogger()` garantindo que detalhes com `BigInt` e `Symbol` viram JSON Lines válido.
  - Mantidos testes existentes de redaction, limites e nível `silent`.

- `PROJECT_MEMORY_RUN_2026-07-01_STRUCTURED_LOGGER_NON_JSON.md`
  - Criado este registro de memória/estado da execução.

## Validações executadas

- Revisão estática dos arquivos alterados.
- Conferido que a alteração não adiciona dependências externas.
- Conferido que a alteração não executa código gerado pelo usuário.
- Conferido que a alteração não expõe segredos e mantém redaction existente.
- `npm test` não foi executado aqui por indisponibilidade de checkout local autorizado neste ambiente; a CI do GitHub deve validar o commit em Node.js 20.

## Riscos

- A serialização de `Error` omite `stack` intencionalmente para evitar exposição de caminhos locais e reduzir volume de log.
- Funções são registradas apenas como marcador textual, sem corpo, para não vazar código nem aumentar log.
- Caso algum consumidor espere `BigInt` como número em logs, agora receberá string; isso é intencional porque JSON não suporta `BigInt` nativamente.

## Pendências

1. Aguardar/validar `npm test` no GitHub Actions.
2. Testar scripts Windows em máquina real com Node.js 20 e Ollama instalado.
3. Continuar reforçando segurança e observabilidade sem aumentar dependências.
4. Evoluir documentação do fluxo de uso incremental com cliente local ou frontend simples.

## Próximo passo sugerido

Na próxima execução segura, priorizar uma melhoria pequena em testes de API/status ou documentação operacional do MVP, evitando mudanças grandes no backend já funcional.
