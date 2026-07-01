# Segurança do Ollama local

Este backend foi desenhado para usar uma SLM/LLM local em PC fraco, com Windows, 8 GB de RAM e sem GPU. Por isso, o uso recomendado do Ollama é sempre em loopback local.

## Regra prática

Use `OLLAMA_URL` apontando para a própria máquina:

```text
http://127.0.0.1:11434
```

Evite configurar `OLLAMA_URL` para IPs externos, domínios públicos, túneis ou serviços remotos. Prompts de programação podem conter trechos de código, nomes de arquivos, mensagens de erro, caminhos locais e contexto do projeto.

## O que é aceito no MVP

O backend normaliza `OLLAMA_URL` e só aceita hosts de loopback:

- `localhost`
- `127.0.0.1` e demais endereços `127.x.x.x`
- `::1`

Se a variável apontar para IP de rede, domínio público, túnel ou runtime remoto, o backend volta para `http://127.0.0.1:11434`. Essa escolha é conservadora para evitar vazamento acidental de código e prompts.

## Por que isso importa

Quando `/api/generate` ou `/api/generate-stream` chama o Ollama, o backend envia o prompt final para `/api/generate`. Esse prompt pode incluir:

- descrição da tarefa;
- linguagem ou foco técnico;
- contexto manual informado pelo usuário;
- trechos de arquivos lidos por `contextFiles`;
- instruções internas do assistente local.

Manter o Ollama em `127.0.0.1` reduz o risco de vazamento acidental desse conteúdo para fora do computador.

## Configuração recomendada para Windows fraco

```powershell
$env:OLLAMA_URL="http://127.0.0.1:11434"
$env:MODEL="qwen2.5-coder:1.5b-instruct"
$env:GENERATION_CONCURRENCY="1"
$env:MAX_QUEUE_SIZE="4"
$env:MAX_CONTEXT_FILES="4"
$env:MAX_CONTEXT_BYTES="12000"
$env:MAX_CACHE_ENTRIES="20"
npm run start:windows
```

## O que o backend já faz

- Mantém `HOST` padrão em `127.0.0.1`.
- Limita corpo JSON, contexto, quantidade de arquivos e tamanho de leitura.
- Não executa código gerado pelo usuário.
- Remove usuário, senha, query string e fragmento ao normalizar `OLLAMA_URL`.
- Bloqueia `OLLAMA_URL` remoto por padrão no MVP.
- Redige campos sensíveis nos logs estruturados.
- Usa fila conservadora para evitar sobrecarga de CPU/RAM.

## Decisão de segurança para o MVP

Para o MVP, trate o backend como ferramenta local. Se algum dia for necessário usar Ollama remoto, isso deve ser uma decisão explícita, documentada e protegida por rede confiável, autenticação externa e revisão de privacidade. Não exponha este backend diretamente na internet.

## Checklist antes de usar com código real

1. Confirmar que `HOST=127.0.0.1`.
2. Confirmar que `OLLAMA_URL=http://127.0.0.1:11434`.
3. Confirmar que o modelo é pequeno o suficiente para CPU e 8 GB RAM.
4. Evitar colar segredos, tokens, senhas, `.env` reais ou chaves privadas em prompts.
5. Usar `contextFiles` apenas com arquivos necessários e permitidos.
6. Revisar qualquer código gerado antes de copiar para o projeto.
