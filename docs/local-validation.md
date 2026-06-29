# Validação local do backend

Guia rápido para validar o backend local em uma máquina fraca com Windows, 8 GB de RAM e sem GPU.

O objetivo é confirmar que o servidor, os testes e os endpoints básicos continuam funcionando sem baixar modelos grandes, sem instalar dependências pesadas e sem executar código gerado por usuário.

## Pré-requisitos

- Node.js 20 ou superior.
- PowerShell no Windows.
- Opcional: Ollama instalado para testar geração real.

O projeto não depende de pacotes externos no MVP atual. Mesmo assim, rode `npm install` uma vez para manter o fluxo padrão do Node.

```powershell
npm install
```

## Validação mínima sem Ollama

Esta etapa deve funcionar mesmo sem modelo instalado.

```powershell
npm test
```

No Windows, também é possível usar o helper conservador:

```powershell
npm run test:windows
```

Esse comando executa `scripts/test-windows.ps1`, confirma que o comando foi iniciado na raiz do repositório, valida Node.js 20+, define padrões locais leves e roda apenas a suíte offline. Ele não inicia Ollama, não baixa modelos e não executa código gerado por usuário.

O helper também fixa explicitamente `MAX_BODY_BYTES=65536` e `REQUEST_TIMEOUT_MS=120000`, alinhando os limites de payload e timeout com a configuração padrão do backend e com a CI.

O teste usa o runner nativo do Node.js e cobre:

- montagem de prompt técnico;
- fila conservadora de geração;
- cache em memória;
- leitura segura de arquivos;
- montagem de contexto por arquivos;
- helpers HTTP;
- logs estruturados;
- rate limit local;
- rotas locais que não chamam o Ollama.

## Subir o backend com padrões conservadores

No Windows, prefira:

```powershell
npm run start:windows
```

Esse comando executa `scripts/start-windows.ps1`, confirma que foi iniciado na raiz do repositório, valida Node.js 20+, aplica padrões locais conservadores quando as variáveis não foram definidas, verifica se o Ollama responde em `OLLAMA_URL` e só então inicia `node src/server.js`.

Entre os padrões explícitos do helper estão `HOST=127.0.0.1`, `GENERATION_CONCURRENCY=1`, `MAX_QUEUE_SIZE=4`, `MAX_BODY_BYTES=65536`, `REQUEST_TIMEOUT_MS=120000`, limites pequenos de contexto e rate limit local ativado.

Ou, em qualquer sistema:

```powershell
npm start
```

Por padrão, o backend deve escutar apenas localmente:

```text
http://127.0.0.1:3131
```

## Testar health check

```powershell
Invoke-RestMethod http://127.0.0.1:3131/health
```

Resultado esperado:

- `status` igual a `ok`;
- `service` igual a `teste-local-code-llm-backend`;
- métricas de `queue`, `cache`, `fileRead`, `logging` e `rateLimit`;
- lista de rotas disponíveis.

## Testar status da API

```powershell
Invoke-RestMethod http://127.0.0.1:3131/api/status
```

Resultado esperado:

- modelo configurado;
- URL do Ollama configurada;
- status da fila;
- status do cache;
- configuração de leitura segura;
- configuração do rate limit.

## Testar validação de entrada sem chamar modelo

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3131/api/generate `
  -ContentType 'application/json' `
  -Body '{"language":"Node.js"}'
```

Resultado esperado: erro HTTP 400 informando que `task` precisa ser texto.

Esse teste confirma a validação antes de qualquer chamada ao runtime local.

## Testar leitura segura de arquivo

Arquivo permitido:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3131/api/read-file `
  -ContentType 'application/json' `
  -Body '{"path":"README.md"}'
```

Caminho bloqueado:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3131/api/read-file `
  -ContentType 'application/json' `
  -Body '{"path":"../package.json"}'
```

Resultado esperado para o caminho bloqueado: erro HTTP 403.

## Validação opcional com Ollama

Instale ou confirme o modelo pequeno sugerido:

```powershell
ollama pull qwen2.5-coder:1.5b-instruct
```

Confirme que o Ollama responde:

```powershell
Invoke-RestMethod http://127.0.0.1:11434/api/tags
```

Teste geração real:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3131/api/generate `
  -ContentType 'application/json' `
  -Body '{"task":"Crie uma função JavaScript simples para validar email.","language":"Node.js"}'
```

Em PC fraco, a primeira resposta pode demorar. Mantenha `GENERATION_CONCURRENCY=1` e evite prompts muito longos.

## Validação opcional de streaming

```powershell
curl.exe -N -X POST http://127.0.0.1:3131/api/generate-stream ^
  -H "Content-Type: application/json" ^
  -d "{\"task\":\"Explique uma função Dart simples.\",\"language\":\"Dart\"}"
```

Resultado esperado:

- evento `metadata` no início;
- eventos `token` durante a geração;
- evento `done` ao final;
- evento `error` se o Ollama não estiver disponível ou se houver timeout.

## Validação por CI leve

O workflow `.github/workflows/node-test.yml` roda `npm test` em Node.js 20 para `push`, `pull_request` e `workflow_dispatch`.

A CI usa os mesmos limites conservadores principais dos helpers Windows, incluindo host local, modelo leve, concorrência 1, fila pequena, cache pequeno, `MAX_BODY_BYTES=65536`, `REQUEST_TIMEOUT_MS=120000`, rate limit local e logs silenciosos.

Use a CI como evidência complementar quando não houver acesso ao PC local. A CI não substitui o teste opcional com Ollama, porque ela não instala modelo nem chama geração válida. Ela valida apenas as partes offline do backend.

Critério mínimo para seguir com novas refatorações de `src/server.js`:

- workflow `Node.js tests` concluído com sucesso no commit mais recente; ou
- `npm test` executado manualmente em um checkout limpo; e
- nenhuma falha nova em testes de contrato público (`/health`, `/api/status`, rate limit, logging e leitura segura).

Se a CI não aparecer para um commit, trate como ausência de evidência, não como falha. Nessa situação, evite mudanças grandes e prefira documentação, testes isolados ou correções pequenas e reversíveis.

## Checklist antes de novas mudanças de backend

Antes de modularizar mais o `src/server.js`, confirme:

- `npm test` ou `npm run test:windows` passa localmente;
- `npm run start:windows` inicia o backend no Windows com Node.js 20+;
- `GET /health` responde;
- `GET /api/status` responde;
- payload inválido em `/api/generate` retorna 400;
- caminho inseguro em `/api/read-file` retorna 403;
- se Ollama estiver instalado, `/api/generate` responde com modelo pequeno.

## O que não validar neste MVP

- Execução automática de código gerado.
- Download automático de modelos grandes.
- Exposição pública da API.
- Fine-tuning ou treinamento.
- Dependências como banco, Redis ou filas persistentes.
