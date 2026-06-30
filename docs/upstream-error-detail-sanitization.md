# Sanitização de detalhes de erro do runtime local

Registro técnico da proteção aplicada aos detalhes de erro recebidos do runtime local Ollama.

## Objetivo

Evitar que falhas do runtime local devolvam ao cliente detalhes excessivos, multilinha ou com caracteres de controle. O backend continua informando `HTTP 502` quando a chamada ao Ollama falha, mas o campo `detail` agora é reduzido e normalizado antes de sair de `src/ollama.js`.

## Comportamento implementado

`sanitizeUpstreamErrorDetail()` aplica as seguintes regras:

- aceita apenas texto;
- remove caracteres de controle e quebras de linha;
- compacta espaços repetidos;
- remove espaços nas extremidades;
- limita o detalhe final a 300 caracteres;
- retorna `undefined` quando não houver detalhe textual útil.

Essa sanitização é usada tanto em geração normal quanto em geração por streaming quando o Ollama responde com erro HTTP.

## Motivo

O backend é local, mas ainda deve manter contrato previsível e seguro. Mensagens brutas de runtimes podem conter texto multilinha, payload grande, caminhos locais, nomes internos ou ruído operacional. Sanitizar o detalhe reduz exposição acidental sem esconder o erro principal.

## Validação esperada

Cobertura adicionada em `test/ollama.test.js`:

- sanitização remove quebras de linha e tabulações;
- detalhe é limitado a 300 caracteres;
- valores vazios ou não textuais são omitidos;
- falha simulada do Ollama retorna `502` com detalhe sanitizado.

## Limites conhecidos

- A sanitização não tenta classificar semanticamente todo conteúdo sensível; ela reduz forma e tamanho.
- O campo `error` permanece genérico: `Falha ao chamar Ollama.` ou `Falha ao chamar Ollama em streaming.`
- A confirmação final ainda depende de `npm test`, `npm run test:windows` ou CI verde no commit mais recente.
