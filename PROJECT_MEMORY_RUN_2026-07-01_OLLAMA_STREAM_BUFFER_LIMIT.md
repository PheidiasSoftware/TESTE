# PROJECT MEMORY RUN - 2026-07-01 - Ollama stream buffer limit

## Avaliacao inicial

- Repositorio PheidiasSoftware/TESTE examinado antes de qualquer alteracao.
- Arquivos verificados: README.md, package.json, .github/workflows/node-test.yml, src/server.js, src/http.js, src/config.js, src/ollama.js, test/http.test.js, test/ollama.test.js e PROJECT_MEMORY.md.
- README.md confirma backend leve para LLM/SLM local em Windows/Linux, Node.js 20+, 8 GB RAM, sem GPU obrigatoria, Ollama local, endpoints, testes, guias tecnicos e variaveis conservadoras.
- package.json continua sem dependencias externas e com scripts start, start:windows, dev, test, test:windows e smoke:windows.
- Workflow node-test.yml usa Node.js 20 e npm test, sem instalar Ollama nem baixar modelos.
- src/server.js possui API local com health, status, generate, generate-stream, read-file e large-code-plan, alem de fila, cache, rate limit, leitura segura, logs estruturados e SSE.
- src/ollama.js centraliza cliente Ollama, payload conservador, geracao normal, streaming JSONL e erros seguros.
- Busca de issues abertas para Claude, Agent, backend, Ollama e TODO nao retornou resultados.
- Busca de PRs abertos para Claude, Agent, backend, Ollama e TESTE nao retornou resultados.
- Nao foram encontrados registros conflitantes do Claude Agent nos arquivos examinados ou nas buscas disponiveis.

## Decisao tomada

Aplicar uma melhoria pequena, segura e reversivel no backend: limitar o tamanho de uma linha JSONL pendente no streaming do Ollama. Isso reduz risco de crescimento indefinido de memoria se o runtime local retornar dados malformados ou uma resposta sem quebras de linha, cenario importante para Windows com 8 GB RAM e sem GPU.

## Arquivos alterados/criados

- src/ollama.js
  - Adicionado MAX_OLLAMA_STREAM_LINE_CHARS = 262_144.
  - readOllamaStream agora valida o tamanho do buffer pendente antes de dividir por nova linha.
  - Quando o limite e excedido, retorna erro upstream seguro 502 sem expor detalhe bruto ao cliente.
  - Mantido releaseLock no finally.

- test/ollama.test.js
  - Importado MAX_OLLAMA_STREAM_LINE_CHARS.
  - Adicionado teste offline para stream malformado com linha maior que o limite.
  - O teste valida statusCode 502, mensagem segura, exposeDetail false e detalhe interno sanitizado.

- PROJECT_MEMORY_RUN_2026-07-01_OLLAMA_STREAM_BUFFER_LIMIT.md
  - Criada esta memoria de execucao.

## Validacoes executadas

- Revisao estatica dos arquivos alterados.
- Conferido que a alteracao nao chama Ollama, nao executa codigo gerado pelo usuario e nao adiciona dependencias externas.
- Conferido que a protecao afeta apenas streaming malformado ou linha JSONL excessiva e preserva fluxo normal de tokens pequenos.
- npm test nao foi executado aqui por falta de checkout local/runtime shell autorizado neste fluxo; a CI existente deve validar em push.

## Riscos

- Se algum runtime compativel com Ollama enviar linhas JSONL extremamente grandes sem quebra de linha, a requisicao de streaming sera encerrada com erro 502. Para o uso esperado do Ollama, cada frame JSONL deve ser pequeno, entao o risco e baixo.
- O limite e constante interna, nao variavel de ambiente. Isso mantem o MVP simples; se necessario, pode virar configuracao no futuro.

## Pendencias

1. Verificar status da CI para os commits desta execucao quando disponivel.
2. Executar npm test localmente em Windows/Node.js 20+.
3. Considerar teste adicional de integracao HTTP para generate-stream usando mock de cliente Ollama em execucao futura, se a arquitetura for ajustada para injecao de dependencia.
4. Continuar melhorias pequenas de seguranca/performance sem dependencias pesadas.

## Proximo passo sugerido

Na proxima execucao segura, priorizar uma melhoria de documentacao curta ou um teste offline de contrato ja existente, mantendo o backend leve e adequado para PC fraco.
