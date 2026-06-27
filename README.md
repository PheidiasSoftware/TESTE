# TESTE Local Code LLM Backend

Backend leve para uma LLM/SLM local focada em programação, pensado para PC fraco com Windows, 8 GB de RAM e sem GPU.

## Objetivo

Fornecer uma API local simples para auxiliar programação em Node.js, Flutter/Dart e MySQL usando um runtime local leve, inicialmente Ollama.

## Requisitos recomendados

- Windows 10/11 ou Linux
- Node.js 20+
- 8 GB de RAM
- Sem GPU obrigatória
- Ollama instalado e rodando localmente

Modelo padrão sugerido:

```bash
ollama pull qwen2.5-coder:1.5b-instruct
```

Esse modelo é pequeno o bastante para testes iniciais em CPU. Em máquinas muito limitadas, reduza contexto, feche apps pesados e evite prompts longos.

## Como rodar

```bash
npm install
npm start
```

Como o projeto ainda não usa dependências externas, `npm install` apenas prepara o projeto Node.

Servidor padrão:

```text
http://127.0.0.1:3131
```

## Testes

O projeto usa o test runner nativo do Node.js, sem dependências externas:

```bash
npm test
```

Os testes atuais validam:

- montagem do prompt técnico sem chamar Ollama;
- fila de geração, limite de fila cheia e concorrência conservadora;
- cache simples por hash de prompt, incluindo reaproveitamento e limite de entradas;
- rotas HTTP locais `GET /health`, `GET /api/status`, `POST /api/generate` com entrada inválida e rota 404.

Esses testes não chamam o Ollama nem exigem modelo instalado, então podem rodar em máquina fraca apenas com Node.js 20+.

## Variáveis de ambiente

| Variável | Padrão | Uso |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Interface local do servidor |
| `PORT` | `3131` | Porta HTTP |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | URL local do Ollama |
| `MODEL` | `qwen2.5-coder:1.5b-instruct` | Modelo usado na geração |
| `MAX_BODY_BYTES` | `65536` | Limite do corpo JSON |
| `REQUEST_TIMEOUT_MS` | `120000` | Timeout da chamada ao modelo |
| `MAX_QUEUE_SIZE` | `4` | Quantidade máxima de pedidos aguardando geração |
| `GENERATION_CONCURRENCY` | `1` | Gerações simultâneas; manter `1` em PC fraco sem GPU |
| `ENABLE_PROMPT_CACHE` | `true` | Ativa cache em memória para prompts repetidos |
| `MAX_CACHE_ENTRIES` | `20` | Quantidade máxima de respostas em cache |

## Endpoints

### `GET /health`

Retorna estado básico do backend, situação da fila e métricas do cache.

```bash
curl http://127.0.0.1:3131/health
```

### `GET /api/status`

Retorna métricas simples de uso da fila e do cache, incluindo gerações ativas, pendentes, concluídas, falhas, acertos e descartes de cache.

```bash
curl http://127.0.0.1:3131/api/status
```

### `POST /api/generate`

Gera resposta de programação usando o modelo local.

```bash
curl -X POST http://127.0.0.1:3131/api/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"task\":\"Crie uma função JS para validar email\",\"language\":\"Node.js\"}"
```

Campos aceitos:

- `task` obrigatório: tarefa de programação.
- `language` opcional: foco técnico, por exemplo `Node.js`, `Dart`, `Flutter`, `MySQL`.
- `context` opcional: trecho controlado do projeto.

A resposta informa `cached: true` quando a resposta veio do cache local em memória.

## Proteção para PC fraco

O backend usa uma fila simples de geração para evitar sobrecarregar CPU e RAM. Por padrão, apenas uma geração roda por vez (`GENERATION_CONCURRENCY=1`) e até quatro ficam aguardando (`MAX_QUEUE_SIZE=4`). Quando a fila enche, a API responde `429` em vez de deixar o computador travar.

Também existe cache em memória por hash de prompt. Em perguntas repetidas, o backend pode responder sem chamar o Ollama novamente, economizando CPU. O cache é pequeno por padrão (`MAX_CACHE_ENTRIES=20`) e é perdido ao reiniciar o backend, o que mantém o MVP simples e reversível.

Para máquina com 8 GB RAM e sem GPU, recomenda-se manter:

```text
GENERATION_CONCURRENCY=1
MAX_QUEUE_SIZE=4
ENABLE_PROMPT_CACHE=true
MAX_CACHE_ENTRIES=20
```

Se a máquina ficar com pouca memória, reduza `MAX_CACHE_ENTRIES` ou desative com `ENABLE_PROMPT_CACHE=false`.

## Decisões de arquitetura

- Sem framework no MVP para reduzir dependências e consumo de memória.
- API local vinculada por padrão a `127.0.0.1`.
- Limite de payload para evitar uso excessivo de memória.
- Timeout para evitar travamento em PC fraco.
- Fila de concorrência baixa para evitar múltiplas inferências simultâneas.
- Cache em memória pequeno para economizar CPU em prompts repetidos.
- Funções de prompt, cache, fila e servidor exportadas para testes sem iniciar o processo via `npm start`.
- Rotas HTTP básicas testadas sem depender do Ollama.
- Prompt técnico focado em respostas curtas, seguras e úteis para código.

## Próximos passos

- Adicionar endpoint de streaming em rota separada.
- Adicionar leitura segura de arquivos com allowlist e limite de tamanho.
- Adicionar scripts Windows para iniciar Ollama e backend.
- Documentar integração futura com plugin/extensão VS Code.
- Considerar CI leve com GitHub Actions usando Node.js 20.
