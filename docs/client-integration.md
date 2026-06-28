# Guia de integração para clientes locais

Este guia descreve como um cliente local, como uma extensão VS Code, app Flutter desktop ou pequena interface web local, deve consumir o backend TESTE com segurança em um PC fraco com Windows, 8 GB de RAM e sem GPU.

O objetivo é integrar a API sem executar código gerado automaticamente, sem expor arquivos sensíveis e sem sobrecarregar CPU/RAM.

## Princípios de integração

- Conectar por padrão em `http://127.0.0.1:3131`.
- Tratar o backend como serviço local e não como API pública.
- Usar `GET /health` antes de habilitar botões de geração.
- Usar `GET /api/status` para exibir fila, cache, rate limit e limites de contexto.
- Preferir `POST /api/generate-stream` para UX melhor em respostas longas.
- Usar `POST /api/generate` quando o cliente só precisar da resposta completa ao final.
- Nunca executar automaticamente código retornado pela LLM.
- Nunca enviar `.env`, segredos, tokens, chaves ou credenciais no prompt.
- Enviar poucos arquivos por vez em `contextFiles`.
- Respeitar respostas `429` e o header `Retry-After`.

## Fluxo recomendado

1. Cliente inicia e chama `GET /health`.
2. Se o backend responder `status: ok`, exibir modelo configurado, fila e limites.
3. Usuário seleciona uma tarefa curta de programação.
4. Cliente envia `task`, `language` e opcionalmente `contextFiles`.
5. Para respostas longas, cliente abre streaming SSE em `/api/generate-stream`.
6. Cliente renderiza tokens progressivamente.
7. Ao receber `done`, libera novamente o botão de geração.
8. Em caso de `error` ou HTTP `429`, mostrar mensagem simples e não repetir automaticamente em loop.

## Endpoint de saúde

```http
GET /health
```

Uso no cliente:

- validar que o backend está ligado;
- mostrar modelo ativo;
- mostrar limites de fila e contexto;
- detectar se rate limit está ativo;
- listar rotas disponíveis.

Exemplo JavaScript:

```js
async function checkBackend() {
  const response = await fetch('http://127.0.0.1:3131/health');
  if (!response.ok) throw new Error('Backend indisponível');
  return response.json();
}
```

## Geração sem streaming

```http
POST /api/generate
Content-Type: application/json
```

Payload mínimo:

```json
{
  "task": "Explique este erro de MySQL e sugira correção",
  "language": "MySQL"
}
```

Payload com contexto controlado:

```json
{
  "task": "Revise esta função e sugira melhoria simples",
  "language": "Node.js",
  "contextFiles": ["src/server.js"]
}
```

O cliente deve tratar:

- `cached: true`, indicando resposta reaproveitada do cache local;
- `contextTruncated: true`, indicando que parte do contexto foi cortada;
- `queueWaitMs`, útil para informar espera ao usuário;
- `429`, indicando excesso de chamadas.

## Geração com streaming SSE

```http
POST /api/generate-stream
Content-Type: application/json
Accept: text/event-stream
```

Eventos esperados:

- `metadata`: informações iniciais da requisição;
- `token`: pedaços de texto da resposta;
- `done`: finalização bem-sucedida;
- `error`: erro de geração.

Exemplo simples com `fetch` e leitura manual do stream:

```js
async function generateStream(payload, onToken) {
  const response = await fetch('http://127.0.0.1:3131/api/generate-stream', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'text/event-stream'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const eventBlock of events) {
      const eventLine = eventBlock.split('\n').find(line => line.startsWith('event:'));
      const dataLine = eventBlock.split('\n').find(line => line.startsWith('data:'));
      if (!eventLine || !dataLine) continue;

      const event = eventLine.slice('event:'.length).trim();
      const data = JSON.parse(dataLine.slice('data:'.length).trim());

      if (event === 'token') onToken(data.token || '');
      if (event === 'error') throw new Error(data.error || 'Erro no streaming');
      if (event === 'done') return data;
    }

    if (done) break;
  }
}
```

## Integração com Flutter/Dart

Para Flutter desktop ou app local, o cliente pode usar `HttpClient` ou pacote HTTP leve escolhido pelo app. O backend não exige autenticação no MVP porque deve ficar preso a `127.0.0.1`.

Recomendações para UI:

- desabilitar botão enquanto uma geração estiver ativa;
- mostrar texto parcial no streaming;
- limitar seleção de arquivos a extensões textuais;
- avisar quando `contextTruncated` vier `true`;
- mostrar mensagem amigável quando receber `429`;
- não enviar pastas inteiras para contexto.

## Integração com extensão VS Code

Fluxo recomendado:

- comando `TESTE: Check Backend` chama `/health`;
- comando `TESTE: Explain Selection` envia somente o trecho selecionado em `context`;
- comando `TESTE: Review Current File` envia o caminho relativo em `contextFiles`, se estiver dentro do workspace;
- comando `TESTE: Generate Small Patch Suggestion` pede apenas sugestão textual, sem aplicar automaticamente;
- aplicação de patch deve exigir confirmação explícita do usuário.

A extensão não deve:

- enviar workspace inteiro;
- ler `.env`;
- executar comandos sugeridos pela LLM;
- sobrescrever arquivos sem diff e confirmação manual;
- aumentar concorrência do backend.

## Tratamento de rate limit

Quando a API responder `429`:

- ler o header `Retry-After`;
- mostrar aviso curto ao usuário;
- manter o botão desativado por alguns segundos;
- não fazer retry agressivo;
- não abrir múltiplas gerações paralelas.

Exemplo:

```js
if (response.status === 429) {
  const retryAfterSeconds = Number(response.headers.get('retry-after') || '5');
  throw new Error(`Muitas requisições. Tente novamente em ${retryAfterSeconds}s.`);
}
```

## Segurança de arquivos

O backend já bloqueia caminhos perigosos, mas o cliente também deve filtrar antes de enviar:

- bloquear `.env` e `.env.*`;
- bloquear `.git`, `node_modules`, `dist`, `build`, `.next` e `.cache`;
- permitir apenas arquivos textuais pequenos;
- enviar no máximo poucos arquivos por chamada;
- preferir seleção manual do usuário.

## Boas tarefas para clientes locais

- explicar erro curto;
- revisar função pequena;
- sugerir teste unitário;
- explicar query SQL;
- revisar widget Flutter pequeno;
- refatorar trecho curto de Node.js;
- sugerir passos de depuração.

## Tarefas que o cliente deve evitar

- pedir análise de repositório inteiro;
- gerar projeto completo em uma chamada;
- pedir execução automática de código;
- enviar arquivos grandes;
- abrir várias chamadas simultâneas;
- pedir alterações sem revisão humana.

## Critério de aceite para cliente MVP

Um cliente simples é aceitável quando:

- detecta backend via `/health`;
- gera resposta curta via `/api/generate` ou streaming;
- respeita `429`;
- mostra erro amigável quando Ollama não está ativo;
- não envia segredos;
- não executa código automaticamente;
- permite copiar resposta ou aplicar sugestão apenas com confirmação humana.
