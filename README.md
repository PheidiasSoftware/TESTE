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

Os testes atuais validam funções puras do backend, incluindo montagem do prompt e comportamento da fila de geração. Eles não chamam o Ollama, então podem rodar mesmo em máquina fraca ou sem modelo instalado.

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

## Endpoints

### `GET /health`

Retorna estado básico do backend e situação da fila.

```bash
curl http://127.0.0.1:3131/health
```

### `GET /api/status`

Retorna métricas simples de uso da fila, incluindo gerações ativas, pendentes, concluídas e falhas.

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

## Proteção para PC fraco

O backend usa uma fila simples de geração para evitar sobrecarregar CPU e RAM. Por padrão, apenas uma geração roda por vez (`GENERATION_CONCURRENCY=1`) e até quatro ficam aguardando (`MAX_QUEUE_SIZE=4`). Quando a fila enche, a API responde `429` em vez de deixar o computador travar.

Para máquina com 8 GB RAM e sem GPU, recomenda-se manter:

```text
GENERATION_CONCURRENCY=1
MAX_QUEUE_SIZE=4
```

## Decisões de arquitetura

- Sem framework no MVP para reduzir dependências e consumo de memória.
- API local vinculada por padrão a `127.0.0.1`.
- Limite de payload para evitar uso excessivo de memória.
- Timeout para evitar travamento em PC fraco.
- Fila de concorrência baixa para evitar múltiplas inferências simultâneas.
- Funções de prompt e fila exportadas para testes unitários sem iniciar servidor nem chamar Ollama.
- Prompt técnico focado em respostas curtas, seguras e úteis para código.

## Próximos passos

- Adicionar endpoint de streaming em rota separada.
- Criar cache opcional por hash de prompt.
- Adicionar leitura segura de arquivos com allowlist e limite de tamanho.
- Adicionar scripts Windows para iniciar Ollama e backend.
- Expandir testes para rotas HTTP locais sem depender do Ollama.
