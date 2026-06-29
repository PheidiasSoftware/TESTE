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

## Checklist antes de novas mudanças de backend

Antes de modularizar mais o `src/server.js`, confirme:

- `npm test` passa localmente;
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
