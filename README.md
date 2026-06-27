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

## Variáveis de ambiente

| Variável | Padrão | Uso |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Interface local do servidor |
| `PORT` | `3131` | Porta HTTP |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | URL local do Ollama |
| `MODEL` | `qwen2.5-coder:1.5b-instruct` | Modelo usado na geração |
| `MAX_BODY_BYTES` | `65536` | Limite do corpo JSON |
| `REQUEST_TIMEOUT_MS` | `120000` | Timeout da chamada ao modelo |

## Endpoints

### `GET /health`

Retorna estado básico do backend.

```bash
curl http://127.0.0.1:3131/health
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

## Decisões de arquitetura

- Sem framework no MVP para reduzir dependências e consumo de memória.
- API local vinculada por padrão a `127.0.0.1`.
- Limite de payload para evitar uso excessivo de memória.
- Timeout para evitar travamento em PC fraco.
- Prompt técnico focado em respostas curtas, seguras e úteis para código.

## Próximos passos

- Adicionar testes com `node --test`.
- Adicionar streaming em endpoint separado.
- Criar fila simples para evitar múltiplas gerações concorrentes em CPU fraca.
- Criar cache opcional por hash de prompt.
- Adicionar leitura segura de arquivos com allowlist e limite de tamanho.
- Adicionar scripts Windows para iniciar Ollama e backend.
