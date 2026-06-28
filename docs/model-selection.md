# Guia de seleção de modelos leves para programação

Este documento orienta a escolha de modelos locais pequenos para o backend TESTE em PCs fracos com Windows, 8 GB de RAM e sem GPU.

O objetivo é ajudar programação em Node.js, Flutter/Dart e MySQL sem travar a máquina e sem assumir hardware acima do mínimo do projeto.

## Princípios

- Preferir modelos pequenos, quantizados e próprios para código.
- Manter apenas um modelo carregado por vez quando possível.
- Usar contexto curto para reduzir consumo de RAM e CPU.
- Evitar prompts enormes com muitos arquivos ao mesmo tempo.
- Priorizar respostas objetivas, com exemplos curtos e sem geração excessiva.
- Validar tudo em ambiente local antes de aumentar limites.

## Modelo padrão recomendado

```powershell
ollama pull qwen2.5-coder:1.5b-instruct
```

Configuração padrão do backend:

```text
MODEL=qwen2.5-coder:1.5b-instruct
GENERATION_CONCURRENCY=1
MAX_QUEUE_SIZE=4
MAX_CONTEXT_FILES=4
MAX_CONTEXT_BYTES=12000
REQUEST_TIMEOUT_MS=120000
```

Esse é o ponto de partida mais seguro para CPU e 8 GB de RAM.

## Alternativas leves

Use alternativas apenas se o modelo padrão não atender bem ao caso de uso ou se o usuário aceitar testar qualidade versus desempenho.

| Modelo | Quando considerar | Observação |
| --- | --- | --- |
| `qwen2.5-coder:1.5b-instruct` | Padrão para programação leve | Melhor equilíbrio inicial para código em PC fraco |
| `qwen2.5-coder:0.5b` | Máquina muito limitada | Mais rápido, mas pode errar mais em tarefas complexas |
| `deepseek-coder:1.3b` | Testes de geração curta de código | Pode variar conforme disponibilidade local no Ollama |
| `phi3:mini` | Explicações gerais e pequenas tarefas | Não é tão focado em código quanto modelos coder |

Evite modelos grandes em 8 GB RAM sem GPU, especialmente 7B ou maiores, salvo se estiverem muito bem quantizados e o usuário aceitar lentidão e risco de swap.

## Configuração conservadora para Windows

Em PowerShell, antes de iniciar o backend:

```powershell
$env:MODEL="qwen2.5-coder:1.5b-instruct"
$env:GENERATION_CONCURRENCY="1"
$env:MAX_QUEUE_SIZE="4"
$env:MAX_CONTEXT_FILES="4"
$env:MAX_CONTEXT_BYTES="12000"
$env:MAX_CACHE_ENTRIES="20"
$env:LOG_LEVEL="info"
npm run start:windows
```

Para máquina sofrendo com memória, reduza:

```powershell
$env:MAX_CONTEXT_FILES="2"
$env:MAX_CONTEXT_BYTES="6000"
$env:MAX_CACHE_ENTRIES="5"
$env:LOG_LEVEL="warn"
```

## Sinais de que o modelo está pesado demais

- Windows começa a usar muita memória virtual/swap.
- Respostas demoram muitos minutos para tarefas simples.
- Ollama encerra ou reinicia durante geração.
- O navegador/VS Code ficam sem resposta.
- O backend retorna timeout com frequência.

Ação recomendada:

1. Fechar aplicativos pesados.
2. Reduzir `MAX_CONTEXT_BYTES`.
3. Reduzir `MAX_CONTEXT_FILES`.
4. Reduzir `MAX_CACHE_ENTRIES`.
5. Usar modelo menor.
6. Manter `GENERATION_CONCURRENCY=1`.

## Tarefas adequadas para o MVP

Boas tarefas:

- Criar funções pequenas em Node.js.
- Revisar trechos curtos de Dart/Flutter.
- Explicar erro simples de MySQL.
- Sugerir refatoração pequena.
- Gerar testes unitários curtos.
- Explicar código de um arquivo pequeno lido por `/api/read-file`.

Tarefas ruins para PC fraco:

- Analisar repositório inteiro de uma vez.
- Gerar projetos completos em uma chamada.
- Pedir muitos arquivos grandes no contexto.
- Rodar múltiplas gerações simultâneas.
- Usar modelo grande sem GPU.

## Relação com segurança

A seleção de modelo não muda as regras de segurança do backend:

- o backend não executa código gerado;
- leitura de arquivos continua limitada por allowlist;
- `.env`, `.git`, `node_modules` e artefatos gerados continuam bloqueados;
- logs não devem registrar prompt, contexto, conteúdo de arquivo nem resposta;
- rate limit e fila continuam ativos por padrão.

## Critério de aceite para trocar modelo padrão

Troque o padrão somente quando houver evidência prática de que a alternativa:

- roda em Windows com 8 GB RAM sem GPU;
- responde tarefas pequenas de código com qualidade aceitável;
- não exige dependências pesadas;
- não aumenta a concorrência;
- mantém tempo de resposta tolerável;
- não provoca uso excessivo de memória.

Registre a decisão em `PROJECT_MEMORY.md` ou em um arquivo de memória de execução antes de assumir o novo padrão.
