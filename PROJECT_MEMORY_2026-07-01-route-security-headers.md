# Memória de execução - TESTE backend LLM

## 2026-07-01 16:34 - Teste de headers nas rotas reais

### Avaliação inicial

- Repositório `PheidiasSoftware/TESTE` examinado antes de qualquer alteração.
- Arquivos analisados: `README.md`, `package.json`, `PROJECT_MEMORY.md`, `src/http.js`, `src/server.js`, `src/ollama.js`, `src/cache.js`, `test/http.test.js`, `test/server.test.js` e `docs/security-headers.md`.
- `README.md` confirma backend Node.js 20+ para LLM/SLM local com Ollama, Windows, 8 GB RAM, sem GPU, scripts PowerShell, testes offline e documentação técnica.
- `package.json` segue sem dependências externas e usa `node --test`.
- `src/http.js` centraliza headers de segurança, JSON seguro, SSE e leitura de payload com limite.
- `src/server.js` mantém endpoints locais, rate limit, fila conservadora, cache, leitura segura de arquivos e status público sanitizado.
- `PROJECT_MEMORY.md` indicava como próximo passo seguro validar headers nas rotas reais `/health`, `/api/status`, 404 e 405.
- Não foram encontrados registros claros de Claude Agent, branches, issues, PRs, arquivos de estado conflitantes ou instruções divergentes nos arquivos consultados.

### Decisão tomada

Executar uma melhoria pequena, segura e reversível: adicionar teste offline nas rotas HTTP reais para garantir que respostas JSON de sucesso, erro 404 e erro 405 mantenham o contrato centralizado de headers de segurança. A alteração aumenta a proteção contra regressões sem chamar Ollama, sem executar código gerado por usuário e sem adicionar dependências.

### Arquivos alterados/criados

- `test/server.test.js`
  - Criado helper `assertJsonSecurityHeaders(response)` para validar `content-type`, `cache-control`, CSP, `nosniff`, `x-frame-options`, `referrer-policy`, `x-robots-tag`, `cross-origin-resource-policy`, `cross-origin-opener-policy`, `x-permitted-cross-domain-policies` e `permissions-policy`.
  - Adicionado teste `rotas JSON reais mantêm headers de segurança centralizados` cobrindo `GET /health`, `GET /api/status`, rota desconhecida 404 e método errado 405.
  - Teste permanece offline e não chama o Ollama.

- `PROJECT_MEMORY_2026-07-01-route-security-headers.md`
  - Criado este registro com avaliação inicial, decisão, arquivos alterados, validações, riscos, pendências e próximo passo.

### Validações executadas

- Revisão estática manual do teste adicionado.
- Conferido que o teste usa apenas APIs nativas do Node.js 20: `node:test`, `assert` e `fetch` global.
- Conferido que o teste não chama `/api/generate` com tarefa válida, portanto não aciona Ollama.
- Conferido que a alteração não adiciona dependências externas, não altera rotas e não muda payloads da API.
- Tentativa de checkout local para executar `npm test` foi bloqueada por autorização do ambiente; validação final deve ocorrer por CI ou em checkout local com Node.js 20+.

### Riscos

- A validação ainda depende de execução real de `npm test` em ambiente autorizado.
- O helper de teste replica o contrato esperado dos headers; mudanças futuras intencionais em `src/http.js` devem atualizar este teste junto.
- O backend continua destinado a uso local em `127.0.0.1`, sem exposição pública.

### Pendências atualizadas

1. Executar `npm test` em checkout local com Node.js 20+.
2. Testar scripts PowerShell em Windows real com Ollama instalado.
3. Avaliar documentação de integração local para clientes Node.js/Flutter sem CORS amplo por padrão.
4. Continuar endurecimento incremental de contratos HTTP/SSE e testes offline.

### Próximo passo sugerido

Na próxima execução segura, priorizar documentação de integração local para clientes Node.js/Flutter ou teste offline específico para garantir que rotas de erro 400/415/422 também mantenham headers de segurança sem chamar Ollama.
