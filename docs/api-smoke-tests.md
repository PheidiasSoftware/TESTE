# Smoke tests HTTP offline da API

Guia curto para validar o contrato HTTP do backend local sem chamar Ollama, sem baixar modelos e sem executar codigo gerado por usuario.

Use estes testes depois de `npm test` ou quando precisar validar rapidamente uma instalacao em Windows fraco com 8 GB de RAM e sem GPU.

## Subir o backend

No Windows:

```powershell
npm run start:windows
```

Ou, se ja tiver as variaveis definidas:

```powershell
npm start
```

Base URL padrao:

```text
http://127.0.0.1:3131
```

## 1. Health check sanitizado

```powershell
Invoke-RestMethod http://127.0.0.1:3131/health
```

Resultado esperado:

- `status` igual a `ok`;
- `ollama.endpoint` igual a `redacted`;
- resposta sem `ollamaUrl`;
- `fileRead` sem `projectRoot` absoluto;
- lista `routes` contendo as rotas publicas.

## 2. Status operacional sanitizado

```powershell
Invoke-RestMethod http://127.0.0.1:3131/api/status
```

Resultado esperado:

- metricas de fila, cache, rate limit, leitura segura e logs;
- nenhuma URL real do Ollama;
- nenhum caminho absoluto do projeto.

## 3. Content-Type nao JSON deve ser rejeitado

Este teste confirma que rotas `POST` nao tentam ler payload textual inesperado.

```powershell
try {
  Invoke-RestMethod `
    -Method Post `
    -Uri http://127.0.0.1:3131/api/generate `
    -ContentType 'text/plain' `
    -Body 'task=Gerar codigo'
} catch {
  $_.Exception.Response.StatusCode.value__
}
```

Resultado esperado: `415`.

## 4. Payload JSON invalido deve falhar antes de chamar modelo

```powershell
try {
  Invoke-RestMethod `
    -Method Post `
    -Uri http://127.0.0.1:3131/api/generate `
    -ContentType 'application/json' `
    -Body '{invalido'
} catch {
  $_.Exception.Response.StatusCode.value__
}
```

Resultado esperado: `400`.

## 5. Task ausente deve falhar sem Ollama

```powershell
try {
  Invoke-RestMethod `
    -Method Post `
    -Uri http://127.0.0.1:3131/api/generate `
    -ContentType 'application/json' `
    -Body '{"language":"Node.js"}'
} catch {
  $_.Exception.Response.StatusCode.value__
}
```

Resultado esperado: `400` com mensagem sobre `task` obrigatoria.

## 6. Tarefa grande deve sugerir planejamento incremental

```powershell
try {
  Invoke-RestMethod `
    -Method Post `
    -Uri http://127.0.0.1:3131/api/generate `
    -ContentType 'application/json' `
    -Body '{"task":"Criar CRUD completo de clientes com rotas, service, repository e testes","language":"Node.js","contextFiles":["src/server.js","src/config.js","src/http.js","src/logger.js"],"targetFiles":["src/modules/customers/routes.js"]}'
} catch {
  $_.Exception.Response.StatusCode.value__
}
```

Resultado esperado: `422` com `largeCodeSuggestion.recommendedEndpoint` apontando para `POST /api/large-code-plan`.

## 7. Plano grande deve funcionar sem Ollama

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:3131/api/large-code-plan `
  -ContentType 'application/json' `
  -Body '{"task":"Criar CRUD completo de clientes com testes","language":"Node.js","contextFiles":["src/server.js"],"targetFiles":["src/modules/customers/routes.js"]}'
```

Resultado esperado:

- `mode` igual a `chunked-large-code-generation`;
- primeira etapa `architecture-plan`;
- ultima etapa `integration-review`;
- nenhuma chamada ao Ollama.

## 8. Metodo incorreto em rota conhecida

```powershell
try {
  Invoke-RestMethod http://127.0.0.1:3131/api/generate
} catch {
  $_.Exception.Response.StatusCode.value__
  $_.Exception.Response.Headers.Allow
}
```

Resultado esperado:

- status `405`;
- header `Allow` igual a `POST`.

## 9. Caminho inseguro na leitura de arquivo

```powershell
try {
  Invoke-RestMethod `
    -Method Post `
    -Uri http://127.0.0.1:3131/api/read-file `
    -ContentType 'application/json' `
    -Body '{"path":"../package.json"}'
} catch {
  $_.Exception.Response.StatusCode.value__
}
```

Resultado esperado: `403`.

## Observacoes de seguranca

- Estes testes nao executam codigo gerado pelo modelo.
- O backend deve permanecer em `127.0.0.1` por padrao.
- Nao use modelos grandes em PC fraco sem necessidade.
- Use geracao incremental para tarefas grandes.
- Trate ausencia de CI/checks como ausencia de evidencia, nao como sucesso.
