# Ajuste seguro do Ollama para PC fraco

Este guia registra parâmetros operacionais recomendados para usar o backend com Ollama em Windows, 8 GB de RAM, CPU e sem GPU.

O objetivo é reduzir consumo de memória e travamentos sem mudar o contrato da API nem executar código gerado pelo modelo.

## Modelo inicial recomendado

Use um modelo pequeno de programação antes de testar opções maiores:

```powershell
ollama pull qwen2.5-coder:1.5b-instruct
```

Esse modelo é o padrão do backend porque tende a caber melhor em máquinas com 8 GB de RAM quando o contexto é mantido curto.

## Limites conservadores no backend

Mantenha estes valores para máquinas fracas:

```powershell
$env:GENERATION_CONCURRENCY = "1"
$env:MAX_QUEUE_SIZE = "4"
$env:MAX_CONTEXT_FILES = "4"
$env:MAX_CONTEXT_BYTES = "12000"
$env:MAX_FILE_READ_BYTES = "32768"
$env:MAX_CACHE_ENTRIES = "20"
```

Motivo:

- `GENERATION_CONCURRENCY=1` evita múltiplas gerações simultâneas disputando RAM e CPU.
- `MAX_QUEUE_SIZE=4` evita acúmulo grande de pedidos em máquina local.
- `MAX_CONTEXT_BYTES=12000` reduz prompts enormes que podem estourar memória no runtime.
- `MAX_CONTEXT_FILES=4` força seleção de contexto pequeno e objetivo.
- `MAX_CACHE_ENTRIES=20` reaproveita respostas repetidas sem crescer indefinidamente.

## Estratégia para tarefas grandes

Para CRUDs completos, múltiplos arquivos ou contexto extenso, não force uma geração única.

Fluxo recomendado:

1. Chame `POST /api/large-code-plan` para quebrar a tarefa em etapas.
2. Execute cada etapa em `POST /api/generate-stream`.
3. Alimente a próxima etapa com um resumo pequeno da etapa anterior.
4. Revise manualmente o resultado antes de aplicar no projeto.

Isso reduz consumo de memória e mantém o backend adequado para CPU sem GPU.

## Cuidados com contexto

Prefira enviar apenas arquivos diretamente relevantes:

- uma rota ou controller por vez;
- um service/repository por vez;
- trechos de schema SQL pequenos;
- widgets Flutter/Dart específicos, não o app inteiro.

Evite enviar diretórios inteiros, builds, dependências ou arquivos grandes. A API já bloqueia `.env`, `.git`, `node_modules`, artefatos gerados, caminhos absolutos e travessia de diretório.

## Sintomas de limite atingido

Se o PC ficar lento, o Ollama demorar demais ou a API retornar timeout:

1. feche IDEs, navegadores e emuladores pesados;
2. reduza `MAX_CONTEXT_BYTES` para `8000`;
3. reduza `MAX_CONTEXT_FILES` para `2`;
4. use `/api/large-code-plan` em vez de geração única;
5. mantenha apenas um cliente chamando `/api/generate-stream` por vez.

## O que não fazer

- Não exponha `HOST=0.0.0.0` em rede pública.
- Não use modelos grandes como primeira opção em 8 GB de RAM.
- Não envie segredos, tokens, senhas ou `.env` como contexto manual.
- Não execute automaticamente código sugerido pelo modelo.
- Não aumente concorrência sem medir memória disponível.

## Checklist de operação local

Antes de uma sessão longa:

```powershell
npm run start:windows
npm run smoke:windows
```

Durante a sessão, consulte:

```powershell
Invoke-RestMethod http://127.0.0.1:3131/api/status
```

Verifique principalmente fila, cache, rate limit e limites de leitura de arquivos.
