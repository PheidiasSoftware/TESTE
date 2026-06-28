# Status do MVP backend

Registro técnico do estado atual do backend local do projeto `TESTE` para orientar próximas execuções, agentes e revisões.

## Escopo do MVP

O MVP backend deve permitir que um PC fraco com Windows, 8 GB de RAM e sem GPU rode uma API local para apoio a programação em Node.js, Flutter/Dart e MySQL usando modelo pequeno via runtime local, inicialmente Ollama.

O backend não deve executar automaticamente código informado pelo usuário ou gerado pelo modelo. O foco é geração/análise textual assistida, leitura segura de contexto do projeto e integração local por HTTP.

## Critérios atendidos

- Projeto Node.js 20+ sem dependências externas pesadas.
- Servidor HTTP nativo escutando `127.0.0.1` por padrão.
- `GET /health` para diagnóstico básico.
- `GET /api/status` para métricas locais.
- `POST /api/generate` para geração via Ollama.
- `POST /api/generate-stream` com Server-Sent Events.
- `POST /api/read-file` para leitura segura de arquivos textuais pequenos.
- Fila simples de geração com concorrência conservadora.
- Cache em memória por hash de prompt integrado via `src/cache.js`.
- Leitura segura de arquivos textuais pequenos com allowlist e bloqueio de caminhos sensíveis.
- `contextFiles` em `/api/generate` reutilizando a leitura segura.
- Rate limit local em memória nas rotas pesadas.
- Logs estruturados em JSON Lines com redaction de campos sensíveis.
- Script PowerShell para início conservador no Windows.
- Testes com `node --test` sem chamar Ollama.
- CI leve com Node.js 20.
- Documentação de arquitetura, contrato da API local, streaming, rate limit, modelos leves e integração de clientes.
- README principal com links para arquitetura, contrato da API, status do MVP, streaming, rate limit, seleção de modelos e integração de clientes.
- Helpers de cliente Ollama em `src/ollama.js` para montagem de payload, parse de JSONL streaming, chamada não-streaming e leitura de stream, com testes isolados por `fetchImpl` fake.
- `src/server.js` integrado ao cliente Ollama de `src/ollama.js`, removendo duplicação direta de payload/parsing de streaming no servidor.
- `src/server.js` integrado aos helpers HTTP de `src/http.js` para JSON, SSE e leitura de corpo com `MAX_BODY_BYTES`, reduzindo duplicação local.
- Fila de geração extraída para `src/generation-queue.js`, com testes próprios para limite de fila, concorrência conservadora, falhas, configuração inválida e job inválido.
- `src/server.js` integrado ao módulo `src/generation-queue.js`, mantendo reexport para compatibilidade com testes existentes.

## Critérios parcialmente atendidos

- Modularização: já existem módulos auxiliares como `src/config.js`, `src/http.js`, `src/rate-limit.js`, `src/ollama.js`, `src/cache.js` e `src/generation-queue.js`, mas `src/server.js` ainda concentra roteamento e leitura segura de arquivos.
- Cliente Ollama: `src/ollama.js` está integrado ao servidor; falta apenas validação final por `npm test`/CI após a alteração.
- Helpers HTTP: `src/http.js` está integrado ao servidor; falta apenas validação final por `npm test`/CI após a alteração.
- Cache: `src/cache.js` está integrado ao servidor e mantém testes próprios; manter este item sob observação apenas para validação de CI/local após mudanças no `src/server.js`.
- Fila de geração: `src/generation-queue.js` está integrada ao servidor; falta validação final por `npm test`/CI após a extração.

## Não faz parte do MVP backend

- Frontend completo.
- Execução automática de código gerado.
- Sandbox de execução de código.
- Treinamento ou fine-tuning de modelo.
- Download automático de modelos grandes.
- Banco de dados, Redis ou fila persistente.
- Exposição pública da API por padrão.

## Riscos atuais

- `src/server.js` ainda tem responsabilidade alta; alterações grandes nesse arquivo aumentam risco de regressão.
- A validação final de `npm test` depende de execução local ou CI, pois o conector GitHub não executa os testes diretamente.
- Uso real depende do Ollama instalado, rodando e com modelo leve disponível.
- Em CPU fraca, respostas podem ser lentas; os limites padrão devem continuar conservadores.

## Próximas tarefas seguras recomendadas

1. Validar CI ou executar `npm test` localmente após integração de `src/http.js`, `src/ollama.js` e `src/generation-queue.js`.
2. Extrair leitura segura para `src/project-files.js` com testes próprios.
3. Depois da modularização, revisar se o backend atende formalmente ao MVP e registrar decisão.

## Decisão operacional

O backend está muito próximo do MVP funcional. A prioridade agora não deve ser adicionar recursos grandes, mas reduzir risco técnico, manter contrato de API explícito para clientes locais e integrar gradualmente os módulos auxiliares já criados.
