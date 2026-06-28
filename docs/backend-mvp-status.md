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
- Cache em memória por hash de prompt.
- Leitura segura de arquivos textuais pequenos com allowlist e bloqueio de caminhos sensíveis.
- `contextFiles` em `/api/generate` reutilizando a leitura segura.
- Rate limit local em memória nas rotas pesadas.
- Logs estruturados em JSON Lines com redaction de campos sensíveis.
- Script PowerShell para início conservador no Windows.
- Testes com `node --test` sem chamar Ollama.
- CI leve com Node.js 20.
- Documentação de arquitetura, contrato da API local, streaming, rate limit, modelos leves e integração de clientes.
- README principal com links para arquitetura, contrato da API, status do MVP, streaming, rate limit, seleção de modelos e integração de clientes.

## Critérios parcialmente atendidos

- Modularização: já existem módulos auxiliares como `src/config.js`, `src/http.js`, `src/rate-limit.js`, `src/ollama.js` e `src/cache.js`, mas `src/server.js` ainda concentra parte da lógica principal.
- Cliente Ollama: `src/ollama.js` já possui helpers testáveis para payload e parsing de streaming, mas a integração completa no servidor deve ser feita em passo pequeno e validado.
- Cache: `src/cache.js` já possui implementação testável equivalente ao cache atual do servidor, mas ainda falta trocar o cache interno de `src/server.js` pelo módulo.

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

1. Integrar `src/ollama.js` em `src/server.js` em commit pequeno, substituindo apenas montagem de payload e parsing de linha de streaming.
2. Integrar `src/http.js` em `src/server.js` em commit pequeno, preservando `MAX_BODY_BYTES`.
3. Integrar `src/cache.js` em `src/server.js` substituindo a função interna duplicada, sem alterar o formato de `/health` e `/api/status`.
4. Extrair fila para `src/generation-queue.js` com testes próprios.
5. Extrair leitura segura para `src/project-files.js` com testes próprios.
6. Depois da modularização, revisar se o backend atende formalmente ao MVP e registrar decisão.

## Decisão operacional

O backend está muito próximo do MVP funcional. A prioridade agora não deve ser adicionar recursos grandes, mas reduzir risco técnico, manter contrato de API explícito para clientes locais e integrar gradualmente os módulos auxiliares já criados.
