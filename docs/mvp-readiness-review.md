# Revisão de prontidão do MVP backend

Data da revisão: 2026-06-29

Este documento registra uma avaliação técnica conservadora do backend local do projeto `TESTE`, considerando o objetivo de rodar uma LLM/SLM leve para programação em PC fraco com Windows, 8 GB de RAM e sem GPU.

## Conclusão

O backend atende aos critérios funcionais do MVP por implementação e documentação já existentes.

Ainda existe uma pendência operacional importante: confirmar `npm test` localmente ou CI verde após as extrações recentes. Enquanto essa confirmação não existir, novas mudanças em `src/server.js` devem ser evitadas ou feitas apenas em passos mínimos e reversíveis.

## Evidências revisadas

- `README.md` descreve objetivo, requisitos, scripts, variáveis de ambiente, endpoints e guias técnicos.
- `package.json` mantém projeto Node.js 20+ sem dependências externas pesadas.
- `src/server.js` usa módulos extraídos para configuração, HTTP, fila, cache, Ollama, leitura segura de arquivos, logging e rate limit.
- `src/config.js` mantém padrões conservadores para CPU fraca e uso local.
- `docs/backend-mvp-status.md` lista critérios atendidos, riscos e próximas tarefas.
- `docs/local-validation.md` define checklist de validação sem exigir Ollama.
- Testes existentes cobrem prompts, fila, cache, leitura segura, logger, helpers HTTP, Ollama e rotas HTTP locais sem chamar modelo externo.

## Critérios de MVP atendidos

- API HTTP local, escutando `127.0.0.1` por padrão.
- Integração com Ollama local, sem exigir GPU.
- Modelo padrão pequeno para programação.
- Endpoint de geração não-streaming.
- Endpoint de geração por streaming SSE.
- Leitura segura de arquivos pequenos do projeto.
- Contexto controlado por arquivos com limite de tamanho e quantidade.
- Fila simples de geração com concorrência conservadora.
- Cache em memória limitado para prompts repetidos.
- Rate limit local em rotas pesadas.
- Logs estruturados com redaction de campos sensíveis.
- Script Windows com padrões conservadores.
- Documentação técnica suficiente para instalação, uso e validação local.
- Testes básicos sem dependência de Ollama, GPU ou downloads de modelo.

## Pendências antes de declarar estabilidade

1. Executar `npm test` em ambiente local com Node.js 20+.
2. Confirmar CI verde no GitHub Actions quando houver run disponível.
3. Fazer um teste manual opcional com Ollama local e `qwen2.5-coder:1.5b-instruct`.
4. Validar no Windows com 8 GB de RAM usando `npm run start:windows`.

## Próximas tarefas seguras depois da validação

- Extrair roteamento/handlers de `src/server.js` para módulo dedicado, apenas se os testes estiverem verdes.
- Adicionar exemplos de clientes simples para Node.js e Flutter/Dart.
- Criar checklist de release local para uso em PC fraco.
- Adicionar testes de contrato para presença de `rateLimit`, `logging`, `queue` e `cache` nas respostas públicas.

## Fora do MVP

- Frontend completo.
- Execução automática ou sandbox de código.
- Banco de dados persistente.
- Treinamento/fine-tuning.
- Suporte obrigatório a GPU.
- Exposição pública da API.

## Decisão operacional

A próxima execução deve priorizar validação e redução de risco, não novos recursos grandes. Se CI/testes forem confirmados como verdes, o backend pode ser registrado como MVP funcional completo e as próximas melhorias devem ser tratadas como hardening pós-MVP.